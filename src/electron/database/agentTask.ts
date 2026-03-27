import _ from "lodash";
import { Op, literal } from "sequelize";
import { IAgentTask, AgentTaskStatus } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { formatAgentTask } from "@/electron/service/formatData";
import { AgentTaskModel, AgentRegistryModel } from "./index";

const PRIORITY_ORDER = literal(
  `CASE priority WHEN 'URGENT' THEN 4 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 1 ELSE 0 END`,
);

class AgentTaskDB {
  async getListAgentTask(): Promise<[IAgentTask[] | null, Error | null]> {
    try {
      const list = await AgentTaskModel.findAll({
        order: [["createAt", "DESC"]],
        include: [
          {
            model: AgentRegistryModel,
            as: "assignedAgent",
            attributes: ["id", "name"],
            required: false,
          },
          {
            model: AgentRegistryModel,
            as: "creatorAgent",
            attributes: ["id", "name"],
            required: false,
          },
        ],
      });
      return [list.map((item: any) => formatAgentTask(item.toJSON())), null];
    } catch (err: any) {
      logEveryWhere({ message: `getListAgentTask() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getOneAgentTask(
    id: number,
  ): Promise<[IAgentTask | null, Error | null]> {
    try {
      const data = await AgentTaskModel.findOne({
        where: { id },
        include: [
          {
            model: AgentRegistryModel,
            as: "assignedAgent",
            attributes: ["id", "name"],
            required: false,
          },
          {
            model: AgentRegistryModel,
            as: "creatorAgent",
            attributes: ["id", "name"],
            required: false,
          },
        ],
      });
      if (!data) {
        return [null, null];
      }
      return [formatAgentTask(data.toJSON()), null];
    } catch (err: any) {
      logEveryWhere({ message: `getOneAgentTask() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getTasksByStatus(
    status: AgentTaskStatus,
  ): Promise<[IAgentTask[] | null, Error | null]> {
    try {
      const list = await AgentTaskModel.findAll({
        where: { status },
        order: [
          [PRIORITY_ORDER, "DESC"],
          [literal("CASE WHEN dueAt IS NULL THEN 1 ELSE 0 END"), "ASC"],
          ["dueAt", "ASC"],
          ["createAt", "ASC"],
        ],
      });
      return [list.map((item: any) => formatAgentTask(item.toJSON())), null];
    } catch (err: any) {
      logEveryWhere({ message: `getTasksByStatus() error: ${err?.message}` });
      return [null, err];
    }
  }

  async createAgentTask(
    data: Partial<IAgentTask>,
  ): Promise<[IAgentTask | null, Error | null]> {
    try {
      const task = await AgentTaskModel.create(
        {
          ...data,
          metadata: JSON.stringify(data.metadata || {}),
          result: data.result ? JSON.stringify(data.result) : null,
          createAt: new Date().getTime(),
          updateAt: new Date().getTime(),
        } as any,
        { raw: false },
      );
      return await this.getOneAgentTask((task as any).id);
    } catch (err: any) {
      logEveryWhere({ message: `createAgentTask() error: ${err?.message}` });
      return [null, err];
    }
  }

  async expireOverdueTasks(now: number): Promise<[number, Error | null]> {
    try {
      const [count] = await AgentTaskModel.update(
        { status: AgentTaskStatus.EXPIRED, updateAt: now } as any,
        {
          where: {
            status: [AgentTaskStatus.INIT, AgentTaskStatus.IN_PROGRESS],
            [Op.or]: [
              { dueAt: { [Op.lt]: now } },
              literal(
                `(ttlSeconds IS NOT NULL AND createAt + ttlSeconds * 1000 < ${now})`,
              ),
            ],
          },
        },
      );
      return [count, null];
    } catch (err: any) {
      logEveryWhere({
        message: `expireOverdueTasks() error: ${err?.message}`,
      });
      return [0, err];
    }
  }

  async requeueAllInProgressTasks(): Promise<[number, Error | null]> {
    try {
      const now = Date.now();
      const [count] = await AgentTaskModel.update(
        {
          status: AgentTaskStatus.INIT,
          assignedAgentId: null,
          claimedAt: null,
          startedAt: null,
          retryCount: literal("retryCount + 1"),
          updateAt: now,
        } as any,
        { where: { status: AgentTaskStatus.IN_PROGRESS } },
      );
      return [count, null];
    } catch (err: any) {
      logEveryWhere({
        message: `requeueAllInProgressTasks() error: ${err?.message}`,
      });
      return [0, err];
    }
  }

  async requeueStaleTasks(now: number): Promise<[number, Error | null]> {
    try {
      const [count] = await AgentTaskModel.update(
        {
          status: AgentTaskStatus.INIT,
          assignedAgentId: null,
          claimedAt: null,
          startedAt: null,
          retryCount: literal("retryCount + 1"),
          updateAt: now,
        } as any,
        {
          where: {
            status: AgentTaskStatus.IN_PROGRESS,
            [Op.and]: [
              literal("timeout IS NOT NULL"),
              literal(`updateAt < (${now} - timeout * 60000)`),
            ],
          },
        },
      );
      return [count, null];
    } catch (err: any) {
      logEveryWhere({ message: `requeueStaleTasks() error: ${err?.message}` });
      return [0, err];
    }
  }

  async countInProgressByAgent(
    agentId: number,
  ): Promise<[number, Error | null]> {
    try {
      const count = await AgentTaskModel.count({
        where: {
          assignedAgentId: agentId,
          status: AgentTaskStatus.IN_PROGRESS,
        },
      });
      return [count, null];
    } catch (err: any) {
      logEveryWhere({
        message: `countInProgressByAgent() error: ${err?.message}`,
      });
      return [0, err];
    }
  }

  async expireAgentTask(id: number): Promise<[boolean, Error | null]> {
    try {
      const [count] = await AgentTaskModel.update(
        {
          status: AgentTaskStatus.EXPIRED,
          updateAt: new Date().getTime(),
        } as any,
        {
          where: {
            id,
            status: [AgentTaskStatus.INIT, AgentTaskStatus.IN_PROGRESS],
          },
        },
      );
      return [count > 0, null];
    } catch (err: any) {
      logEveryWhere({ message: `expireAgentTask() error: ${err?.message}` });
      return [false, err];
    }
  }

  async updateAgentTask(
    id: number,
    data: Partial<IAgentTask>,
  ): Promise<[IAgentTask | null, Error | null]> {
    try {
      await AgentTaskModel.update(
        _.omit(
          {
            ...data,
            metadata:
              data.metadata !== undefined
                ? JSON.stringify(data.metadata)
                : undefined,
            result:
              data.result !== undefined
                ? JSON.stringify(data.result)
                : undefined,
            updateAt: new Date().getTime(),
          },
          ["id"],
        ) as any,
        { where: { id } },
      );
      return await this.getOneAgentTask(id);
    } catch (err: any) {
      logEveryWhere({ message: `updateAgentTask() error: ${err?.message}` });
      return [null, err];
    }
  }

  async claimAgentTask(
    taskId: number,
    agentId: number,
    maxConcurrent: number,
  ): Promise<[IAgentTask | null, Error | null]> {
    try {
      const [runningCount] = await this.countInProgressByAgent(agentId);
      if (runningCount >= maxConcurrent) {
        return [null, new Error("capacity_exceeded")];
      }

      const now = new Date().getTime();
      const [count] = await AgentTaskModel.update(
        {
          status: AgentTaskStatus.IN_PROGRESS,
          assignedAgentId: agentId,
          claimedAt: now,
          startedAt: now,
          updateAt: now,
        } as any,
        { where: { id: taskId, status: AgentTaskStatus.INIT } },
      );

      if (count === 0) {
        return [null, new Error("already_claimed")];
      }

      return await this.getOneAgentTask(taskId);
    } catch (err: any) {
      logEveryWhere({ message: `claimAgentTask() error: ${err?.message}` });
      return [null, err];
    }
  }

  async unassignTasksByAgentIds(
    agentIds: number[],
  ): Promise<[number, Error | null]> {
    try {
      const now = Date.now();
      const [count] = await AgentTaskModel.update(
        {
          assignedAgentId: null,
          status: AgentTaskStatus.INIT,
          claimedAt: null,
          startedAt: null,
          updateAt: now,
        } as any,
        {
          where: {
            assignedAgentId: { [Op.in]: agentIds },
            status: [AgentTaskStatus.INIT, AgentTaskStatus.IN_PROGRESS],
          },
        },
      );
      return [count, null];
    } catch (err: any) {
      logEveryWhere({
        message: `unassignTasksByAgentIds() error: ${err?.message}`,
      });
      return [0, err];
    }
  }

  async deleteAgentTask(
    listId: number[],
  ): Promise<[number | null, Error | null]> {
    try {
      const count = await AgentTaskModel.destroy({ where: { id: listId } });
      return [count, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteAgentTask() error: ${err?.message}` });
      return [null, err];
    }
  }
}

const agentTaskDB = new AgentTaskDB();
export { agentTaskDB };
