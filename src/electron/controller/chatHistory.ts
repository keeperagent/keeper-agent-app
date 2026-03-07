import { MESSAGE } from "@/electron/constant";
import { chatHistoryDB } from "@/electron/database/chatHistory";
import type {
  IpcChatHistorySaveMessagePayload,
  IpcChatHistoryLoadPayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const chatHistoryController = () => {
  onIpc<IpcChatHistorySaveMessagePayload>(
    MESSAGE.CHAT_HISTORY_SAVE_MESSAGE,
    MESSAGE.CHAT_HISTORY_SAVE_MESSAGE_RES,
    async (event, payload) => {
      const { role, content, timestamp } = payload || {};
      const [data, err] = await chatHistoryDB.saveMessage({
        role: role || "",
        content: content || "",
        timestamp: timestamp || Date.now(),
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
      const { limit } = payload || {};
      const [data, err] = await chatHistoryDB.getRecentMessages(limit);
      event.reply(MESSAGE.CHAT_HISTORY_LOAD_RES, {
        data,
        error: err?.message,
      });
    },
  );

  onIpc(
    MESSAGE.CHAT_HISTORY_CLEAR,
    MESSAGE.CHAT_HISTORY_CLEAR_RES,
    async (event) => {
      const [data, err] = await chatHistoryDB.clearHistory();
      event.reply(MESSAGE.CHAT_HISTORY_CLEAR_RES, {
        data,
        error: err?.message,
      });
    },
  );
};
