import { ChatPlatform } from "@/electron/chatGateway/types";
import type {
  IChatAdapter,
  IPlatformMessage,
} from "@/electron/chatGateway/types";

export type WhatsAppChatAdapter = IChatAdapter & {
  receive: (message: IPlatformMessage) => Promise<void>;
  setSendText: (fn: (chatId: string, text: string) => Promise<void>) => void;
  setSendPresence: (fn: (chatId: string) => Promise<void>) => void;
};

export const createWhatsAppChatAdapter = (): WhatsAppChatAdapter => {
  let messageHandler:
    | ((message: IPlatformMessage) => void | Promise<void>)
    | null = null;

  let sendTextFn: ((chatId: string, text: string) => Promise<void>) | null =
    null;

  let sendPresenceFn: ((chatId: string) => Promise<void>) | null = null;

  return {
    platformId: ChatPlatform.WHATSAPP,
    maxMessageLength: 4096,

    setSendText: (handler) => {
      sendTextFn = handler;
    },

    setSendPresence: (handler) => {
      sendPresenceFn = handler;
    },

    sendText: async (chatId, text) => {
      if (sendTextFn) {
        await sendTextFn(chatId, text);
      }
    },

    sendMarkdown: async (chatId, text) => {
      if (sendTextFn) {
        await sendTextFn(chatId, text);
      }
    },

    sendTypingIndicator: async (chatId) => {
      if (sendPresenceFn) {
        await sendPresenceFn(chatId);
      }
    },

    editMessage: async () => {
      return false;
    },

    sendPlaceholder: async () => {
      return null;
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
