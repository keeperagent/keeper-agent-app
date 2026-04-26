import { Op } from "sequelize";
import { redact } from "@keeperagent/crypto-key-guard";
import { logEveryWhere } from "@/electron/service/util";
import {
  ChatPlatform,
  ChatRole,
  IChatMessage,
} from "@/electron/chatGateway/types";
import { ChatHistoryModel } from "./index";

const RECENT_MESSAGES_LIMIT = 40;
const COMPACTION_KEEP_COUNT = 20;

class ChatHistoryDB {
  async saveMessage(
    msg: IChatMessage & { agentProfileId?: number | null },
  ): Promise<[IChatMessage | null, Error | null]> {
    try {
      const content =
        msg.role === ChatRole.HUMAN ? redact(msg.content).text : msg.content;
      const data = await ChatHistoryModel.create({
        ...msg,
        content,
      });
      return [data.toJSON() as IChatMessage, null];
    } catch (err: any) {
      logEveryWhere({
        message: `ChatHistoryDB.saveMessage error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async getRecentMessages(
    limit = RECENT_MESSAGES_LIMIT,
    platformId: ChatPlatform,
    platformChatId: string,
    agentProfileId?: number | null,
  ): Promise<[IChatMessage[], Error | null]> {
    try {
      const where: Record<string, any> = {
        isSummary: false,
        platformId,
        platformChatId,
      };
      if (agentProfileId != null) {
        where.agentProfileId = agentProfileId;
      }
      const rows = await ChatHistoryModel.findAll({
        where,
        order: [["timestamp", "DESC"]],
        limit,
        raw: true,
      });
      return [(rows as any[]).reverse() as IChatMessage[], null];
    } catch (err: any) {
      logEveryWhere({
        message: `ChatHistoryDB.getRecentMessages error: ${err?.message}`,
      });
      return [[], err];
    }
  }

  async getMessagesForSummarization(
    platformId: ChatPlatform,
    platformChatId: string,
    agentProfileId?: number | null,
  ): Promise<[IChatMessage[], Error | null]> {
    try {
      const where: Record<string, any> = { platformId, platformChatId };
      if (agentProfileId != null) {
        where.agentProfileId = agentProfileId;
      }

      const summaryRow = (await ChatHistoryModel.findOne({
        where: { ...where, isSummary: true },
        order: [["timestamp", "DESC"]],
        raw: true,
      })) as any;

      const summaryUpTo: number = summaryRow?.summaryUpTo || 0;

      const allRows = (await ChatHistoryModel.findAll({
        where: {
          ...where,
          isSummary: false,
          ...(summaryUpTo > 0 ? { id: { [Op.gt]: summaryUpTo } } : {}),
        },
        order: [["timestamp", "ASC"]],
        raw: true,
      })) as any[] as IChatMessage[];

      const toSummarize = allRows.slice(0, -COMPACTION_KEEP_COUNT);
      return [toSummarize, null];
    } catch (err: any) {
      logEveryWhere({
        message: `ChatHistoryDB.getMessagesForSummarization() error: ${err?.message}`,
      });
      return [[], err];
    }
  }

  async saveSummary(
    content: string,
    summaryUpTo: number,
    platformId: ChatPlatform,
    platformChatId: string,
    agentProfileId?: number | null,
  ): Promise<[IChatMessage | null, Error | null]> {
    try {
      const where: Record<string, any> = {
        isSummary: true,
        platformId,
        platformChatId,
      };
      if (agentProfileId != null) {
        where.agentProfileId = agentProfileId;
      }
      await ChatHistoryModel.destroy({ where: where });
      const data = await ChatHistoryModel.create({
        role: ChatRole.SUMMARY,
        content,
        isSummary: true,
        summaryUpTo,
        timestamp: Date.now(),
        platformId,
        platformChatId,
        agentProfileId: agentProfileId ?? null,
      });
      return [data.toJSON() as IChatMessage, null];
    } catch (err: any) {
      logEveryWhere({
        message: `ChatHistoryDB.saveSummary error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async clearHistory(
    platformId: ChatPlatform,
    platformChatId: string,
    agentProfileId?: number | null,
  ): Promise<[number | null, Error | null]> {
    try {
      const where: Record<string, any> = { platformId, platformChatId };
      if (agentProfileId != null) {
        where.agentProfileId = agentProfileId;
      }
      const count = await ChatHistoryModel.destroy({ where });
      return [count, null];
    } catch (err: any) {
      logEveryWhere({
        message: `ChatHistoryDB.clearHistory error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  async updateRunCompletion(
    id: number,
    data: {
      toolCallSequence: string | null;
      todoTemplate: string | null;
      runOutcome: string | null;
    },
  ): Promise<void> {
    try {
      await ChatHistoryModel.update(data, { where: { id } });
    } catch (err: any) {
      logEveryWhere({
        message: `ChatHistoryDB.updateRunCompletion error: ${err?.message}`,
      });
    }
  }
}

export const chatHistoryDB = new ChatHistoryDB();
