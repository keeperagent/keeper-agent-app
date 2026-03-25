import _ from "lodash";
import { IAgentTask, AgentTaskStatus } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { formatAgentTask } from "@/electron/service/formatData";
import { AgentTaskModel, AgentRegistryModel } from "./index";

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
          ["priority", "DESC"],
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
  ): Promise<[IAgentTask | null, Error | null]> {
    try {
      const [count] = await AgentTaskModel.update(
        {
          status: AgentTaskStatus.ASSIGNED,
          assignedAgentId: agentId,
          claimedAt: new Date().getTime(),
          updateAt: new Date().getTime(),
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
