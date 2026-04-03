import fs from "fs-extra";
import { exec } from "child_process";
import { promisify } from "util";
import { BrowserContext, Page } from "playwright-core";
import UserAgent from "user-agents";
import { BaseBrowser } from "./baseBrowser";
import {
  ISimulator,
  getProfilePath,
  getProfileNameForThread,
  sleep,
  processSkipSetting,
  sendWithTimeout,
} from "@/electron/simulator/util";
import { DEFAULT_TIMEOUT } from "@/electron/simulator/constant";
import {
  IFlowProfile,
  ISwitchWindowNodeConfig,
  IWorkflowVariable,
  IProfileProxy,
  INodeConfig,
  IEVMSnipeContractNodeConfig,
  ISnipeContractInput,
  INodeEndpoint,
} from "@/electron/type";
import {
  WINDOW_TYPE,
  USER_AGENT_CATEGORY,
  WORKFLOW_TYPE,
  TELEGRAM_SNIPER_MODE,
} from "@/electron/constant";
import { StopSignal } from "@/electron/simulator/stopSignal";
import { logEveryWhere } from "@/electron/service/util";
import { workflowDB } from "@/electron/database/workflow";
import { EVMContractSnipperManager } from "@/electron/simulator/category/onchain/evmContractSniper";
import {
  getMarketcapCheckingManager,
  getPriceCheckingManager,
  getTelegram,
} from "@/electron/inject";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { ContractSniper } from "@/electron/simulator/category/onchain/evmContractSniper/contractSniper";
import { SolanaVanityAddressManager } from "@/electron/simulator/category/onchain/vanityAddress/solanaVanityAddress";
import {
  TelegramSniperManager,
  TelegramSniper,
} from "@/electron/simulator/category/social/telegramSniper";
import { ISnipeTelegramNodeConfig } from "@/electron/type";

// contain information about a Thread
export type Thread = {
  simulator: ISimulator;
  flowProfile: IFlowProfile; // current status of data
};

// @ThreadManager class used to manage or initiate each Thread

export class ThreadManager {
  private baseBrowser: BaseBrowser;
  private mapThread: { [threadID: string]: Thread };
  private stopSignal: StopSignal;
  private evmContractSnipperManager: EVMContractSnipperManager;
  private solanaVanityAddressManager: SolanaVanityAddressManager;
  private telegramSniperManager: TelegramSniperManager;

  constructor({
    baseBrowser,
    stopSignal,
    evmContractSnipperManager,
    solanaVanityAddressManager,
    telegramSniperManager,
  }: {
    baseBrowser: BaseBrowser;
    stopSignal: StopSignal;
    evmContractSnipperManager: EVMContractSnipperManager;
    solanaVanityAddressManager: SolanaVanityAddressManager;
    telegramSniperManager: TelegramSniperManager;
  }) {
    this.baseBrowser = baseBrowser;
    this.mapThread = {};
    this.stopSignal = stopSignal;
    this.evmContractSnipperManager = evmContractSnipperManager;
    this.solanaVanityAddressManager = solanaVanityAddressManager;
    this.telegramSniperManager = telegramSniperManager;
  }

  // return [@profileName, @profileKey]
  private getProfileKey(
    threadID: string,
    flowProfile?: IFlowProfile,
  ): [string, string] {
    let profileName = getProfileNameForThread(threadID);
    if (flowProfile?.isSaveProfile) {
      profileName = flowProfile?.profile?.profileFolder!;
    }
    const profileKey = `${profileName}_${flowProfile?.profile?.profileFolder}`;
    return [profileName, profileKey];
  }

  getThread = (threadId: string): Thread => {
    return this.mapThread[threadId];
  };

  updateThread = (threadId: string, thread: Thread) => {
    this.mapThread[threadId] = thread;
  };

  // @openBrowser: is Node need browser to run
  getOrCreateThread = async ({
    flowProfile,
    openBrowser,
  }: {
    flowProfile: IFlowProfile;
    openBrowser: boolean;
  }): Promise<[IFlowProfile, Error | null]> => {
    const { threadID, profile, campaignConfig } = flowProfile;

    try {
      if (!this.mapThread?.[threadID]) {
        // assign @page, @browser with null very soon to prevent create too redundant simulator
        this.mapThread[threadID] = {
          simulator: {
            browser: null,
            listPage: [],
            currentPageIndex: null,
            isCreateNewFolder: false,
            browserProcessId: null,
          },
          flowProfile,
        };
      }
      const thread = this.mapThread?.[threadID];

      if (thread?.simulator?.browser === null && openBrowser) {
        const [profileName, profileKey] = this.getProfileKey(
          threadID,
          flowProfile,
        );

        // set user agent
        let userAgent = "";
        if (campaignConfig?.isUseRandomUserAgent) {
          if (campaignConfig?.userAgentCategory === USER_AGENT_CATEGORY.MACOS) {
            userAgent = new UserAgent([
              /Chrome/,
              {
                platform: "MacIntel",
              },
            ])
              ?.random()
              ?.toString();
          } else if (
            campaignConfig?.userAgentCategory === USER_AGENT_CATEGORY.WINDOW
          ) {
            userAgent = new UserAgent([
              /Chrome/,
              {
                platform: "Win32",
              },
            ])
              ?.random()
              .toString();
          }
        }

        const profileProxy: IProfileProxy = {
          isUseProxy: Boolean(campaignConfig?.isUseProxy),
          proxy: profile?.proxy,
        };

        const [newSimulator, err] = await this.baseBrowser.createBrowser({
          profileName,
          profileKey,
          threadID,
          profileProxy,
          userAgent,
          windowWidth: campaignConfig?.windowWidth,
          windowHeight: campaignConfig?.windowHeight,
          isFullScreen: campaignConfig?.isFullScreen,
          totalScreen: campaignConfig?.totalScreen,
          defaultOpenUrl: campaignConfig?.defaultOpenUrl,
        });
        if (newSimulator === null || err) {
          return [flowProfile, err];
        }

        if (this.mapThread[threadID] !== undefined) {
          this.mapThread[threadID].simulator = newSimulator;
        }
      }

      return [flowProfile, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getOrCreateThread() error: ${err?.message}, threadID: ${threadID}`,
      });
      return err;
    }
  };

  private killBrowserProcess = async (
    processId: number,
    threadID: string,
  ): Promise<void> => {
    try {
      const execAsync = promisify(exec);
      const platform = process.platform;
      let killCommand: string;
      if (platform === "win32") {
        killCommand = `taskkill /F /PID ${processId}`;
      } else {
        killCommand = `kill -9 ${processId}`;
      }
      await execAsync(killCommand);
      logEveryWhere({
        message: `Browser process ${processId} killed for thread ${threadID}`,
      });
    } catch {}
  };

  private safeCloseBrowser = async (
    browser: BrowserContext | null,
    browserProcessId: number | null,
    threadID: string,
  ): Promise<void> => {
    if (!browser && !browserProcessId) {
      return;
    }

    try {
      await browser?.close();
    } catch {
      if (browserProcessId) {
        await this.killBrowserProcess(browserProcessId, threadID);
      }
    }
  };

  private cleanUpThread = async (
    threadID: string,
    shouldRemoveFolder: boolean,
    forceClose: boolean,
  ): Promise<Error | null> => {
    try {
      if (!this.mapThread[threadID]) {
        return null;
      }

      const { simulator, flowProfile } = this.mapThread?.[threadID];
      const [profileName, profileKey] = this.getProfileKey(
        threadID,
        flowProfile,
      );
      if (forceClose) {
        this.stopSignal.saveStopSignal(profileKey);
      }

      if (simulator?.browser || simulator?.browserProcessId) {
        await this.safeCloseBrowser(
          simulator.browser,
          simulator.browserProcessId,
          threadID,
        );
        simulator.browser = null;
        simulator.browserProcessId = null;
      }

      if (shouldRemoveFolder) {
        const tempProfilePath = getProfilePath(profileName);
        const isExist = fs.pathExistsSync(tempProfilePath);
        if (isExist) {
          fs.rmSync(tempProfilePath, { recursive: true, maxRetries: 3 });
        }
      }

      delete this.mapThread[threadID];
      return null;
    } catch (err: any) {
      logEveryWhere({ message: `cleanUpThread() error: ${err?.message}` });
      return err;
    }
  };

  stopThread = async (
    shouldRemoveFolder: boolean,
    threadID: string | undefined,
    campaignId: number = 0,
    workflowId: number = 0,
  ): Promise<boolean> => {
    let isSuccess = false;
    const isStopAllThread = threadID === undefined;

    try {
      const listThreadID: any[] = Object.keys(this.mapThread);
      // clean up when Workflow completed
      if (isStopAllThread) {
        const telegram = getTelegram();
        await telegram.stopAllTelegramClient();
        await this.stopContractSniper(campaignId, workflowId);
        await this.stopTelegramSniper(campaignId, workflowId);
        this.stopSolanaVanityAddress(campaignId, workflowId);

        const priceCheckingManager = getPriceCheckingManager();
        priceCheckingManager.stop(null, workflowId);

        const marketcapCheckingManager = getMarketcapCheckingManager();
        marketcapCheckingManager.stop(null, workflowId);
      }

      const listPromise = [];
      for (let i = 0; i < listThreadID.length; i++) {
        if (isStopAllThread || threadID === listThreadID[i]) {
          const stopPromise = this.cleanUpThread(
            listThreadID[i],
            shouldRemoveFolder,
            isStopAllThread,
          );
          if (isStopAllThread) {
            listPromise.push(stopPromise);
          } else {
            await stopPromise;
          }
        }
      }

      if (isStopAllThread) {
        await Promise.all(listPromise);
        this.stopSignal.removeAllStopSignal();
      }

      isSuccess = true;
    } catch (err: any) {
      logEveryWhere({ message: `stopThread() error: ${err?.message}` });
    }

    return isSuccess;
  };

  runNormalTask = async <T>({
    flowProfile,
    taskFn,
    timeout,
    taskName,
    withExtensionPopup,
    withoutBrowser,
  }: {
    flowProfile: IFlowProfile;
    taskFn: (
      page: Page,
      config: T,
      listVariable: IWorkflowVariable[],
      flowProfile: IFlowProfile,
      browser: BrowserContext | null,
    ) => Promise<IFlowProfile | null>;
    timeout?: number;
    taskName: string;
    withExtensionPopup?: boolean;
    withoutBrowser?: boolean;
  }): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      let err;
      [flowProfile, err] = await this.getOrCreateThread({
        flowProfile,
        openBrowser: !withoutBrowser,
      });
      if (err != null) {
        return [flowProfile, err];
      }

      const { threadID, listVariable = [] } = flowProfile;
      const thread = this.mapThread?.[threadID];
      const config = flowProfile?.config as T;

      if (!thread?.simulator && !withoutBrowser) {
        return [flowProfile, Error("empty browser")];
      }
      const {
        listPage = [],
        currentPageIndex = null,
        browser = null,
      } = thread?.simulator || {};
      if (currentPageIndex === null && !withoutBrowser) {
        return [flowProfile, Error("empty page")];
      }
      let page: any;

      if (currentPageIndex !== null) {
        page = listPage[currentPageIndex];
      }

      let switchWindowConfig: ISwitchWindowNodeConfig = {
        windowType: WINDOW_TYPE.POPUP_WINDOW,
        name: "",
        sleep: 0,
      };
      let tempFlowProfile: IFlowProfile = {
        config: switchWindowConfig,
        threadID: flowProfile?.threadID,
        listVariable: [],
      };

      const shouldSkipNode = processSkipSetting(
        config as INodeConfig,
        listVariable,
      );
      if (withExtensionPopup && !shouldSkipNode) {
        // switch to popup
        const [, err, extensionPage] =
          await this.getExtensionPage(tempFlowProfile);
        if (err) {
          return [flowProfile, err];
        }
        if (!extensionPage) {
          return [flowProfile, Error("can not find extenstion popup")];
        }

        page = extensionPage;
      }

      // run actual task here
      const maxRetries = (config as any)?.retry || 0;
      let attempt = 0;
      let newFlowProfile: IFlowProfile | null = null;
      let taskError: Error | null = null;

      while (attempt <= maxRetries) {
        try {
          const newFlowProfilePromise = taskFn(
            page,
            config,
            listVariable,
            flowProfile,
            browser,
          );
          if (timeout) {
            newFlowProfile = await sendWithTimeout(
              newFlowProfilePromise,
              timeout,
            );
          } else {
            newFlowProfile = await newFlowProfilePromise;
          }
          taskError = null;
          break;
        } catch (retryErr: any) {
          taskError = retryErr;
          if (attempt < maxRetries) {
            logEveryWhere({
              message: `runNormalTask ${taskName}() failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying error: ${retryErr?.message}`,
            });
          }
          attempt++;
        }
      }

      if (taskError) {
        throw taskError;
      }

      if (withExtensionPopup && !shouldSkipNode) {
        // switch back to main page
        switchWindowConfig = {
          ...switchWindowConfig,
          windowType: WINDOW_TYPE.MAIN_WINDOW,
        };
        tempFlowProfile = { ...tempFlowProfile, config: switchWindowConfig };
        const [, err] = await this.getExtensionPage(tempFlowProfile);
        if (err) {
          return [flowProfile, err];
        }
      }

      if (newFlowProfile) {
        flowProfile = newFlowProfile;
      }

      return [flowProfile, null];
    } catch (err: any) {
      logEveryWhere({
        message: `runNormalTask ${taskName}() error: ${err?.message}`,
      });
      return [flowProfile, err];
    }
  };

  getExtensionPage = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null, Page | null]> => {
    try {
      const { threadID, listVariable = [] } = flowProfile;
      const config = flowProfile?.config as ISwitchWindowNodeConfig;
      const thread = this.mapThread?.[threadID];
      const { simulator } = thread;
      let { listPage = [], currentPageIndex } = simulator;
      let page = listPage[currentPageIndex || 0];

      if (processSkipSetting(config, listVariable)) {
        return [flowProfile, null, page];
      }

      if (!thread || !thread.simulator) {
        return [flowProfile, Error("simulator is not running"), page];
      }
      const { browser } = thread?.simulator;
      if (!browser) {
        return [flowProfile, Error("browser is not running"), page];
      }

      if (config?.windowType === WINDOW_TYPE.MAIN_WINDOW) {
        listPage = await browser.pages();
        page = listPage[0];
        listPage = [page]; // clear other page
        this.mapThread[threadID].simulator.listPage = listPage;
        this.mapThread[threadID].simulator.currentPageIndex = 0;
        return [flowProfile, null, page];
      }

      let extensionPage = null;
      let extensionPageIndex = null;
      const startTime = new Date().getTime();
      const timeout = config?.timeout || DEFAULT_TIMEOUT;

      while (true) {
        const currentTime = new Date().getTime();
        if (currentTime - startTime > timeout) {
          break;
        }

        listPage = await browser?.pages();
        for (let i = 0; i < listPage.length; i++) {
          if (listPage?.[i]?.url()?.includes("chrome-extension://")) {
            extensionPage = listPage?.[i];
            extensionPageIndex = i;
            break;
          }
        }

        if (extensionPage !== null) {
          break;
        }

        await sleep(1000);
      }

      if (extensionPage === null) {
        return [flowProfile, Error("Can not find extension popup"), page];
      }

      this.mapThread[threadID].simulator.listPage.push(extensionPage);
      this.mapThread[threadID].simulator.currentPageIndex = extensionPageIndex;
      return [
        flowProfile,
        null,
        this.mapThread[threadID].simulator.listPage[extensionPageIndex || 0],
      ];
    } catch (err: any) {
      logEveryWhere({ message: `getExtensionPage() error: ${err?.message}` });
      return [flowProfile, null, null];
    }
  };

  stopContractSniper = async (campaignId: number, workflowId: number) => {
    this.evmContractSnipperManager.stop(campaignId, workflowId);
  };

  stopTelegramSniper = async (
    campaignId: number,
    workflowId: number,
  ): Promise<void> => {
    const [workflow] = await workflowDB.getOneWorkflow(workflowId);
    const scriptData: { nodes: any[]; edges: any[] } = JSON.parse(
      workflow?.data || JSON.stringify({ nodes: [], edges: [] }),
    );
    const { nodes } = scriptData;
    for (const node of nodes) {
      if (node?.data?.config?.workflowType === WORKFLOW_TYPE.SNIPE_TELEGRAM) {
        const nodeConfig = node?.data?.config as ISnipeTelegramNodeConfig;
        if (nodeConfig?.botToken && nodeConfig?.chatId) {
          await this.telegramSniperManager.stopTelegramSniper(
            campaignId,
            workflowId,
            nodeConfig.botToken,
            nodeConfig.chatId,
            nodeConfig.profileMode ||
              TELEGRAM_SNIPER_MODE.ONE_EVENT_ONE_PROFILE,
          );
        }
      }
    }
  };

  stopSolanaVanityAddress = (campaignId: number, workflowId: number) => {
    const solanaVanityAddress =
      this.solanaVanityAddressManager.getSolanaVanityAddress(
        campaignId,
        workflowId,
      );
    if (solanaVanityAddress) {
      solanaVanityAddress.stop();
    }
  };

  clearOldestEventFromContractSniper = async (
    campaignId: number,
    workflowId: number,
  ) => {
    const [workflow] = await workflowDB.getOneWorkflow(workflowId);
    const scriptData: { nodes: any[]; edges: any[] } = JSON.parse(
      workflow?.data || JSON.stringify({ nodes: [], edges: [] }),
    );
    const { nodes } = scriptData;
    for (const node of nodes) {
      if (
        node?.data?.config?.workflowType === WORKFLOW_TYPE.EVM_SNIPE_CONTRACT
      ) {
        const contractSniper = await this.getContractSniper(
          node?.data?.config as IEVMSnipeContractNodeConfig,
          false,
          campaignId,
          workflowId,
        );
        if (contractSniper) {
          await contractSniper.clearOldestEvent();
        }
      }
    }
  };

  clearOldestMessageFromTelegramSniper = async (
    campaignId: number,
    workflowId: number,
  ) => {
    const [workflow] = await workflowDB.getOneWorkflow(workflowId);
    const scriptData: { nodes: any[]; edges: any[] } = JSON.parse(
      workflow?.data || JSON.stringify({ nodes: [], edges: [] }),
    );
    const { nodes } = scriptData;
    for (const node of nodes) {
      if (node?.data?.config?.workflowType === WORKFLOW_TYPE.SNIPE_TELEGRAM) {
        const telegramSniper = await this.getTelegramSniper(
          campaignId,
          workflowId,
          node?.data?.config as ISnipeTelegramNodeConfig,
        );
        if (telegramSniper) {
          await telegramSniper.clearOldestMessage();
        }
      }
    }
  };

  getContractSniper = async (
    nodeConfig: IEVMSnipeContractNodeConfig,
    mustGetRunningSnipper: boolean,
    campaignId: number,
    workflowId: number,
  ): Promise<ContractSniper | null> => {
    if (!nodeConfig?.nodeEndpointGroupId) {
      return null;
    }
    const [listNodeEndpoint] =
      await nodeEndpointDB.getListNodeEndpointByGroupId(
        nodeConfig?.nodeEndpointGroupId!,
      );
    const listNodeProvider =
      listNodeEndpoint
        ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
        ?.filter((endpoint: string) => Boolean(endpoint)) || [];
    let input = nodeConfig?.input as ISnipeContractInput;

    const parsedContractAbi: any[] = JSON.parse(
      nodeConfig?.contractAbi || "[]",
    );
    const eventDetail = parsedContractAbi?.find(
      (item: any) =>
        item?.type === "event" && item?.name === nodeConfig?.eventName,
    );
    if (!eventDetail) {
      throw new Error("Event not found in contract ABI");
    }

    let eventAbi = eventDetail?.inputs
      .map((input: any) => {
        const indexedFlag = input?.indexed ? "indexed " : ""; // Add "indexed" if true
        return `${input.internalType} ${indexedFlag}${input.name}`;
      })
      .join(", ");
    eventAbi = `event ${eventDetail?.name}(${eventAbi})`;
    input = { ...input, eventAbi, listNodeEndpoint: listNodeProvider };

    const contractSniper =
      await this.evmContractSnipperManager.getContractSniper(
        input,
        mustGetRunningSnipper,
        campaignId,
        workflowId,
      );
    return contractSniper;
  };

  getTelegramSniper = async (
    campaignId: number = 0,
    workflowId: number = 0,
    nodeConfig: ISnipeTelegramNodeConfig,
  ): Promise<TelegramSniper | null> => {
    if (!nodeConfig?.botToken || !nodeConfig?.chatId) {
      return null;
    }

    const telegramSniper = await this.telegramSniperManager.getTelegramSniper(
      campaignId,
      workflowId,
      nodeConfig.botToken,
      nodeConfig.chatId,
      nodeConfig.profileMode || TELEGRAM_SNIPER_MODE.ONE_EVENT_ONE_PROFILE,
    );
    return telegramSniper;
  };
}
