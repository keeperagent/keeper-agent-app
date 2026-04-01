import { ethers } from "ethers";
import { Page } from "playwright-core";
import {
  ICetusSwapInput,
  IFlowProfile,
  IJupiterSwapInput,
  INodeEndpoint,
  IWorkflowVariable,
  ISwapCetusNodeConfig,
  ISwapEVMInput,
  ISwapJupiterNodeConfig,
  ISwapKyberswapInput,
  ISwapKyberswapNodeConfig,
  ISwapUniswapNodeConfig,
} from "@/electron/type";
import {
  updateVariable,
  processSkipSetting,
  getActualValue,
} from "@/electron/simulator/util";
import { ThreadManager } from "./threadManager";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { UniswapMultichain } from "@/electron/simulator/category/onchain/uniswap";
import { PancakeswapMultichain } from "@/electron/simulator/category/onchain/pancakeswap";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { ISwapOnEVM } from "@/electron/simulator/category/onchain/common";
import { SwapOnCetusManager } from "@/electron/simulator/category/onchain/cetus";
import { KyberswapManager } from "@/electron/simulator/category/onchain/kyberswap";
import { SwapOnJupiterManager } from "@/electron/simulator/category/onchain/jupiter";
import { WorkflowRunnerArgs, NodeHandler } from "./index";

export class SwapWorkflow {
  threadManager: ThreadManager;

  private uniswapMultichain: UniswapMultichain;
  private pancakeswapMultichain: PancakeswapMultichain;
  private kyberswapManager: KyberswapManager;
  private jupiterManager: SwapOnJupiterManager;
  private cetusManager: SwapOnCetusManager;

  constructor({
    threadManager,
    uniswapMultichain,
    pancakeswapMultichain,
    kyberswapManager,
    jupiterManager,
    cetusManager,
  }: WorkflowRunnerArgs) {
    this.threadManager = threadManager;
    this.uniswapMultichain = uniswapMultichain;
    this.pancakeswapMultichain = pancakeswapMultichain;
    this.kyberswapManager = kyberswapManager;
    this.jupiterManager = jupiterManager;
    this.cetusManager = cetusManager;
  }

  swapUniswap = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ISwapUniswapNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { nodeEndpointGroupId } = config;
      if (!nodeEndpointGroupId) {
        throw Error("Node Provider is missing");
      }

      const [listNodeEndpoint] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(nodeEndpointGroupId);
      const listNodeProvider =
        listNodeEndpoint
          ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
          ?.filter((endpoint: string) => Boolean(endpoint)) || [];

      const privateKey = getActualValue(config?.privateKey || "", listVariable);
      const gasPrice = getActualValue(
        config?.swapInput?.gasPrice?.toString() || "",
        listVariable,
      );
      const gasLimit = getActualValue(
        config?.swapInput?.gasLimit?.toString() || "",
        listVariable,
      );
      const numberOfTrasaction = getActualValue(
        config?.numberOfTrasaction?.toString() || "",
        listVariable,
      );
      const amount = getActualValue(
        config?.swapInput?.amount || "0",
        listVariable,
      );
      if (
        isNaN(Number(numberOfTrasaction)) ||
        Number(numberOfTrasaction) <= 0
      ) {
        throw Error("Total transaction must > 0");
      }

      let swapOnDex: ISwapOnEVM | null = null;
      if (config?.isUniswap) {
        swapOnDex = await this.uniswapMultichain.getUniswap(
          config?.swapInput?.chainId!,
          listNodeProvider,
        );
      } else if (config?.isPancakeSwap) {
        swapOnDex = await this.pancakeswapMultichain.getPancakeswap(
          config?.swapInput?.chainId!,
          listNodeProvider,
        );
      }
      if (swapOnDex === null) {
        throw Error("can not find DEX");
      }

      let txHash = null;
      let err = null;
      const timeout =
        ((flowProfile?.config as ISwapUniswapNodeConfig)?.timeout || 0) * 1000;
      let swapInput: ISwapEVMInput = config?.swapInput!;
      swapInput = { ...swapInput, amount };
      swapInput = {
        ...swapInput,
        gasPrice: ethers.utils.parseUnits(gasPrice || "0", "gwei"),
        gasLimit: ethers.BigNumber.from(gasLimit || "0"),
      };

      if (Number(numberOfTrasaction) === 1) {
        [txHash, err] = await swapOnDex.swapNormal(
          swapInput,
          privateKey,
          timeout,
          {
            campaignId: flowProfile.campaignConfig?.campaignId || 0,
            workflowId: flowProfile.campaignConfig?.workflowId || 0,
          },
        );
      } else {
        err = await swapOnDex.swapLikeBuyBot(
          swapInput,
          privateKey,
          Number(numberOfTrasaction),
          timeout,
          {
            campaignId: flowProfile.campaignConfig?.campaignId || 0,
            workflowId: flowProfile.campaignConfig?.workflowId || 0,
          },
        );
      }
      if (err) {
        throw err;
      }

      const newListVariable = updateVariable(listVariable, {
        variable: config?.variable || "",
        value: txHash,
      });
      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ISwapUniswapNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as ISwapUniswapNodeConfig)?.timeout || 0) * 1000,
      taskName: "swapUniswap",
      withoutBrowser: true,
    });
  };

  swapKyberswap = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ISwapKyberswapNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { nodeEndpointGroupId } = config;
      if (!nodeEndpointGroupId) {
        throw Error("Node Provider is missing");
      }

      const [listNodeEndpoint] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(nodeEndpointGroupId);
      const listNodeProvider =
        listNodeEndpoint
          ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
          ?.filter((endpoint: string) => Boolean(endpoint)) || [];

      const privateKey = getActualValue(config?.privateKey || "", listVariable);
      const gasPrice = getActualValue(
        config?.swapInput?.gasPrice?.toString() || "",
        listVariable,
      );
      const gasLimit = getActualValue(
        config?.swapInput?.gasLimit?.toString() || "",
        listVariable,
      );
      const numberOfTrasaction = getActualValue(
        config?.numberOfTrasaction?.toString() || "",
        listVariable,
      );
      const amount = getActualValue(
        config?.swapInput?.amount || "0",
        listVariable,
      );
      if (
        isNaN(Number(numberOfTrasaction)) ||
        Number(numberOfTrasaction) <= 0
      ) {
        throw Error("Total transaction must > 0");
      }

      const swapOnKyberswap =
        await this.kyberswapManager.getKyberswap(listNodeProvider);

      let txHash = null;
      let err = null;
      const timeout =
        ((flowProfile?.config as ISwapKyberswapNodeConfig)?.timeout || 0) *
        1000;
      let swapInput: ISwapKyberswapInput = config?.swapInput!;
      swapInput = { ...swapInput, amount };
      swapInput = {
        ...swapInput,
        gasPrice: ethers.utils.parseUnits(gasPrice || "0", "gwei"),
        gasLimit: ethers.BigNumber.from(gasLimit || "0"),
      };

      if (Number(numberOfTrasaction) === 1) {
        [txHash, err] = await swapOnKyberswap.swapNormal(
          swapInput,
          privateKey,
          timeout,
          {
            campaignId: flowProfile.campaignConfig?.campaignId || 0,
            workflowId: flowProfile.campaignConfig?.workflowId || 0,
          },
        );
      } else {
        err = await swapOnKyberswap.swapLikeBuyBot(
          swapInput,
          privateKey,
          Number(numberOfTrasaction),
          timeout,
          {
            campaignId: flowProfile.campaignConfig?.campaignId || 0,
            workflowId: flowProfile.campaignConfig?.workflowId || 0,
          },
        );
      }
      if (err) {
        throw err;
      }

      const newListVariable = updateVariable(listVariable, {
        variable: config?.variable || "",
        value: txHash,
      });
      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ISwapKyberswapNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as ISwapKyberswapNodeConfig)?.timeout || 0) *
        1000,
      taskName: "swapKyberswap",
      withoutBrowser: true,
    });
  };

  swapJupiter = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ISwapJupiterNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { nodeEndpointGroupId } = config;
      if (!nodeEndpointGroupId) {
        throw Error("Node Provider is missing");
      }

      const [listNodeEndpoint] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(nodeEndpointGroupId);
      const listNodeProvider =
        listNodeEndpoint
          ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
          ?.filter((endpoint: string) => Boolean(endpoint)) || [];

      const privateKey = getActualValue(config?.privateKey || "", listVariable);
      const numberOfTrasaction = getActualValue(
        config?.numberOfTrasaction?.toString() || "",
        listVariable,
      );
      const amount = getActualValue(
        config?.swapInput?.amount || "0",
        listVariable,
      );
      if (
        isNaN(Number(numberOfTrasaction)) ||
        Number(numberOfTrasaction) <= 0
      ) {
        throw Error("Total transaction must > 0");
      }

      const swapOnJupiter =
        await this.jupiterManager.getSwapOnJupiter(listNodeProvider);

      let txHash = null;
      let err = null;
      let swapInput: IJupiterSwapInput = config?.swapInput!;

      swapInput = {
        ...swapInput,
        amount,
      };

      if (Number(numberOfTrasaction) === 1) {
        [txHash, err] = await swapOnJupiter.swapNormal(swapInput, privateKey, {
          campaignId: flowProfile.campaignConfig?.campaignId || 0,
          workflowId: flowProfile.campaignConfig?.workflowId || 0,
        });
      } else {
        err = await swapOnJupiter.swapLikeBuyBot(
          swapInput,
          privateKey,
          Number(numberOfTrasaction),
          {
            campaignId: flowProfile.campaignConfig?.campaignId || 0,
            workflowId: flowProfile.campaignConfig?.workflowId || 0,
          },
        );
      }
      if (err) {
        throw err;
      }

      const newListVariable = updateVariable(listVariable, {
        variable: config?.variable || "",
        value: txHash,
      });
      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ISwapJupiterNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as ISwapJupiterNodeConfig)?.timeout || 0) * 1000,
      taskName: "swapJupiter",
      withoutBrowser: true,
    });
  };

  swapCetus = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ISwapCetusNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { nodeEndpointGroupId } = config;
      if (!nodeEndpointGroupId) {
        throw Error("Node Provider is missing");
      }

      const [listNodeEndpoint] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(nodeEndpointGroupId);
      const listNodeProvider =
        listNodeEndpoint
          ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
          ?.filter((endpoint: string) => Boolean(endpoint)) || [];

      const privateKey = getActualValue(config?.privateKey || "", listVariable);
      const numberOfTrasaction = getActualValue(
        config?.numberOfTrasaction?.toString() || "",
        listVariable,
      );
      const amount = getActualValue(
        config?.swapInput?.amount || "0",
        listVariable,
      );
      const gasPriceStr = getActualValue(
        config?.swapInput?.gasPrice?.toString() || "0",
        listVariable,
      );
      if (
        isNaN(Number(numberOfTrasaction)) ||
        Number(numberOfTrasaction) <= 0
      ) {
        throw Error("Total transaction must > 0");
      }

      const swapOnCetus =
        await this.cetusManager.getSwapOnCetus(listNodeProvider);

      let txHash = null;
      let err = null;
      let swapInput: ICetusSwapInput = config?.swapInput!;
      let gasPrice = Number(gasPriceStr);
      if (gasPrice < 0) {
        gasPrice = 0;
      }
      swapInput = { ...swapInput, amount, gasPrice };

      if (Number(numberOfTrasaction) === 1) {
        [txHash, err] = await swapOnCetus.swapNormal(swapInput, privateKey, {
          campaignId: flowProfile.campaignConfig?.campaignId || 0,
          workflowId: flowProfile.campaignConfig?.workflowId || 0,
        });
      } else {
        const promise = swapOnCetus.swapLikeBuyBot(
          swapInput,
          privateKey,
          Number(numberOfTrasaction),
          {
            campaignId: flowProfile.campaignConfig?.campaignId || 0,
            workflowId: flowProfile.campaignConfig?.workflowId || 0,
          },
        );
        if (config?.swapInput?.shouldWaitTransactionComfirmed) {
          err = await promise;
        }
      }
      if (err) {
        throw err;
      }

      const newListVariable = updateVariable(listVariable, {
        variable: config?.variable || "",
        value: txHash,
      });
      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ISwapCetusNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as ISwapCetusNodeConfig)?.timeout || 0) * 1000,
      taskName: "swapCetus",
      withoutBrowser: true,
    });
  };
}

export const registerSwapHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const s = new SwapWorkflow(args);
  handlers.set(WORKFLOW_TYPE.SWAP_UNISWAP, s.swapUniswap);
  handlers.set(WORKFLOW_TYPE.SWAP_PANCAKESWAP, s.swapUniswap);
  handlers.set(WORKFLOW_TYPE.SWAP_KYBERSWAP, s.swapKyberswap);
  handlers.set(WORKFLOW_TYPE.SWAP_JUPITER, s.swapJupiter);
  handlers.set(WORKFLOW_TYPE.SWAP_CETUS, s.swapCetus);
};
