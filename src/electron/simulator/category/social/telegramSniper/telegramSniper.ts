import { Telegraf, Context } from "telegraf";
import AsyncLock from "async-lock";
import { logEveryWhere } from "@/electron/service/util";
import { TELEGRAM_SNIPER_MODE } from "@/electron/constant";

export type ISnipeTelegramResult = {
  message: string;
  date: string; // Format: yyyy-mm-dd hh:mm
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000); // Telegram timestamps are in seconds
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

class TelegramSniper {
  private results: ISnipeTelegramResult[];
  private bot: Telegraf | null;
  private chatId: string;
  private shouldStop: boolean;
  isRunning: boolean;
  private lock: AsyncLock;
  private lockKey: string;
  private botToken: string;
  private profileMode: TELEGRAM_SNIPER_MODE;
  private startTimestamp: number | null;

  constructor(
    botToken: string,
    chatId: string,
    profileMode: TELEGRAM_SNIPER_MODE
  ) {
    this.results = [];
    this.bot = null;
    this.botToken = botToken;
    this.chatId = chatId;
    this.shouldStop = false;
    this.isRunning = false;
    this.lock = new AsyncLock();
    this.lockKey = "TelegramSniper";
    this.profileMode = profileMode;
    this.startTimestamp = null;
  }

  clearOldestMessage = async () => {
    await this.lock.acquire(this.lockKey, () => {
      const removedOldResult = this.results.shift();
      logEveryWhere({
        message: `Telegram sniper removedOldResult: ${JSON.stringify(removedOldResult)}`,
      });
    });
  };

  getSampleResult = (size: number): [ISnipeTelegramResult[], number] => {
    const totalData = this.results?.length;
    if (totalData <= size) {
      return [this.results, totalData];
    }

    return [this.results.slice(totalData - size), totalData];
  };

  getOldestResult = async (): Promise<ISnipeTelegramResult | null> => {
    return await this.lock.acquire(this.lockKey, () => {
      if (this.results?.length === 0) {
        return null;
      }

      if (this.profileMode === TELEGRAM_SNIPER_MODE.ONE_EVENT_ONE_PROFILE) {
        const oldestEvent = this.results.shift();
        return oldestEvent || null;
      }
      return this.results[0];
    });
  };

  stop = () => {
    this.shouldStop = true;
    if (this.bot) {
      try {
        this?.bot?.stop();
        logEveryWhere({ message: `Telegram sniper stopped for chat: ${this.chatId}` });
      } catch (err: any) {
        logEveryWhere({ message: `Telegram sniper stop() error: ${err?.message}` });
      }
      this.bot = null;
    }
    this.isRunning = false;
    this.startTimestamp = null; // Reset start timestamp when stopped
  };

  start = async () => {
    if (this.isRunning) {
      return;
    }
    this.startTimestamp = Math.floor(Date.now() / 1000);

    this.isRunning = true;
    this.shouldStop = false;

    try {
      this.bot = new Telegraf(this.botToken);

      // Normalize chatId - remove @ if present, convert to number if possible
      const normalizedChatId = this.chatId.startsWith("@")
        ? this.chatId.substring(1)
        : this.chatId;
      const targetChatIdNum = isNaN(Number(normalizedChatId))
        ? normalizedChatId
        : Number(normalizedChatId);

      // Listen to all text messages
      this.bot.on("text", async (ctx: Context) => {
        if (this.shouldStop) {
          return;
        }

        const message = ctx.message;
        if (!message) {
          return;
        }

        // Check if message is from the target chat
        const messageChatId = ctx.chat?.id?.toString();
        const chatIdStr = targetChatIdNum.toString();

        // Match chat ID (can be numeric or username)
        let isTargetChat = false;
        if (messageChatId === chatIdStr) {
          isTargetChat = true;
        } else if (ctx.chat && "username" in ctx.chat && ctx?.chat?.username) {
          const chatUsername = ctx.chat.username.toLowerCase();
          if (chatUsername === normalizedChatId.toLowerCase()) {
            isTargetChat = true;
          }
        }

        if (!isTargetChat) {
          return;
        }

        // Ignore old messages - only process messages sent after bot started
        const messageDate = message?.date || Math.floor(Date.now() / 1000);
        if (this.startTimestamp !== null && messageDate < this.startTimestamp) {
          return;
        }

        // Extract message content
        const messageText = "text" in message ? message?.text || "" : "";
        const formattedDate = formatDate(messageDate);

        const result: ISnipeTelegramResult = {
          message: messageText,
          date: formattedDate,
        };

        await this.lock.acquire(this.lockKey, () => {
          this.results.push(result);
          logEveryWhere({
            message: `Telegram sniper new message from chat: ${JSON.stringify(result)}`,
          });
        });
      });

      // Also listen to channel posts (for channels where bot is admin)
      this.bot.on("channel_post", async (ctx: Context) => {
        if (this.shouldStop) {
          return;
        }

        const channelPost = ctx.channelPost;
        if (!channelPost || !("text" in channelPost)) {
          return;
        }

        // Check if message is from the target chat
        const messageChatId = ctx.chat?.id?.toString();
        const chatIdStr = targetChatIdNum.toString();

        let isTargetChat = false;
        if (messageChatId === chatIdStr) {
          isTargetChat = true;
        } else if (ctx.chat && "username" in ctx.chat && ctx.chat.username) {
          const chatUsername = ctx.chat.username.toLowerCase();
          if (chatUsername === normalizedChatId.toLowerCase()) {
            isTargetChat = true;
          }
        }

        if (!isTargetChat) {
          return;
        }

        // Ignore old messages - only process messages sent after bot started
        const messageDate = channelPost.date || Math.floor(Date.now() / 1000);
        if (this.startTimestamp !== null && messageDate < this.startTimestamp) {
          return;
        }

        const messageText = "text" in channelPost ? channelPost.text || "" : "";
        const formattedDate = formatDate(messageDate);

        const result: ISnipeTelegramResult = {
          message: messageText,
          date: formattedDate,
        };

        await this.lock.acquire(this.lockKey, () => {
          this.results.push(result);
          logEveryWhere({
            message: `Telegram sniper new message from channel: ${JSON.stringify(result)}`,
          });
        });
      });

      // Start polling
      await this.bot.launch();

      logEveryWhere({
        message: `Telegram sniper started, listening to chat: ${this.chatId}, startTimestamp: ${this.startTimestamp}`,
      });
    } catch (err: any) {
      logEveryWhere({ message: `Telegram sniper start() error: ${err?.message}` });
      this.isRunning = false;
    }
  };
}

export { TelegramSniper };
