import cron from "node-cron";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createKeeperAgent, createLLM } from "@/electron/appAgent";
import { ToolContext } from "@/electron/appAgent/toolContext";
import { encryptionService } from "@/electron/service/encrypt";
import { scheduleDB } from "@/electron/database/schedule";
import { scheduleLogDB } from "@/electron/database/scheduleLog";
import { preferenceDB } from "@/electron/database/preference";
import { telegramBotService } from "@/electron/chatGateway/adapters/telegram";
import { logEveryWhere } from "@/electron/service/util";
import { JobModel } from "@/electron/database/index";
import type { ISchedule, IJob, IScheduleLog } from "@/electron/type";
import {
  LLMProvider,
  ScheduleType,
  JobType,
  JobConditionType,
  AgentScheduleStatus,
} from "@/electron/type";

const MAX_CONCURRENT_RUNS = 2;
const RETRY_POLL_INTERVAL_MS = 30_000;

class AgentTaskScheduler {
  private tasks = new Map<number, cron.ScheduledTask>();
  private activeRuns = new Set<number>();
  private retryPollTimer: NodeJS.Timeout | null = null;

  init = async (): Promise<void> => {
    try {
      const [schedules] = await scheduleDB.getActiveAgentSchedules();
      if (!schedules) {
        return;
      }
      for (const schedule of schedules) {
        try {
          this.register(schedule);
        } catch (err: any) {
          logEveryWhere({
            message: `AgentTaskScheduler.init(): failed to register schedule ${schedule.id}: ${err?.message}`,
          });
        }
      }
      this.startRetryPoller();
      logEveryWhere({
        message: `AgentTaskScheduler: initialized ${schedules.length} schedule(s)`,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `AgentTaskScheduler.init() error: ${err?.message}`,
      });
    }
  };

  register = (schedule: ISchedule): void => {
    if (!schedule.id || !schedule.cronExpr) {
      return;
    }
    if (this.tasks.has(schedule.id)) {
      this.unregister(schedule.id);
    }
    if (!cron.validate(schedule.cronExpr)) {
      logEveryWhere({
        message: `AgentTaskScheduler: invalid cronExpr "${schedule.cronExpr}" for schedule ${schedule.id}`,
      });
      return;
    }

    const task = cron.schedule(schedule.cronExpr, () => {
      this.executeSchedule(schedule.id!).catch((err) => {
        logEveryWhere({
          message: `AgentTaskScheduler: cron fire error for schedule ${schedule.id}: ${err?.message}`,
        });
      });
    });

    this.tasks.set(schedule.id, task);
  };

  unregister = (scheduleId: number): void => {
    const task = this.tasks.get(scheduleId);
    if (!task) {
      return;
    }
    task.stop();
    this.tasks.delete(scheduleId);
  };

  reschedule = (schedule: ISchedule): void => {
    if (!schedule.id) {
      return;
    }
    this.unregister(schedule.id);
    if (schedule.isActive && !schedule.isPaused && schedule.cronExpr) {
      this.register(schedule);
    }
  };

  pause = async (scheduleId: number): Promise<void> => {
    await scheduleDB.updateSchedule({
      id: scheduleId,
      isPaused: true,
    } as ISchedule);
  };

  resume = async (scheduleId: number): Promise<void> => {
    await scheduleDB.updateSchedule({
      id: scheduleId,
      isPaused: false,
    } as ISchedule);
  };

  runNow = async (scheduleId: number): Promise<void> => {
    await this.executeSchedule(scheduleId);
  };

  private executeSchedule = async (scheduleId: number): Promise<void> => {
    const [schedule] = await scheduleDB.getOneSchedule(scheduleId);
    if (!schedule) {
      return;
    }
    if (schedule.isPaused || !schedule.isActive) {
      return;
    }

    if (this.activeRuns.size >= MAX_CONCURRENT_RUNS) {
      await scheduleLogDB.createScheduleLog({
        scheduleId,
        status: AgentScheduleStatus.SKIPPED,
        type: ScheduleType.AGENT,
        errorMessage: `Skipped: concurrency limit (${MAX_CONCURRENT_RUNS}) reached`,
        startedAt: Date.now(),
        finishedAt: Date.now(),
      });
      logEveryWhere({
        message: `AgentTaskScheduler: schedule ${scheduleId} skipped — concurrency limit reached`,
      });
      return;
    }

    this.activeRuns.add(scheduleId);
    try {
      const jobs: IJob[] = (schedule.listJob || [])
        .filter((j) => j.type === JobType.AGENT)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      let prevLog: IScheduleLog | null = null;

      for (const job of jobs) {
        prevLog = await this.executeAgentJob(schedule, job, prevLog);
        if (
          prevLog?.status === AgentScheduleStatus.ERROR ||
          prevLog?.status === AgentScheduleStatus.SKIPPED
        ) {
          continue;
        }

        await JobModel.update(
          { isCompleted: true, lastEndTime: Date.now() },
          { where: { id: job.id } },
        );
      }
    } finally {
      this.activeRuns.delete(scheduleId);
    }
  };

  private executeAgentJob = async (
    schedule: ISchedule,
    job: IJob,
    prevLog: IScheduleLog | null,
  ): Promise<IScheduleLog> => {
    const shouldSkip = await this.evaluateCondition(job, prevLog);
    if (shouldSkip) {
      const [log] = await scheduleLogDB.createScheduleLog({
        scheduleId: schedule.id!,
        jobId: job.id,
        type: JobType.AGENT,
        status: AgentScheduleStatus.SKIPPED,
        errorMessage: "Condition evaluated to skip",
        startedAt: Date.now(),
        finishedAt: Date.now(),
      });
      return log!;
    }

    const [logEntry] = await scheduleLogDB.createScheduleLog({
      scheduleId: schedule.id!,
      jobId: job.id,
      type: JobType.AGENT,
      status: AgentScheduleStatus.RUNNING,
      retryCount: 0,
      startedAt: Date.now(),
    });

    return this.runWithRetry(schedule, job, logEntry!, prevLog, 0);
  };

  private runWithRetry = async (
    schedule: ISchedule,
    job: IJob,
    logEntry: IScheduleLog,
    prevLog: IScheduleLog | null,
    attempt: number,
  ): Promise<IScheduleLog> => {
    try {
      const result = await this.runAgentJob(schedule, job, prevLog);

      const [updated] = await scheduleLogDB.updateScheduleLog({
        id: logEntry.id!,
        status: AgentScheduleStatus.SUCCESS,
        result,
        retryCount: attempt,
        finishedAt: Date.now(),
      });
      return updated!;
    } catch (err: any) {
      const maxRetries = job.maxRetries || 0;

      if (attempt < maxRetries) {
        const delayMs = (job.retryDelayMinutes || 5) * 60_000;
        const nextRetryAt = Date.now() + delayMs;

        const [updated] = await scheduleLogDB.updateScheduleLog({
          id: logEntry.id!,
          status: AgentScheduleStatus.RETRYING,
          errorMessage: err?.message,
          retryCount: attempt + 1,
          nextRetryAt,
        });
        return updated!;
      }

      const [failed] = await scheduleLogDB.updateScheduleLog({
        id: logEntry.id!,
        status: AgentScheduleStatus.ERROR,
        errorMessage: err?.message,
        retryCount: attempt,
        finishedAt: Date.now(),
      });

      await this.notifyFailure(schedule, job, err?.message);
      return failed!;
    }
  };

  private runAgentJob = async (
    schedule: ISchedule,
    job: IJob,
    prevLog: IScheduleLog | null,
  ): Promise<string> => {
    const memoryFile = schedule.memoryFileKey
      ? `AGENT_${schedule.memoryFileKey}.md`
      : `AGENT_SCHEDULED_${schedule.id}.md`;

    const toolContext = new ToolContext();

    if (job.secretKey) {
      try {
        toolContext.update({
          encryptKey: encryptionService.decryptData(job.secretKey),
        });
      } catch {
        logEveryWhere({
          message: `AgentTaskScheduler: failed to decrypt encryptKey for job ${job.id}`,
        });
      }
    }

    if (job.toolContextJson) {
      try {
        const ctx = JSON.parse(job.toolContextJson);
        if (ctx.nodeEndpointGroupId) {
          toolContext.update({ nodeEndpointGroupId: ctx.nodeEndpointGroupId });
        }
      } catch {
        logEveryWhere({
          message: `AgentTaskScheduler: failed to parse toolContextJson for job ${job.id}`,
        });
      }
    }

    const [preference] = await preferenceDB.getOnePreference();

    const { agent, cleanup } = await createKeeperAgent({
      provider: LLMProvider.CLAUDE,
      toolContext,
      memoryFile,
    });

    try {
      let prompt = job.prompt || "";

      if (job.useOutputFromPrev && prevLog?.result) {
        prompt = `[Previous task result]\n${prevLog.result}\n\n[Your task]\n${prompt}`;
      }

      const notifyInstruction = this.buildNotifyInstruction(job, preference);
      if (notifyInstruction) {
        prompt = `${prompt}\n\n${notifyInstruction}`;
      }

      const config = {
        configurable: { thread_id: `scheduled_${schedule.id}_${job.id}` },
      };
      const response = await (agent as any).invoke(
        { messages: [new HumanMessage(prompt)] },
        config,
      );

      const lastMessage = response?.messages?.[response.messages.length - 1];
      return typeof lastMessage?.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage?.content || "");
    } finally {
      await cleanup();
    }
  };

  private buildNotifyInstruction = (job: IJob, preference: any): string => {
    if (!job.notifyPlatform) {
      return "";
    }

    const chatId = preference?.chatIdTelegram?.toString() || "";
    const botToken = preference?.botTokenTelegram || "";

    if (!chatId || !botToken) {
      return "";
    }

    if (job.notifyOnlyIfAgentSays) {
      return `If your analysis warrants a notification, send a Telegram message summarizing your findings. Use the Telegram bot token: "${botToken}" and chat ID: "${chatId}". Do not send a message if there is nothing significant to report.`;
    }

    return `After completing your task, send a Telegram message summarizing your findings. Use the Telegram bot token: "${botToken}" and chat ID: "${chatId}".`;
  };

  private evaluateCondition = async (
    job: IJob,
    prevLog: IScheduleLog | null,
  ): Promise<boolean> => {
    const conditionType = job.conditionType || JobConditionType.NONE;

    if (conditionType === JobConditionType.NONE) {
      return false;
    }

    if (conditionType === JobConditionType.SKIP_IF_PREV_FAILED) {
      return prevLog?.status !== AgentScheduleStatus.SUCCESS;
    }

    if (conditionType === JobConditionType.LLM) {
      if (!prevLog?.result || !job.conditionPrompt) {
        return false;
      }
      return this.evaluateLlmCondition(job.conditionPrompt, prevLog.result);
    }

    return false;
  };

  private evaluateLlmCondition = async (
    conditionPrompt: string,
    prevResult: string,
  ): Promise<boolean> => {
    try {
      const llm = await createLLM(LLMProvider.CLAUDE, 0);
      const response = await llm.invoke([
        new SystemMessage(
          "You are a condition evaluator. Answer only YES or NO. Do not add any other text.",
        ),
        new HumanMessage(
          `Previous result:\n${prevResult}\n\nCondition: ${conditionPrompt}\n\nShould the next task run? Answer YES or NO.`,
        ),
      ]);
      const answer =
        typeof response.content === "string"
          ? response.content.trim().toUpperCase()
          : "";
      return !answer.startsWith("YES");
    } catch (err: any) {
      logEveryWhere({
        message: `AgentTaskScheduler: LLM condition eval error: ${err?.message}`,
      });
      return false;
    }
  };

  private notifyFailure = async (
    schedule: ISchedule,
    job: IJob,
    errorMessage: string,
  ): Promise<void> => {
    try {
      if (!job.notifyPlatform) {
        return;
      }
      const [preference] = await preferenceDB.getOnePreference();
      const chatId = preference?.chatIdTelegram?.toString() || "";
      const botToken = preference?.botTokenTelegram || "";
      if (!chatId || !botToken) {
        return;
      }
      const msg =
        `<b>Agent Schedule Failed</b>\n` +
        `<b>Schedule:</b> ${schedule.name}\n` +
        `<b>Error:</b> ${errorMessage || "Unknown error"}`;
      await telegramBotService.sendMessage(botToken, msg, chatId);
    } catch (err: any) {
      logEveryWhere({
        message: `AgentTaskScheduler.notifyFailure() error: ${err?.message}`,
      });
    }
  };

  private startRetryPoller = (): void => {
    if (this.retryPollTimer) {
      return;
    }
    this.retryPollTimer = setInterval(async () => {
      try {
        await this.processRetries();
      } catch (err: any) {
        logEveryWhere({
          message: `AgentTaskScheduler retry poller error: ${err?.message}`,
        });
      }
    }, RETRY_POLL_INTERVAL_MS);
  };

  private processRetries = async (): Promise<void> => {
    const retryingLogs = await scheduleLogDB.getRetryingLogs(Date.now());
    if (!retryingLogs || retryingLogs.length === 0) {
      return;
    }

    for (const log of retryingLogs) {
      if (!log.scheduleId || !log.jobId) {
        continue;
      }
      const [schedule] = await scheduleDB.getOneSchedule(log.scheduleId);
      if (!schedule) {
        continue;
      }
      const job = (schedule.listJob || []).find((j) => j.id === log.jobId);
      if (!job) {
        continue;
      }

      const prevLog = await this.getPrevJobLog(log.scheduleId, log.jobId);
      await this.runWithRetry(schedule, job, log, prevLog, log.retryCount || 0);
    }
  };

  private getPrevJobLog = async (
    scheduleId: number,
    currentJobId: number,
  ): Promise<IScheduleLog | null> => {
    try {
      const [schedule] = await scheduleDB.getOneSchedule(scheduleId);
      if (!schedule) {
        return null;
      }
      const sortedJobs = (schedule.listJob || [])
        .filter((j) => j.type === JobType.AGENT)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      const currentIdx = sortedJobs.findIndex((j) => j.id === currentJobId);
      if (currentIdx <= 0) {
        return null;
      }
      const prevJobId = sortedJobs[currentIdx - 1].id!;
      return scheduleLogDB.getLatestJobLog(scheduleId, prevJobId);
    } catch {
      return null;
    }
  };

  stopAll = (): void => {
    for (const task of this.tasks.values()) {
      task.stop();
    }
    this.tasks.clear();
    if (this.retryPollTimer) {
      clearInterval(this.retryPollTimer);
      this.retryPollTimer = null;
    }
  };
}

const agentTaskScheduler = new AgentTaskScheduler();
export { agentTaskScheduler };
