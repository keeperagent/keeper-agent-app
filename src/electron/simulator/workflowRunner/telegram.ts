import { Page } from "puppeteer-core";
import {
  IFlowProfile,
  ISendTelegramNodeConfig,
  ISnipeTelegramNodeConfig,
  IWorkflowVariable,
} from "@/electron/type";
import { Telegram } from "@/electron/simulator/category/social/telegram";
import { ThreadManager } from "./threadManager";
import {
  ISnipeTelegramResult,
  TelegramSniperManager,
} from "@/electron/simulator/category/social/telegramSniper";
import {
  processSkipSetting,
  sleep,
  updateVariable,
} from "@/electron/simulator/util";
import { logEveryWhere } from "@/electron/service/util";
import { WORKFLOW_TYPE, TELEGRAM_SNIPER_MODE } from "@/electron/constant";
import { WorkflowRunnerArgs, NodeHandler } from "./index";

export class TelegramWorkflow {
  threadManager: ThreadManager;
  private telegram: Telegram;
  private telegramSniperManager: TelegramSniperManager;

  constructor({ threadManager, telegramSniperManager }: WorkflowRunnerArgs) {
    this.threadManager = threadManager;
    this.telegram = new Telegram();
    this.telegramSniperManager = telegramSniperManager;
  }

  sendTelegram = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<ISendTelegramNodeConfig>({
      flowProfile,
      taskFn: this.telegram.sendMessage,
      timeout:
        ((flowProfile?.config as ISendTelegramNodeConfig)?.timeout || 0) * 1000,
      taskName: "sendTelegram",
      withoutBrowser: true,
    });
  };

  snipeTelegram = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ISnipeTelegramNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      if (!config?.botToken || !config?.chatId) {
        throw new Error(
          "Missing required Telegram credentials (botToken, chatId)",
        );
      }

      const telegramSniper = await this.telegramSniperManager.getTelegramSniper(
        flowProfile.campaignConfig?.campaignId || 0,
        flowProfile.campaignConfig?.workflowId || 0,
        config?.botToken,
        config?.chatId,
        config?.profileMode || TELEGRAM_SNIPER_MODE.ONE_EVENT_ONE_PROFILE,
      );

      let result: ISnipeTelegramResult | null = null;
      while (result === null) {
        result = await telegramSniper.getOldestResult();
        await sleep(1000);
      }

      logEveryWhere({
        campaignId: flowProfile.campaignConfig?.campaignId || 0,
        workflowId: flowProfile.campaignConfig?.workflowId || 0,
        message: `snipeTelegram() received message: ${JSON.stringify(result)}`,
      });

      let newListVariable = listVariable;
      newListVariable = updateVariable(newListVariable, {
        variable: config?.variable || "",
        value: result?.message || "",
      });

      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ISnipeTelegramNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout: 0,
      taskName: "snipeTelegram",
      withoutBrowser: true,
    });
  };
}

export const registerTelegramHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const s = new TelegramWorkflow(args);
  handlers.set(WORKFLOW_TYPE.SEND_TELEGRAM, s.sendTelegram);
  handlers.set(WORKFLOW_TYPE.SNIPE_TELEGRAM, s.snipeTelegram);
};
