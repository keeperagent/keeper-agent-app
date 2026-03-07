import { Page } from "puppeteer-core";
import { TelegramClient } from "telegram";
import {
  ISendTelegramNodeConfig,
  IWorkflowVariable,
  IFlowProfile,
} from "@/electron/type";
import { getActualValue, processSkipSetting } from "@/electron/simulator/util";
import { telegramBotService } from "@/electron/service/telegramBot";

export class Telegram {
  private listRunningClient: TelegramClient[];

  constructor() {
    this.listRunningClient = [];
  }

  stopAllTelegramClient = async () => {
    for (let i = 0; i < this.listRunningClient.length; i++) {
      const client = this.listRunningClient[i];
      if (client) {
        await client?.disconnect();
      }
    }

    this.listRunningClient = [];
  };

  sendMessage = async (
    page: Page,
    config: ISendTelegramNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    const err = await telegramBotService.sendMessage(
      config?.botToken || "",
      getActualValue(config?.message || "", listVariable),
      config?.chatId || "",
      config?.imageGIF,
    );
    if (err) {
      throw err;
    }

    return flowProfile;
  };
}
