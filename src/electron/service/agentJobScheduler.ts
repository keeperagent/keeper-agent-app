import cron from "node-cron";
import _ from "lodash";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  createKeeperAgent,
  createAgentFromProfile,
  createLLM,
} from "@/electron/appAgent";
import { ToolContext } from "@/electron/appAgent/toolContext";
import { masterPasswordManager } from "@/electron/service/masterPassword";
import { scheduleDB } from "@/electron/database/schedule";
import { appLogDB } from "@/electron/database/appLog";
import { agentProfileDB } from "@/electron/database/agentProfile";
import { jobDB } from "@/electron/database/job";
import { preferenceDB } from "@/electron/database/preference";
import { telegramBotService } from "@/electron/chatGateway/adapters/telegram";
import { logEveryWhere, sleep } from "@/electron/service/util";
import { normalizeAgentMessageContent } from "@/service/agentMessageContent";
import { JobModel } from "@/electron/database/index";
import { workflowManager } from "@/electron/simulator/workflow";
import type {
  ISchedule,
  IJob,
  IAppLog,
  IWorkflowVariable,
} from "@/electron/type";
import {
  LLMProvider,
  ScheduleType,
  JobType,
  JobConditionType,
  AgentScheduleStatus,
  AppLogType,
} from "@/electron/type";

const MAX_CONCURRENT_RUNS = 2;
const RETRY_POLL_INTERVAL_MS = 30_000;

class AgentTaskScheduler {
  private tasks = new Map<number, cron.ScheduledTask>();
  private runningScheduleIds = new Set<number>();
  private retryPollTimer: NodeJS.Timeout | null = null;

  init = async (): Promise<void> => {
    try {
      await appLogDB.resetRunningScheduleLogs();
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

  runNow = async (scheduleId: number): Promise<void> => {
    await this.executeSchedule(scheduleId, true);
  };

  private executeSchedule = async (
    scheduleId: number,
    bypassPause = false,
  ): Promise<void> => {
    if (!masterPasswordManager.isMasterPasswordSet()) {
      logEveryWhere({
        message: `AgentTaskScheduler: schedule ${scheduleId} skipped — app is locked`,
      });
      return;
    }

    logEveryWhere({
      message: `AgentTaskScheduler: executeSchedule(${scheduleId}) started`,
    });

    const [schedule] = await scheduleDB.getOneSchedule(scheduleId);
    if (!schedule) {
      logEveryWhere({
        message: `AgentTaskScheduler: schedule ${scheduleId} not found`,
      });
      return;
    }
    if (!schedule.isActive) {
      logEveryWhere({
        message: `AgentTaskScheduler: schedule ${scheduleId} skipped — isActive=${schedule.isActive}`,
      });
      return;
    }
    if (!bypassPause && schedule.isPaused) {
      logEveryWhere({
        message: `AgentTaskScheduler: schedule ${scheduleId} skipped — isPaused=${schedule.isPaused}`,
      });
      return;
    }

    if (this.runningScheduleIds.size >= MAX_CONCURRENT_RUNS) {
      await appLogDB.createAppLog({
        logType: AppLogType.SCHEDULE,
        scheduleId,
        status: AgentScheduleStatus.SKIPPED,
        action: ScheduleType.AGENT,
        errorMessage: `Skipped: concurrency limit (${MAX_CONCURRENT_RUNS}) reached`,
        startedAt: Date.now(),
        finishedAt: Date.now(),
      });
      logEveryWhere({
        message: `AgentTaskScheduler: schedule ${scheduleId} skipped — concurrency limit reached`,
      });
      return;
    }

    const jobs: IJob[] = _.orderBy(schedule.listJob || [], ["order"], ["asc"]);

    if (jobs.length === 0) {
      logEveryWhere({
        message: `AgentTaskScheduler: schedule ${scheduleId} has no jobs — nothing to execute`,
      });
      return;
    }

    logEveryWhere({
      message: `AgentTaskScheduler: schedule ${scheduleId} executing ${jobs.length} job(s)`,
    });

    this.runningScheduleIds.add(scheduleId);
    await scheduleDB.setLastStartedAt(scheduleId, Date.now());
    try {
      let prevLog: IAppLog | null = null;

      for (const job of jobs) {
        logEveryWhere({
          message: `AgentTaskScheduler: running job ${job.id} (type=${job.type}) for schedule ${scheduleId}`,
        });
        if (job.type === JobType.WORKFLOW) {
          prevLog = await this.executeWorkflowJob(schedule, job);
        } else {
          prevLog = await this.executeAgentJob(schedule, job, prevLog);
        }

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
      this.runningScheduleIds.delete(scheduleId);
      logEveryWhere({
        message: `AgentTaskScheduler: schedule ${scheduleId} finished`,
      });
    }
  };

  private executeWorkflowJob = async (
    schedule: ISchedule,
    job: IJob,
  ): Promise<IAppLog> => {
    if (!job.workflowId || !job.campaignId) {
      const [log] = await appLogDB.createAppLog({
        logType: AppLogType.SCHEDULE,
        scheduleId: schedule.id!,
        jobId: job.id,
        action: JobType.WORKFLOW,
        status: AgentScheduleStatus.ERROR,
        errorMessage: "Missing workflowId or campaignId",
        startedAt: Date.now(),
        finishedAt: Date.now(),
      });
      return log!;
    }

    const [logEntry] = await appLogDB.createAppLog({
      logType: AppLogType.SCHEDULE,
      scheduleId: schedule.id!,
      jobId: job.id,
      action: JobType.WORKFLOW,
      status: AgentScheduleStatus.RUNNING,
      startedAt: Date.now(),
    });

    try {
      let overrideListVariable: IWorkflowVariable[] | undefined;
      if (job.toolContextJson) {
        try {
          const toolContext = JSON.parse(job.toolContextJson);
          if (Array.isArray(toolContext.workflowVariables)) {
            overrideListVariable = toolContext.workflowVariables;
          }
        } catch {
          logEveryWhere({
            message: `AgentTaskScheduler: failed to parse toolContextJson for workflow job ${job.id}`,
          });
        }
      }

      const workflow = await workflowManager.getWorkflow(
        job.workflowId,
        job.campaignId,
        schedule.id!,
      );

      const [jobEncryptKey, encryptKeyErr] = await jobDB.getEncryptKey(job.id!);
      if (encryptKeyErr) {
        throw encryptKeyErr;
      }
      workflow.runWorkflow(jobEncryptKey || "", overrideListVariable);

      while (workflow.monitor.isRunning) {
        await sleep(1000);
      }

      const [updated] = await appLogDB.updateAppLog(logEntry?.id!, {
        status: AgentScheduleStatus.SUCCESS,
        result: "Workflow completed",
        finishedAt: Date.now(),
      });
      return updated!;
    } catch (err: any) {
      const [failed] = await appLogDB.updateAppLog(logEntry?.id!, {
        status: AgentScheduleStatus.ERROR,
        errorMessage: err?.message,
        finishedAt: Date.now(),
      });
      await this.notifyFailure(schedule, job, err?.message);
      return failed!;
    }
  };

  private executeAgentJob = async (
    schedule: ISchedule,
    job: IJob,
    prevLog: IAppLog | null,
  ): Promise<IAppLog> => {
    const shouldSkip = await this.evaluateCondition(job, prevLog);
    if (shouldSkip) {
      const [log] = await appLogDB.createAppLog({
        logType: AppLogType.SCHEDULE,
        scheduleId: schedule.id!,
        jobId: job.id,
        action: JobType.AGENT,
        status: AgentScheduleStatus.SKIPPED,
        errorMessage: "Condition evaluated to skip",
        startedAt: Date.now(),
        finishedAt: Date.now(),
      });
      return log!;
    }

    const [logEntry] = await appLogDB.createAppLog({
      logType: AppLogType.SCHEDULE,
      scheduleId: schedule.id!,
      jobId: job.id,
      action: JobType.AGENT,
      status: AgentScheduleStatus.RUNNING,
      retryCount: 0,
      startedAt: Date.now(),
    });

    return this.runWithRetry(schedule, job, logEntry!, prevLog, 0);
  };

  private runWithRetry = async (
    schedule: ISchedule,
    job: IJob,
    logEntry: IAppLog,
    prevLog: IAppLog | null,
    attempt: number,
  ): Promise<IAppLog> => {
    try {
      const result = await this.runAgentJob(schedule, job, prevLog);
      const [updated] = await appLogDB.updateAppLog(logEntry.id!, {
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
        const [updated] = await appLogDB.updateAppLog(logEntry.id!, {
          status: AgentScheduleStatus.RETRYING,
          errorMessage: err?.message,
          retryCount: attempt + 1,
          nextRetryAt: Date.now() + delayMs,
        });
        return updated!;
      }

      const [failed] = await appLogDB.updateAppLog(logEntry.id!, {
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
    prevLog: IAppLog | null,
  ): Promise<string> => {
    const memoryFile = schedule.memoryFileKey
      ? `AGENT_${schedule.memoryFileKey}.md`
      : `AGENT_SCHEDULED_${schedule.id}.md`;

    const toolContext = new ToolContext();

    if (job.hasEncryptKey) {
      try {
        const [agentEncryptKey, agentEncryptKeyErr] = await jobDB.getEncryptKey(
          job.id!,
        );
        if (agentEncryptKeyErr) {
          logEveryWhere({
            message: `AgentTaskScheduler failed to get encryptKey for job ${job.id}: ${agentEncryptKeyErr?.message}`,
          });
        } else if (agentEncryptKey) {
          toolContext.update({ encryptKey: agentEncryptKey });
        }
      } catch (err: any) {
        logEveryWhere({
          message: `AgentTaskScheduler: failed to get encryptKey for job ${job.id}: ${err?.message}`,
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

    // If the job has agentProfileId, run it using that agent profile's config
    let agentCreator: { agent: any; cleanup: () => Promise<void> };
    if (job.agentProfileId) {
      const [profile] = await agentProfileDB.getOneAgentProfile(
        job.agentProfileId,
      );
      if (!profile) {
        throw new Error(
          `AgentProfile #${job.agentProfileId} not found for job ${job.id}`,
        );
      }
      agentCreator = await createAgentFromProfile({
        profile,
        toolContext,
      });
    } else {
      agentCreator = await createKeeperAgent({
        provider: job.llmProvider as LLMProvider,
        toolContext,
        memoryFile,
      });
    }

    const { agent, cleanup } = agentCreator;

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
      return normalizeAgentMessageContent(lastMessage?.content);
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
    prevLog: IAppLog | null,
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
      return this.evaluateLlmCondition(
        job.conditionPrompt,
        prevLog.result,
        (job.llmProvider as LLMProvider) || LLMProvider.CLAUDE,
      );
    }

    return false;
  };

  private evaluateLlmCondition = async (
    conditionPrompt: string,
    prevResult: string,
    provider: LLMProvider,
  ): Promise<boolean> => {
    try {
      const llm = await createLLM(provider, 0);
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
    const retryingLogs = await appLogDB.getRetryingScheduleLogs(Date.now());
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
  ): Promise<IAppLog | null> => {
    try {
      const [schedule] = await scheduleDB.getOneSchedule(scheduleId);
      if (!schedule) {
        return null;
      }
      const sortedJobs = (schedule.listJob || []).sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      );
      const currentIdx = sortedJobs.findIndex((j) => j.id === currentJobId);
      if (currentIdx <= 0) {
        return null;
      }
      const prevJobId = sortedJobs[currentIdx - 1].id!;
      return appLogDB.getLatestScheduleJobLog(scheduleId, prevJobId);
    } catch {
      return null;
    }
  };

  onUnlock = async (): Promise<void> => {
    try {
      const [schedules] = await scheduleDB.getActiveAgentSchedules();
      if (!schedules) {
        return;
      }
      for (const schedule of schedules) {
        this.register(schedule);
      }
      this.startRetryPoller();
      logEveryWhere({
        message: `AgentTaskScheduler.onUnlock(): re-registered ${schedules.length} schedule(s)`,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `AgentTaskScheduler.onUnlock() error: ${err?.message}`,
      });
    }
  };

  getRunningScheduleIds = (): number[] => {
    return Array.from(this.runningScheduleIds);
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
