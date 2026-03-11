import type { Telegraf } from "telegraf";
import { ChatPlatform } from "@/electron/chatGateway/types";
import type {
  IChatAdapter,
  IPlatformMessage,
} from "@/electron/chatGateway/types";

export type TelegramChatAdapter = IChatAdapter & {
  receive: (message: IPlatformMessage) => Promise<void>;
};

export const createTelegramChatAdapter = (
  telegramBot: Telegraf,
): TelegramChatAdapter => {
  let messageHandler:
    | ((message: IPlatformMessage) => void | Promise<void>)
    | null = null;

  return {
    platformId: ChatPlatform.TELEGRAM,
    maxMessageLength: 4096,

    sendText: async (chatId, text) => {
      await telegramBot.telegram.sendMessage(chatId, text);
    },

    sendMarkdown: async (chatId, html) => {
      try {
        await telegramBot.telegram.sendMessage(chatId, html, {
          parse_mode: "HTML",
        });
      } catch {
        await telegramBot.telegram.sendMessage(chatId, html);
      }
    },

    sendTypingIndicator: async (chatId) => {
      await telegramBot.telegram.sendChatAction(chatId, "typing");
    },

    editMessage: async (chatId, messageId, newText) => {
      try {
        await telegramBot.telegram.editMessageText(
          chatId,
          Number(messageId),
          undefined,
          newText,
          { parse_mode: "HTML" },
        );
        return true;
      } catch {
        return false;
      }
    },

    sendPlaceholder: async (chatId, text) => {
      try {
        const sent = await telegramBot.telegram.sendMessage(chatId, text);
        return String(sent.message_id);
      } catch {
        return null;
      }
    },

    onMessage: (handler) => {
      messageHandler = handler;
    },

    receive: async (message) => {
      if (messageHandler) {
        await messageHandler(message);
      }
    },
  };
};
