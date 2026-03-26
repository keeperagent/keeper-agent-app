import { AgentTaskStatus } from "@/electron/type";
import { agentTaskDB } from "@/electron/database/agentTask";
import { logEveryWhere } from "@/electron/service/util";
import { sendToRenderer } from "@/electron/main";
import { MESSAGE } from "@/electron/constant";
import { agentRegistryDB } from "@/electron/database/agentRegistry";

class TaskDispatcher {
  private staleIntervalId: ReturnType<typeof setInterval> | null = null;
  private isDispatching = false;
  private pendingDispatch = false;

  dispatch = async (): Promise<void> => {
    if (this.isDispatching) {
      this.pendingDispatch = true;
      return;
    }
    this.isDispatching = true;

    try {
      await this.runDispatch();
    } catch (err: any) {
      logEveryWhere({
        message: `TaskDispatcher.dispatch() error: ${err?.message}`,
      });
    } finally {
      this.isDispatching = false;
      if (this.pendingDispatch) {
        this.pendingDispatch = false;
        setImmediate(() => this.dispatch());
      }
    }
  };

  startStaleWorker = (): void => {
    if (this.staleIntervalId) {
      return;
    }

    this.staleIntervalId = setInterval(() => {
      this.requeueAndDispatch().catch((err) => {
        logEveryWhere({
          message: `requeueAndDispatch() error: ${err?.message}`,
        });
      });
    }, 60 * 1000);
  };

  stopStaleWorker = (): void => {
    if (this.staleIntervalId) {
      clearInterval(this.staleIntervalId);
      this.staleIntervalId = null;
    }
  };

  private runDispatch = async (): Promise<void> => {
    const [tasks, tasksErr] = await agentTaskDB.getTasksByStatus(
      AgentTaskStatus.INIT,
    );
    if (tasksErr || !tasks || tasks.length === 0) {
      return;
    }

    for (const task of tasks) {
      if (!task.id) {
        continue;
      }

      if (task.assignedAgentId) {
        const maxConcurrent = await this.getAgentMaxConcurrent(
          task.assignedAgentId,
        );
        const [runningCount, runningCountErr] =
          await agentTaskDB.countInProgressByAgent(task.assignedAgentId);
        if (runningCountErr) {
          continue;
        }
        if (runningCount >= maxConcurrent) {
          continue;
        }

        const [claimed] = await agentTaskDB.claimAgentTask(
          task.id,
          task.assignedAgentId,
          maxConcurrent,
        );
        if (claimed) {
          sendToRenderer(MESSAGE.AGENT_TASK_ASSIGNED, {
            taskId: task.id,
            agentId: task.assignedAgentId,
          });
          sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
        }
      }
    }
  };

  private getAgentMaxConcurrent = async (agentId: number): Promise<number> => {
    const [agent] = await agentRegistryDB.getOneAgentRegistry(agentId);
    return agent?.maxConcurrentTasks || 1;
  };

  private requeueAndDispatch = async (): Promise<void> => {
    const now = new Date().getTime();

    const [expiredCount] = await agentTaskDB.expireOverdueTasks(now);
    if (expiredCount > 0) {
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
    }

    const [requeuedCount] = await agentTaskDB.requeueStaleTasks(now);
    if (requeuedCount > 0) {
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
      await this.dispatch();
    }
  };
}

const agentTaskDispatcher = new TaskDispatcher();
export { agentTaskDispatcher };
