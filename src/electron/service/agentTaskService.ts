import { IAgentTask, AgentTaskStatus } from "@/electron/type";
import { agentTaskDB } from "@/electron/database/agentTask";
import { logEveryWhere } from "@/electron/service/util";

class AgentTaskService {
  private expireIntervalId: ReturnType<typeof setInterval> | null = null;

  async createTask(
    data: Partial<IAgentTask>,
  ): Promise<[IAgentTask | null, Error | null]> {
    return agentTaskDB.createAgentTask({
      ...data,
      status: AgentTaskStatus.INIT,
      retryCount: 0,
    });
  }

  async listAvailableTasks(): Promise<[IAgentTask[] | null, Error | null]> {
    return agentTaskDB.getTasksByStatus(AgentTaskStatus.INIT);
  }

  async claimTask(
    taskId: number,
    agentId: number,
  ): Promise<[IAgentTask | null, Error | null]> {
    return agentTaskDB.claimAgentTask(taskId, agentId);
  }

  async updateTask(
    taskId: number,
    update: Partial<IAgentTask>,
  ): Promise<[IAgentTask | null, Error | null]> {
    return agentTaskDB.updateAgentTask(taskId, update);
  }

  async completeTask(
    taskId: number,
    result: Record<string, any>,
  ): Promise<[IAgentTask | null, Error | null]> {
    return agentTaskDB.updateAgentTask(taskId, {
      status: AgentTaskStatus.DONE,
      result,
      completedAt: new Date().getTime(),
    });
  }

  async failTask(
    taskId: number,
    errorMessage: string,
  ): Promise<[IAgentTask | null, Error | null]> {
    const [task] = await agentTaskDB.getOneAgentTask(taskId);
    if (!task) {
      return [null, new Error("task_not_found")];
    }

    const retryCount = (task.retryCount || 0) + 1;
    const maxRetries = task.maxRetries || 3;

    if (retryCount < maxRetries) {
      return agentTaskDB.updateAgentTask(taskId, {
        status: AgentTaskStatus.INIT,
        assignedAgentId: undefined,
        claimedAt: undefined,
        startedAt: undefined,
        retryCount,
        errorMessage,
      });
    }

    return agentTaskDB.updateAgentTask(taskId, {
      status: AgentTaskStatus.FAILED,
      retryCount,
      errorMessage,
    });
  }

  startExpireWorker() {
    if (this.expireIntervalId) {
      return;
    }
    this.expireIntervalId = setInterval(() => {
      this.expireStaleTask().catch((err) => {
        logEveryWhere({ message: `expireStaleTask() error: ${err?.message}` });
      });
    }, 60 * 1000); // every 60s
  }

  stopExpireWorker() {
    if (this.expireIntervalId) {
      clearInterval(this.expireIntervalId);
      this.expireIntervalId = null;
    }
  }

  private async expireStaleTask() {
    const now = new Date().getTime();
    const [tasks] = await agentTaskDB.getListAgentTask();
    if (!tasks) {
      return;
    }

    for (const task of tasks) {
      if (
        task.status !== AgentTaskStatus.INIT &&
        task.status !== AgentTaskStatus.ASSIGNED
      ) {
        continue;
      }

      const isExpiredByTtl =
        task.ttlSeconds &&
        task.createAt &&
        now > task.createAt + task.ttlSeconds * 1000;

      const isExpiredByDue = task.dueAt && now > task.dueAt;

      if ((isExpiredByTtl || isExpiredByDue) && task.id) {
        await agentTaskDB.updateAgentTask(task.id, {
          status: AgentTaskStatus.EXPIRED,
        });
      }
    }
  }
}

const agentTaskService = new AgentTaskService();
export { agentTaskService };
