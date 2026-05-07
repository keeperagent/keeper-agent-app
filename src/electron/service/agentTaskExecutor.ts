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
import {
  extractUsageFromMeta,
  isErrorResult,
} from "@/electron/agentCore/utils";
import { normalizeAgentMessageContent } from "@/service/agentMessageContent";

const DEFAULT_TASK_TIMEOUT_MINUTES = 30;

type ToolCallEntry = {
  runId: string;
  toolName: string;
  input: Record<string, unknown>;
  result?: string;
  state: "running" | "done" | "error";
};

const extractToolOutput = (rawOutput: any): string => {
  if (typeof rawOutput === "string") {
    return rawOutput;
  }
  const content = rawOutput?.kwargs?.content ?? rawOutput?.content;
  if (typeof content === "string") {
    return content;
  }
  return JSON.stringify(rawOutput || "");
};

class AgentTaskExecutor {
  private runningTasks = new Map<number, AbortController>();
  private cancelledTasks = new Set<number>();
  private pausedTasks = new Set<number>();
  private liveToolCalls = new Map<number, ToolCallEntry[]>();

  getLiveToolCalls = (taskId: number): ToolCallEntry[] => {
    return this.liveToolCalls.get(taskId) || [];
  };

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

    timeoutId = setTimeout(() => {
      isTimedOut = true;
      abortController.abort();
    }, timeoutMs);

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

    const runToolCallMap = new Map<string, ToolCallEntry>();
    this.liveToolCalls.set(taskId, []);
    const completedToolCalls: ToolCallEntry[] = [];
    let resultText = "";
    let textBuffer = "";
    let tokenUsage = null;

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

      const eventStream = (agent as any).streamEvents(
        { messages: [new HumanMessage(prompt)] },
        {
          configurable: { thread_id: `agent_task_${taskId}` },
          version: "v2",
          signal: abortController.signal,
          recursionLimit: 100,
        },
      );

      for await (const evt of eventStream) {
        if (abortController.signal.aborted) {
          break;
        }

        if (evt.event === "on_tool_start") {
          const toolName = evt.name || "unknown";
          const input = evt.data?.input || {};
          runToolCallMap.set(evt.run_id, {
            runId: evt.run_id,
            toolName,
            input,
            state: "running",
          });
          this.liveToolCalls.set(taskId, [
            ...completedToolCalls,
            ...Array.from(runToolCallMap.values()),
          ]);
        }

        if (evt.event === "on_tool_end") {
          const result = extractToolOutput(evt.data?.output);
          const existing = runToolCallMap.get(evt.run_id);
          if (existing) {
            existing.result = result;
            existing.state = isErrorResult(result) ? "error" : "done";
            completedToolCalls.push({ ...existing });
            runToolCallMap.delete(evt.run_id);
          }
          this.liveToolCalls.set(taskId, [
            ...completedToolCalls,
            ...Array.from(runToolCallMap.values()),
          ]);
        }

        if (
          evt.event === "on_chat_model_stream" &&
          !String(evt.metadata?.langgraph_checkpoint_ns || "").includes("|")
        ) {
          const content = evt.data?.chunk?.content;
          if (typeof content === "string") {
            textBuffer += content;
          } else if (Array.isArray(content)) {
            textBuffer += content
              .filter(
                (chunk: any) =>
                  chunk?.type === "text" || typeof chunk === "string",
              )
              .map((chunk: any) =>
                typeof chunk === "string" ? chunk : chunk.text || "",
              )
              .join("");
          }
        }

        if (
          evt.event === "on_chat_model_end" &&
          !String(evt.metadata?.langgraph_checkpoint_ns || "").includes("|")
        ) {
          const hasToolCalls =
            Array.isArray(evt.data?.output?.tool_calls) &&
            evt.data.output.tool_calls.length > 0;
          if (textBuffer && !hasToolCalls) {
            resultText += textBuffer;
          }
          textBuffer = "";
          const extracted = extractUsageFromMeta(
            evt.data?.output?.usage_metadata,
          );
          if (extracted) {
            tokenUsage = extracted;
          }
        }
      }

      clearTimeout(timeoutId);

      if (!isTimedOut) {
        const toolCallSequence =
          completedToolCalls.length > 0
            ? JSON.stringify(completedToolCalls)
            : null;

        await agentTaskDB.updateAgentTask(taskId, {
          status: AgentTaskStatus.DONE,
          result: {
            value: normalizeAgentMessageContent(resultText),
            tokenUsage,
          },
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
          result: normalizeAgentMessageContent(resultText),
          toolCallSequence: toolCallSequence || undefined,
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
        const toolCallSequence =
          completedToolCalls.length > 0
            ? JSON.stringify(completedToolCalls)
            : null;
        await appLogDB.createAppLog({
          logType: AppLogType.TASK,
          taskId,
          actorType: AppLogActorType.AGENT,
          actorId: agentId,
          actorName: profile.name,
          action: AppLogTaskAction.TASK_CANCELLED,
          status: AgentTaskStatus.CANCELLED,
          message: task.title,
          toolCallSequence: toolCallSequence || undefined,
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
          const toolCallSequence =
            completedToolCalls.length > 0
              ? JSON.stringify(completedToolCalls)
              : null;
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
            toolCallSequence: toolCallSequence || undefined,
            startedAt: task.startedAt,
            finishedAt: Date.now(),
          });
        }
      }
    } finally {
      await cleanup();
      this.liveToolCalls.delete(taskId);
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
