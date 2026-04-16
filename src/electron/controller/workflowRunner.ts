import {
  getContractSniperManager,
  getMarketcapCheckingManager,
  getPriceCheckingManager,
} from "@/electron/inject";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import {
  ICheckTokenPriceNodeConfig,
  IEVMSnipeContractNodeConfig,
  INodeEndpoint,
  ISnipeContractInput,
} from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { workflowManager } from "@/electron/simulator/workflow";
import { executeCodeWithVariable } from "@/electron/simulator/util";
import { ICheckTokenPriceInput } from "@/electron/simulator/category/pricing/priceChecking";
import { ICheckMarketcapInput } from "@/electron/simulator/category/pricing/marketcapChecking";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import type {
  IpcTerminateThreadPayload,
  IpcStartWorkflowPayload,
  IpcStopWorkflowPayload,
  IpcSyncWorkflowPayload,
  IpcGetSampleContractSniperResultPayload,
  IpcGetPriceCheckingDataPayload,
  IpcGetMarketcapCheckingDataPayload,
  IpcRunJavascriptCodePayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const runWorkflowRunnerController = () => {
  onIpc<IpcTerminateThreadPayload>(
    MESSAGE.TERMINATE_THREAD,
    MESSAGE.TERMINATE_THREAD_RES,
    async (event, payload) => {
      const { threadID, requestId, campaignId, workflowId } = payload;
      const workflow = await workflowManager.getWorkflow(
        workflowId || 0,
        campaignId || 0,
        0,
      );
      await workflow.stopThread(threadID);

      event.reply(MESSAGE.TERMINATE_THREAD_RES, {
        isDone: true,
        requestId,
      });
    },
  );

  onIpc<IpcStartWorkflowPayload>(
    MESSAGE.START_WORKFLOW,
    MESSAGE.START_WORKFLOW_RES,
    async (event, payload) => {
      const {
        workflowId,
        campaignId = 0,
        encryptKey = "",
        overrideListVariable,
      } = payload;
      const workflow = await workflowManager.getWorkflow(
        workflowId || 0,
        campaignId,
        0,
      );

      if (workflow.monitor.isRunning) {
        event.reply(MESSAGE.START_WORKFLOW_RES, {
          code: RESPONSE_CODE.DUPLICATE_ERROR,
        });
        return;
      }
      if (campaignId) {
        const shouldWait =
          await workflowManager.shouldWaitBeforeRun(campaignId);
        if (shouldWait) {
          event.reply(MESSAGE.START_WORKFLOW_RES, {
            code: RESPONSE_CODE.OBJECT_EXISTED,
          });
          return;
        }
      }

      workflowManager.currentInstance.setCurrentIntance(
        workflowId || 0,
        campaignId,
        0,
      );
      workflow.runWorkflow(encryptKey, overrideListVariable).catch(() => {});

      event.reply(MESSAGE.START_WORKFLOW_RES, {
        code: RESPONSE_CODE.SUCCESS,
      });
    },
  );

  onIpc<IpcStopWorkflowPayload>(
    MESSAGE.STOP_WORKFLOW,
    MESSAGE.STOP_WORKFLOW_RES,
    async (event, payload) => {
      const { workflowId, campaignId = 0 } = payload;
      const workflow = await workflowManager.getWorkflow(
        workflowId || 0,
        campaignId,
        0,
      );
      await workflow.stopWorkflow();
      workflowManager.currentInstance.setCurrentIntance(0, 0, 0);
      workflowManager.clearWorkflow(workflowId || 0, campaignId, 0);

      event.reply(MESSAGE.STOP_WORKFLOW_RES, {});
    },
  );

  onIpc(
    MESSAGE.STOP_ALL_WORKFLOW,
    MESSAGE.STOP_ALL_WORKFLOW_RES,
    async (event, _payload) => {
      await workflowManager.stopAllWorkflow();
      event.reply(MESSAGE.STOP_ALL_WORKFLOW_RES, {});
    },
  );

  onIpc<IpcSyncWorkflowPayload>(
    MESSAGE.WORKFLOW_SYNC_DATA_TO_UI,
    MESSAGE.WORKFLOW_SYNC_DATA_TO_UI_RES,
    async (event, payload) => {
      const { workflowId, campaignId } = payload;
      const workflow = await workflowManager.getWorkflow(
        workflowId || 0,
        campaignId || 0,
        0,
      );
      const data = await workflow.syncDataToUI();
      event.reply(MESSAGE.WORKFLOW_SYNC_DATA_TO_UI_RES, { data });
    },
  );

  onIpc(
    MESSAGE.GET_LIST_RUNNING_WORKFLOW,
    MESSAGE.GET_LIST_RUNNING_WORKFLOW_RES,
    async (event, _payload) => {
      const data = workflowManager.getRunningWorkflow();
      event.reply(MESSAGE.GET_LIST_RUNNING_WORKFLOW_RES, {
        data,
      });
    },
  );

  onIpc<IpcGetSampleContractSniperResultPayload>(
    MESSAGE.GET_SAMPLE_CONTRACT_SNIPER_RESULT,
    MESSAGE.GET_SAMPLE_CONTRACT_SNIPER_RESULT_RES,
    async (event, payload) => {
      const {
        config,
        sampleSize = 100,
        campaignId = 0,
        workflowId = 0,
      } = payload;

      const [listNodeEndpoint] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(
          config?.nodeEndpointGroupId || 0,
        );
      const listNodeProvider =
        listNodeEndpoint
          ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
          ?.filter((endpoint: string) => Boolean(endpoint)) || [];

      const contractSniperManager = getContractSniperManager();
      let input: ISnipeContractInput = (config as IEVMSnipeContractNodeConfig)
        ?.input!;

      const parsedContractAbi: any[] = JSON.parse(config?.contractAbi || "[]");
      const eventDetail = parsedContractAbi?.find(
        (item: any) =>
          item?.type === "event" && item?.name === config?.eventName,
      );
      if (!eventDetail) {
        event.reply(MESSAGE.GET_SAMPLE_CONTRACT_SNIPER_RESULT_RES, {
          data: [],
          totalData: 0,
        });
      }

      let eventABI = eventDetail?.inputs
        .map((input: any) => {
          const indexedFlag = input?.indexed ? "indexed " : ""; // Add "indexed" if true
          return `${input.internalType} ${indexedFlag}${input.name}`;
        })
        .join(", ");
      eventABI = `event ${eventDetail?.name}(${eventABI})`;
      input = {
        ...input,
        eventAbi: eventABI,
        listNodeEndpoint: listNodeProvider,
      };

      const contractSniper = await contractSniperManager.getContractSniper(
        input,
        false,
        campaignId,
        workflowId,
      );
      if (!contractSniper) {
        event.reply(MESSAGE.GET_SAMPLE_CONTRACT_SNIPER_RESULT_RES, {
          data: [],
          totalData: 0,
        });
      }
      const [results, totalData] =
        contractSniper?.getSampleResult(sampleSize) || [];

      event.reply(MESSAGE.GET_SAMPLE_CONTRACT_SNIPER_RESULT_RES, {
        data: results,
        totalData,
      });
    },
  );

  onIpc<IpcGetPriceCheckingDataPayload>(
    MESSAGE.GET_PRICE_CHECKING_DATA,
    MESSAGE.GET_PRICE_CHECKING_DATA_RES,
    async (event, payload) => {
      let { config } = payload;
      config = config as ICheckTokenPriceNodeConfig;

      const priceCheckingManager = getPriceCheckingManager();
      const input: ICheckTokenPriceInput = {
        dataSource: config?.dataSource || "",
        tokenAddress: config?.tokenAddress || "",
        coingeckoId: config?.coingeckoId || "",
        chainId: config?.chainId || 0,
        apiTimeout: config?.timeout || 0,
        poolInterval: config.poolInterval || 0,
        timeFrame: config?.timeFrame || 0,
      };

      const priceChecking = priceCheckingManager.getPriceChecking(input, 0);
      const allData = priceChecking.getAllData();

      event.reply(MESSAGE.GET_PRICE_CHECKING_DATA_RES, {
        data: allData,
      });
    },
  );

  onIpc<IpcGetMarketcapCheckingDataPayload>(
    MESSAGE.GET_MARKETCAP_CHECKING_DATA,
    MESSAGE.GET_MARKETCAP_CHECKING_DATA_RES,
    async (event, payload) => {
      let { config } = payload;
      config = config as ICheckTokenPriceNodeConfig;

      const marketcapCheckingManager = getMarketcapCheckingManager();
      const input: ICheckMarketcapInput = {
        dataSource: config?.dataSource || "",
        tokenAddress: config?.tokenAddress || "",
        coingeckoId: config?.coingeckoId || "",
        chainId: config?.chainId || 0,
        apiTimeout: config?.timeout || 0,
        poolInterval: config.poolInterval || 0,
        timeFrame: config?.timeFrame || 0,
      };

      const marketcapChecking = marketcapCheckingManager.getMarketcapChecking(
        input,
        0,
      );
      const allData = marketcapChecking.getAllData();

      event.reply(MESSAGE.GET_MARKETCAP_CHECKING_DATA_RES, {
        data: allData,
      });
    },
  );

  onIpc<IpcRunJavascriptCodePayload>(
    MESSAGE.RUN_JAVASCRIPT_CODE,
    MESSAGE.RUN_JAVASCRIPT_CODE_RES,
    async (event, payload) => {
      try {
        const { code, listVariable = [] } = payload;
        const result = await executeCodeWithVariable(code, listVariable);
        event.reply(MESSAGE.RUN_JAVASCRIPT_CODE_RES, {
          data: result,
        });
      } catch (error: any) {
        logEveryWhere({
          campaignId: 0,
          workflowId: 0,
          message: `Error while executing code: ${error?.message}`,
        });
        event.reply(MESSAGE.RUN_JAVASCRIPT_CODE_RES, {
          data: null,
          error: error?.message,
        });
      }
    },
  );
};
