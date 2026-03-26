import { HumanMessage } from "@langchain/core/messages";
import { AgentTaskStatus } from "@/electron/type";
import { agentTaskDB } from "@/electron/database/agentTask";
import { agentRegistryDB } from "@/electron/database/agentRegistry";
import { logEveryWhere } from "@/electron/service/util";
import { sendToRenderer } from "@/electron/main";
import { MESSAGE } from "@/electron/constant";
import { createRegistryKeeperAgent, ToolContext } from "@/electron/appAgent";
import { normalizeAgentMessageContent } from "@/service/agentMessageContent";

const DEFAULT_TASK_TIMEOUT_MINUTES = 30;

class AgentTaskExecutor {
  private runningTasks = new Map<number, AbortController>();

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
      controller.abort();
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

    const [registry, registryErr] =
      await agentRegistryDB.getOneAgentRegistry(agentId);
    if (registryErr || !registry) {
      await this.failTask(taskId, `Agent registry #${agentId} not found`);
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
    const agentCreator = await createRegistryKeeperAgent({
      registry,
      toolContext,
    });
    const { agent, cleanup } = agentCreator;

    try {
      const prompt = task.description
        ? `${task.title}\n\n${task.description}`
        : task.title;

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

        await agentTaskDB.updateAgentTask(taskId, {
          status: AgentTaskStatus.DONE,
          result: { text: resultText },
          completedAt: Date.now(),
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId!);
      await this.failTask(
        taskId,
        isTimedOut
          ? `Task execution timed out after ${timeoutMinutes} minutes`
          : err?.message,
      );
    } finally {
      await cleanup();
      this.runningTasks.delete(taskId);
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
