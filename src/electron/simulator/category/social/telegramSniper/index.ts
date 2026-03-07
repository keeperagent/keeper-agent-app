import AsyncLock from "async-lock";
import { TelegramSniper } from "./telegramSniper";
import { logEveryWhere } from "@/electron/service/util";
import { TELEGRAM_SNIPER_MODE } from "@/electron/constant";

class TelegramSniperManager {
  private mapSniper: Map<string, TelegramSniper>;
  private lock: AsyncLock;
  private lockKey: string;

  constructor() {
    this.mapSniper = new Map();
    this.lock = new AsyncLock();
    this.lockKey = "TelegramSniperManager";
  }

  private getSniperKey = (
    campaignId: number = 0,
    workflowId: number = 0,
    botToken: string,
    chatId: string,
    profileMode: TELEGRAM_SNIPER_MODE
  ): string => {
    return `${campaignId}_${workflowId}_${botToken}_${chatId}_${profileMode}`;
  };

  getTelegramSniper = async (
    campaignId: number,
    workflowId: number,
    botToken: string,
    chatId: string,
    profileMode: TELEGRAM_SNIPER_MODE
  ): Promise<TelegramSniper> => {
    const sniperKey = this.getSniperKey(
      campaignId,
      workflowId,
      botToken,
      chatId,
      profileMode
    );
    const sniper = this.mapSniper.get(sniperKey);
    if (sniper?.isRunning) {
      return sniper;
    }

    logEveryWhere({ message: `Creating Telegram sniper for chat: ${chatId}` });
    return await this.lock.acquire(this.lockKey, async () => {
      if (sniper) {
        sniper.start();
        return sniper;
      } else {
        const newSniper = new TelegramSniper(botToken, chatId, profileMode);
        this.mapSniper.set(sniperKey, newSniper);
        newSniper.start();
        return newSniper;
      }
    });
  };

  stopTelegramSniper = async (
    campaignId: number,
    workflowId: number,
    botToken: string,
    chatId: string,
    profileMode: TELEGRAM_SNIPER_MODE
  ): Promise<void> => {
    const sniperKey = this.getSniperKey(
      campaignId,
      workflowId,
      botToken,
      chatId,
      profileMode
    );
    const sniper = this.mapSniper.get(sniperKey);
    sniper?.stop();
  };
}

export { TelegramSniperManager };
export { TelegramSniper } from "./telegramSniper";
export type { ISnipeTelegramResult } from "./telegramSniper";
