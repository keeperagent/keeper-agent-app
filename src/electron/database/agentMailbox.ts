import { Op } from "sequelize";
import { IAgentMailbox, AgentMailboxStatus } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { formatAgentMailbox } from "@/electron/service/formatData";
import { AgentMailboxModel, AgentRegistryModel } from "./index";

class AgentMailboxDB {
  async createMessage(
    data: IAgentMailbox,
  ): Promise<[IAgentMailbox | null, Error | null]> {
    try {
      const message = await AgentMailboxModel.create(
        {
          ...data,
          status: AgentMailboxStatus.UNREAD,
          createAt: Date.now(),
        } as any,
        { raw: false },
      );
      return [formatAgentMailbox(message), null];
    } catch (err: any) {
      logEveryWhere({ message: `createMessage() error: ${err?.message}` });
      return [null, err];
    }
  }

  async getMessagesForAgent(
    agentId: number,
    includeAcknowledged = false,
  ): Promise<[IAgentMailbox[] | null, Error | null]> {
    try {
      const statusFilter = includeAcknowledged
        ? undefined
        : { [Op.ne]: AgentMailboxStatus.ACKNOWLEDGED };

      const data = await AgentMailboxModel.findAll({
        where: {
          [Op.or]: [{ toAgentId: agentId }, { isBroadcast: true }],
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        include: [
          {
            model: AgentRegistryModel,
            as: "fromAgent",
            attributes: ["id", "name"],
            required: false,
          },
        ],
        order: [["createAt", "DESC"]],
      });
      const listData = data.map((item: any) => formatAgentMailbox(item));
      return [listData, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getMessagesForAgent() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async acknowledgeMessage(id: number): Promise<[boolean, Error | null]> {
    try {
      const [count] = await AgentMailboxModel.update(
        { status: AgentMailboxStatus.ACKNOWLEDGED } as any,
        {
          where: {
            id,
            status: { [Op.ne]: AgentMailboxStatus.ACKNOWLEDGED },
          },
        },
      );
      return [count > 0, null];
    } catch (err: any) {
      logEveryWhere({ message: `acknowledgeMessage() error: ${err?.message}` });
      return [false, err];
    }
  }

  async deleteOldMessages(
    olderThanMs: number,
  ): Promise<[number, Error | null]> {
    try {
      const cutoff = Date.now() - olderThanMs;
      const count = await AgentMailboxModel.destroy({
        where: {
          createAt: { [Op.lt]: cutoff },
          status: AgentMailboxStatus.ACKNOWLEDGED,
        },
      });
      return [count, null];
    } catch (err: any) {
      logEveryWhere({ message: `deleteOldMessages() error: ${err?.message}` });
      return [0, err];
    }
  }
}

const agentMailboxDB = new AgentMailboxDB();
export { agentMailboxDB };
