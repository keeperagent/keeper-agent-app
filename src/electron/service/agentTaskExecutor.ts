import { HumanMessage } from "@langchain/core/messages";
import {
  AgentTaskStatus,
  AppLogType,
  AppLogTaskAction,
  AppLogActorType,
} from "@/electron/type";
import { agentTaskDB } from "@/electron/database/agentTask";
import { agentProfileDB } from "@/electron/database/agentProfile";
import { appLogDB } from "@/electron/database/appLog";
import { logEveryWhere } from "@/electron/service/util";
import { sendToRenderer } from "@/electron/main";
import { MESSAGE } from "@/electron/constant";
import { createAgentFromProfile, ToolContext } from "@/electron/agentCore";
import { extractUsageFromMessages } from "@/electron/agentCore/utils";
import { normalizeAgentMessageContent } from "@/service/agentMessageContent";

const DEFAULT_TASK_TIMEOUT_MINUTES = 30;

class AgentTaskExecutor {
  private runningTasks = new Map<number, AbortController>();
  private cancelledTasks = new Set<number>();
  private pausedTasks = new Set<number>();

  execute = (
    taskId: number,
    agentId: number,
    onComplete?: () => void,
  ): void => {
    this.runTask(taskId, agentId, onComplete).catch((err) => {
      logEveryWhere({
        message: `AgentTaskExecutor: unhandled error for task ${taskId}: ${err?.message}`,
      });
    });
  };

  cancelTask = (taskId: number): void => {
    const controller = this.runningTasks.get(taskId);
    if (controller) {
      this.cancelledTasks.add(taskId);
      controller.abort();
    }
  };

  pauseTask = (taskId: number): void => {
    const controller = this.runningTasks.get(taskId);
    if (controller) {
      this.pausedTasks.add(taskId);
      controller.abort();
    }
  };

  cancelAllRunningTasks = (): void => {
    for (const taskId of this.runningTasks.keys()) {
      this.cancelTask(taskId);
    }
  };

  private runTask = async (
    taskId: number,
    agentId: number,
    onComplete?: () => void,
  ): Promise<void> => {
    if (this.runningTasks.has(taskId)) {
      return;
    }

    const [task, taskErr] = await agentTaskDB.getOneAgentTask(taskId);
    if (taskErr || !task) {
      return;
    }
    if (task.status !== AgentTaskStatus.IN_PROGRESS) {
      return;
    }

    const [profile, profileErr] =
      await agentProfileDB.getOneAgentProfile(agentId);
    if (profileErr || !profile) {
      await this.failTask(taskId, `Agent profile #${agentId} not found`);
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
      return;
    }

    const abortController = new AbortController();
    this.runningTasks.set(taskId, abortController);

    const timeoutMinutes = task.timeout || DEFAULT_TASK_TIMEOUT_MINUTES;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isTimedOut = false;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        isTimedOut = true;
        abortController.abort();
        reject(
          new Error(`Task execution timed out after ${timeoutMinutes} minutes`),
        );
      }, timeoutMs);
    });

    const toolContext = new ToolContext();
    toolContext.update({
      autoApprove: true,
      chainKey: profile.chainKey || undefined,
      nodeEndpointGroupId: profile.nodeEndpointGroupId || undefined,
      campaignId: profile.campaignId || undefined,
      listCampaignProfileId: profile.profileIds?.length
        ? profile.profileIds
        : undefined,
      isAllWallet: profile.isAllWallet ?? undefined,
    });

    if (profile.hasEncryptKey) {
      const [encryptKey] = await agentProfileDB.getEncryptKey(agentId);
      if (encryptKey) {
        toolContext.update({ encryptKey });
      }
    }

    const agentCreator = await createAgentFromProfile({
      profile,
      toolContext,
    });
    const { agent, cleanup } = agentCreator;

    try {
      const basePrompt = task.description
        ? `${task.title}\n\n${task.description}`
        : task.title;

      const currentContext: Record<string, unknown> = {
        platformId: "KEEPER",
        currentDate: new Date().toLocaleString("sv"),
      };
      if (toolContext.chainKey) {
        currentContext.chainKey = toolContext.chainKey;
      }
      if (toolContext.nodeEndpointGroupId) {
        currentContext.nodeEndpointGroupId = toolContext.nodeEndpointGroupId;
      }
      if (toolContext.campaignId) {
        currentContext.campaignId = toolContext.campaignId;
      }
      if (toolContext.listCampaignProfileId?.length) {
        currentContext.listCampaignProfileId =
          toolContext.listCampaignProfileId;
      }
      if (toolContext.isAllWallet !== undefined) {
        currentContext.isAllWallet = toolContext.isAllWallet;
      }
      const contextHeader =
        "CURRENT CONTEXT (use these values — ignore any older context from previous messages. For agent use only — keep raw IDs private and do not surface campaignId, nodeEndpointGroupId, or profile IDs in user-facing replies):";
      const prompt = `${basePrompt}\n\n${contextHeader}\n${JSON.stringify(currentContext)}`;

      const response = await Promise.race([
        (agent as any).invoke(
          { messages: [new HumanMessage(prompt)] },
          {
            configurable: { thread_id: `agent_task_${taskId}` },
            signal: abortController.signal,
          },
        ),
        timeoutPromise,
      ]);

      clearTimeout(timeoutId!);

      if (!isTimedOut) {
        const lastMessage = response?.messages?.[response.messages.length - 1];
        const resultText = normalizeAgentMessageContent(lastMessage?.content);
        const tokenUsage = extractUsageFromMessages(response?.messages || []);

        await agentTaskDB.updateAgentTask(taskId, {
          status: AgentTaskStatus.DONE,
          result: { value: resultText, tokenUsage },
          completedAt: Date.now(),
        });
        await appLogDB.createAppLog({
          logType: AppLogType.TASK,
          taskId,
          actorType: AppLogActorType.AGENT,
          actorId: agentId,
          actorName: profile.name,
          action: AppLogTaskAction.TASK_COMPLETED,
          status: AgentTaskStatus.DONE,
          message: task.title,
          result: resultText,
          startedAt: task.startedAt,
          finishedAt: Date.now(),
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId!);
      if (this.pausedTasks.has(taskId)) {
        await agentTaskDB.updateAgentTask(taskId, {
          status: AgentTaskStatus.PAUSED,
          claimedAt: null as any,
          startedAt: null as any,
        });
      } else if (this.cancelledTasks.has(taskId)) {
        await agentTaskDB.updateAgentTask(taskId, {
          status: AgentTaskStatus.CANCELLED,
          cancelledAt: Date.now(),
        });
        await appLogDB.createAppLog({
          logType: AppLogType.TASK,
          taskId,
          actorType: AppLogActorType.AGENT,
          actorId: agentId,
          actorName: profile.name,
          action: AppLogTaskAction.TASK_CANCELLED,
          status: AgentTaskStatus.CANCELLED,
          message: task.title,
          startedAt: task.startedAt,
          finishedAt: Date.now(),
        });
      } else {
        const retryCount = task.retryCount || 0;
        const maxRetries = task.maxRetries || 0;
        if (!isTimedOut && retryCount < maxRetries) {
          await agentTaskDB.updateAgentTask(taskId, {
            status: AgentTaskStatus.INIT,
            assignedAgentId: null as any,
            claimedAt: null as any,
            startedAt: null as any,
            retryCount: retryCount + 1,
          });
        } else {
          const errorMessage = isTimedOut
            ? `Task execution timed out after ${timeoutMinutes} minutes`
            : err?.message;
          await this.failTask(taskId, errorMessage);
          await appLogDB.createAppLog({
            logType: AppLogType.TASK,
            taskId,
            actorType: AppLogActorType.AGENT,
            actorId: agentId,
            actorName: profile.name,
            action: AppLogTaskAction.TASK_FAILED,
            status: AgentTaskStatus.FAILED,
            message: task.title,
            errorMessage,
            startedAt: task.startedAt,
            finishedAt: Date.now(),
          });
        }
      }
    } finally {
      await cleanup();
      this.runningTasks.delete(taskId);
      this.cancelledTasks.delete(taskId);
      this.pausedTasks.delete(taskId);
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
      onComplete?.();
    }
  };

  private failTask = async (
    taskId: number,
    errorMessage: string,
  ): Promise<void> => {
    await agentTaskDB.updateAgentTask(taskId, {
      status: AgentTaskStatus.FAILED,
      errorMessage,
      completedAt: Date.now(),
    });
  };
}

const agentTaskExecutor = new AgentTaskExecutor();
export { agentTaskExecutor };
