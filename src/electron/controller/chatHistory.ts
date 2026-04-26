import { MESSAGE } from "@/electron/constant";
import { chatHistoryDB } from "@/electron/database/chatHistory";
import { ChatPlatform, ChatRole } from "@/electron/chatGateway/types";
import type {
  IpcChatHistorySaveMessagePayload,
  IpcChatHistoryLoadPayload,
  IpcChatHistoryClearPayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const chatHistoryController = () => {
  onIpc<IpcChatHistorySaveMessagePayload>(
    MESSAGE.CHAT_HISTORY_SAVE_MESSAGE,
    MESSAGE.CHAT_HISTORY_SAVE_MESSAGE_RES,
    async (event, payload) => {
      const { role, content, timestamp, sessionId, runId, agentProfileId } =
        payload || {};
      const [data, err] = await chatHistoryDB.saveMessage({
        role: (role as ChatRole) || ChatRole.HUMAN,
        content: content || "",
        timestamp: timestamp || Date.now(),
        platformId: ChatPlatform.KEEPER,
        platformChatId: ChatPlatform.KEEPER,
        sessionId: sessionId || null,
        runId: runId || null,
        agentProfileId,
      });
      event.reply(MESSAGE.CHAT_HISTORY_SAVE_MESSAGE_RES, {
        data,
        error: err?.message,
      });
    },
  );

  onIpc<IpcChatHistoryLoadPayload>(
    MESSAGE.CHAT_HISTORY_LOAD,
    MESSAGE.CHAT_HISTORY_LOAD_RES,
    async (event, payload) => {
      const { limit, agentProfileId } = payload || {};
      const [data, err] = await chatHistoryDB.getRecentMessages(
        limit,
        ChatPlatform.KEEPER,
        ChatPlatform.KEEPER,
        agentProfileId,
      );
      event.reply(MESSAGE.CHAT_HISTORY_LOAD_RES, {
        data,
        error: err?.message,
      });
    },
  );

  onIpc<IpcChatHistoryClearPayload>(
    MESSAGE.CHAT_HISTORY_CLEAR,
    MESSAGE.CHAT_HISTORY_CLEAR_RES,
    async (event, payload) => {
      const { agentProfileId } = payload || {};
      const [data, err] = await chatHistoryDB.clearHistory(
        ChatPlatform.KEEPER,
        ChatPlatform.KEEPER,
        agentProfileId,
      );
      event.reply(MESSAGE.CHAT_HISTORY_CLEAR_RES, {
        data,
        error: err?.message,
      });
    },
  );
};
