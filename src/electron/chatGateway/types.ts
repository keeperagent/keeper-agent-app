/*
 IChatAdapter — interface for chat integrations.
 Each messaging platform (Telegram, WhatsApp, etc.) implements this interface. The AgentChatBridge consumes adapters to route messages to/from the KeeperAgent regardless of where the user is chatting from.
*/

export enum ChatPlatform {
  KEEPER = "KEEPER",
  TELEGRAM = "TELEGRAM",
  WHATSAPP = "WHATSAPP",
}

export enum WhatsAppStatus {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
}

/** A stored chat history record (role/content pair saved to the database). */
export type IChatMessage = {
  id?: number;
  role: string;
  content: string;
  isSummary?: boolean;
  summaryUpTo?: number | null;
  timestamp: number;
  platformId?: ChatPlatform;
  platformChatId?: string;
};

/** A live incoming message from a chat platform to the agent bridge. */
export type IPlatformMessage = {
  platformId: ChatPlatform;
  chatId: string;
  userId: string;
  text: string;
  messageId?: string | number;
};

export interface IChatAdapter {
  platformId: ChatPlatform;

  maxMessageLength: number;

  sendText: (chatId: string, text: string) => Promise<void>;

  sendMarkdown: (chatId: string, markdown: string) => Promise<void>;

  // Show a "Typing..." indicator on the chat app (Telegram) while the agent is processing
  sendTypingIndicator: (chatId: string) => Promise<void>;

  /*
    Edit an existing message in-place (for progressive streaming updates).
    Returns false if the platform does not support editing or the edit failed.
  */
  editMessage: (
    chatId: string,
    messageId: string | number,
    newText: string,
  ) => Promise<boolean>;

  /*
    Send an initial placeholder message and return its ID.
    Used to create a message that will be progressively edited with streamed content.
  */
  sendPlaceholder: (
    chatId: string,
    text: string,
  ) => Promise<string | number | null>;

  /*
    Register a handler that the adapter calls when a user sends a message.
    The adapter must NOT call this for bot slash commands (like Telegram bot command) —
    those are handled by the adapter itself. Only regular chat messages go to this handler.
  */
  onMessage: (handler: (message: IPlatformMessage) => void) => void;
}
