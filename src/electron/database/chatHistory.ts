import { Op } from "sequelize";
import { redact } from "@keeperagent/crypto-key-guard";
import { logEveryWhere } from "@/electron/service/util";
import { ChatPlatform, ChatRole, IChatMessage } from "@/electron/chatGateway/types";
import { ChatHistoryModel } from "./index";

type AgentContext = {
  summary: IChatMessage | null;
  messages: IChatMessage[];
};

// How many messages to return for UI display
export const RECENT_MESSAGES_LIMIT = 40;
// How many verbatim messages to inject into agent context
export const AGENT_CONTEXT_LIMIT = 20;

class ChatHistoryDB {
  async saveMessage(
    msg: IChatMessage,
  ): Promise<[IChatMessage | null, Error | null]> {
    try {
      // Layer 3: strip crypto secrets from message content before persisting
      const { text } = redact(msg.content);
      const data = await ChatHistoryModel.create({
        ...msg,
        content: text,
      });
      return [data.toJSON() as IChatMessage, null];
    } catch (err: any) {
      logEveryWhere({
        message: `ChatHistoryDB.saveMessage error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  /** Returns the last `limit` human/ai messages sorted oldest→newest for UI display. */
  async getRecentMessages(
    limit = RECENT_MESSAGES_LIMIT,
    platformId: ChatPlatform,
    platformChatId: string,
  ): Promise<[IChatMessage[], Error | null]> {
    try {
      const rows = await ChatHistoryModel.findAll({
        where: {
          isSummary: false,
          platformId,
          platformChatId,
        },
        order: [["timestamp", "DESC"]],
        limit,
        raw: true,
      });
      // Reverse so the UI gets oldest-first order
      return [(rows as any[]).reverse() as IChatMessage[], null];
    } catch (err: any) {
      logEveryWhere({
        message: `ChatHistoryDB.getRecentMessages error: ${err?.message}`,
      });
      return [[], err];
    }
  }

  /**
   * Returns the context to inject into the agent's system prompt:
   * - the latest summary (if any) covering older messages
   * - the most recent AGENT_CONTEXT_LIMIT verbatim messages after the summary cutoff
   */
  async getAgentContext(
    platformId: ChatPlatform,
    platformChatId: string,
  ): Promise<[AgentContext, Error | null]> {
    try {
      const summaryRow = (await ChatHistoryModel.findOne({
        where: { isSummary: true, platformId, platformChatId },
        order: [["timestamp", "DESC"]],
        raw: true,
      })) as any;

      const summaryUpTo: number = summaryRow?.summaryUpTo || 0;

      const recentRows = await ChatHistoryModel.findAll({
        where: {
          isSummary: false,
          platformId,
          platformChatId,
          ...(summaryUpTo > 0 ? { id: { [Op.gt]: summaryUpTo } } : {}),
        },
        order: [["timestamp", "DESC"]],
        limit: AGENT_CONTEXT_LIMIT,
        raw: true,
      });

      // Reverse so the agent receives messages in chronological (oldest-first) order
      const messages = (recentRows as any[] as IChatMessage[]).reverse();

      return [
        {
          summary: summaryRow ? (summaryRow as IChatMessage) : null,
          messages,
        },
        null,
      ];
    } catch (err: any) {
      logEveryWhere({
        message: `ChatHistoryDB.getAgentContext error: ${err?.message}`,
      });
      return [{ summary: null, messages: [] }, err];
    }
  }

  /**
   * Get messages that should be included in a new summary.
   * Returns all unsummarised messages up to (but not including) the most recent
   * AGENT_CONTEXT_LIMIT messages, so fresh context remains verbatim.
   */
  async getMessagesForSummarization(
    platformId: ChatPlatform,
    platformChatId: string,
  ): Promise<[IChatMessage[], Error | null]> {
    try {
      const summaryRow = (await ChatHistoryModel.findOne({
        where: { isSummary: true, platformId, platformChatId },
        order: [["timestamp", "DESC"]],
        raw: true,
      })) as any;

      const summaryUpTo: number = summaryRow?.summaryUpTo || 0;

      // All unsummarised messages
      const allRows = (await ChatHistoryModel.findAll({
        where: {
          isSummary: false,
          platformId,
          platformChatId,
          ...(summaryUpTo > 0 ? { id: { [Op.gt]: summaryUpTo } } : {}),
        },
        order: [["timestamp", "ASC"]],
        raw: true,
      })) as any[] as IChatMessage[];

      // Keep the most recent AGENT_CONTEXT_LIMIT messages verbatim — summarise everything older
      const toSummarize = allRows.slice(0, -AGENT_CONTEXT_LIMIT);
      return [toSummarize, null];
    } catch (err: any) {
      logEveryWhere({
        message: `ChatHistoryDB.getMessagesForSummarization() error: ${err?.message}`,
      });
      return [[], err];
    }
  }

  /** Replaces any existing summary with a new one. */
  async saveSummary(
    content: string,
    summaryUpTo: number,
    platformId: ChatPlatform,
    platformChatId: string,
  ): Promise<[IChatMessage | null, Error | null]> {
    try {
      await ChatHistoryModel.destroy({
        where: { isSummary: true, platformId, platformChatId },
      });
      const data = await ChatHistoryModel.create({
        role: ChatRole.SUMMARY,
        content,
        isSummary: true,
        summaryUpTo,
        timestamp: Date.now(),
        platformId,
        platformChatId,
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
  ): Promise<[number | null, Error | null]> {
    try {
      const count = await ChatHistoryModel.destroy({
        where: { platformId, platformChatId },
      });
      return [count, null];
    } catch (err: any) {
      logEveryWhere({
        message: `ChatHistoryDB.clearHistory error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  /** Returns the id of the last non-summary message. Used as the summaryUpTo cutoff. */
  async getLastMessageId(
    platformId: ChatPlatform,
    platformChatId: string,
  ): Promise<number | null> {
    try {
      const row = (await ChatHistoryModel.findOne({
        where: {
          isSummary: false,
          platformId,
          platformChatId,
        },
        order: [["id", "DESC"]],
        attributes: ["id"],
        raw: true,
      })) as any;
      return row?.id || null;
    } catch {
      return null;
    }
  }
}

export const chatHistoryDB = new ChatHistoryDB();
