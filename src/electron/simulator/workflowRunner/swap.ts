import { ethers } from "ethers";
import Big from "big.js";
import { SUI_TYPE_ARG } from "@mysten/sui/utils";
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
  buildAxiosProxy,
} from "@/electron/simulator/util";
import { ThreadManager } from "./threadManager";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { UniswapMultichain } from "@/electron/simulator/category/onchain/uniswap";
import { PancakeswapMultichain } from "@/electron/simulator/category/onchain/pancakeswap";
import {
  WORKFLOW_TYPE,
  WALLET_ACTIVITY_ACTION_TYPE,
  WALLET_ACTIVITY_SOURCE,
  WALLET_ACTIVITY_PROTOCOL,
  MAP_CHAIN_KEY_TO_NATIVE_SYMBOL,
  SOL_MINT_ADDRESS,
  getEvmChainKeyFromChainId,
} from "@/electron/constant";
import { ISwapOnEVM } from "@/electron/simulator/category/onchain/common";
import { SwapOnCetusManager } from "@/electron/simulator/category/onchain/cetus";
import { KyberswapManager } from "@/electron/simulator/category/onchain/kyberswap";
import type { ISwapTxData } from "@/electron/simulator/category/onchain/kyberswap/client";
import { SwapOnJupiterManager } from "@/electron/simulator/category/onchain/jupiter";
import { EVMProvider } from "@/electron/simulator/category/onchain/evm";
import { getSolanaProvider } from "@/electron/inject";
import { recordActivity } from "@/electron/service/walletActivity";
import { logEveryWhere } from "@/electron/service/util";
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
      let outputAmount: string | null = null;
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
        [txHash, err, outputAmount] = await swapOnDex.swapNormal(
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

      if (txHash && flowProfile.profile?.wallet?.address) {
        try {
          const chainKey = getEvmChainKeyFromChainId(swapInput.chainId);
          if (chainKey) {
            const evmProvider = new EVMProvider();
            const [[inputTokenContract], [outputTokenContract]] =
              await Promise.all([
                swapInput.isInputNativeToken
                  ? [null, null]
                  : evmProvider.getTokenContract(
                      listNodeProvider,
                      swapInput.inputTokenAddress,
                    ),
                swapInput.isOutputNativeToken
                  ? [null, null]
                  : evmProvider.getTokenContract(
                      listNodeProvider,
                      swapInput.outputTokenAddress,
                    ),
              ]);

            await recordActivity(
              {
                walletId: flowProfile.profile?.walletId,
                walletGroupId: flowProfile.profile?.walletGroupId,
                walletAddress: flowProfile.profile.wallet.address,
                chain: chainKey,
                txHash,
                actionType: WALLET_ACTIVITY_ACTION_TYPE.SWAP,
                protocol: config?.isUniswap
                  ? WALLET_ACTIVITY_PROTOCOL.UNISWAP
                  : WALLET_ACTIVITY_PROTOCOL.PANCAKESWAP,
                source: WALLET_ACTIVITY_SOURCE.WORKFLOW,
                token0Address: swapInput.inputTokenAddress,
                token0Symbol:
                  inputTokenContract?.symbol ||
                  (swapInput.isInputNativeToken
                    ? MAP_CHAIN_KEY_TO_NATIVE_SYMBOL[chainKey]
                    : undefined),
                token0Amount: amount,
                token1Address: swapInput.outputTokenAddress,
                token1Symbol:
                  outputTokenContract?.symbol ||
                  (swapInput.isOutputNativeToken
                    ? MAP_CHAIN_KEY_TO_NATIVE_SYMBOL[chainKey]
                    : undefined),
                token1Amount: outputAmount || undefined,
              },
              {
                isToken0Native: swapInput.isInputNativeToken,
                isToken1Native: swapInput.isOutputNativeToken,
              },
            );
          }
        } catch (error: any) {
          logEveryWhere({
            message: `recordActivity() error: ${error?.message}`,
          });
        }
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
      let swapTxData: ISwapTxData | null = null;
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

      const proxy = buildAxiosProxy(
        flowProfile.profile?.proxy,
        Boolean(flowProfile.campaignConfig?.isUseProxy),
      );
      const logInfo = {
        campaignId: flowProfile.campaignConfig?.campaignId || 0,
        workflowId: flowProfile.campaignConfig?.workflowId || 0,
      };
      if (Number(numberOfTrasaction) === 1) {
        [txHash, err, swapTxData] = await swapOnKyberswap.swapNormal(
          swapInput,
          privateKey,
          timeout,
          logInfo,
          proxy,
        );
      } else {
        err = await swapOnKyberswap.swapLikeBuyBot(
          swapInput,
          privateKey,
          Number(numberOfTrasaction),
          timeout,
          logInfo,
          proxy,
        );
      }
      if (err) {
        throw err;
      }

      if (txHash && flowProfile.profile?.wallet?.address) {
        try {
          const evmProvider = new EVMProvider();
          const [[inputTokenContract], [outputTokenContract]] =
            await Promise.all([
              swapInput.isInputNativeToken
                ? [null, null]
                : evmProvider.getTokenContract(
                    listNodeProvider,
                    swapInput.inputTokenAddress,
                  ),
              swapInput.isOutputNativeToken
                ? [null, null]
                : evmProvider.getTokenContract(
                    listNodeProvider,
                    swapInput.outputTokenAddress,
                  ),
            ]);
          const token1Amount = swapTxData?.amountOut
            ? new Big(swapTxData.amountOut)
                .div(new Big(10).pow(swapInput.outputTokenDecimal || 18))
                .toString()
            : undefined;

          await recordActivity(
            {
              walletId: flowProfile.profile?.walletId,
              walletGroupId: flowProfile.profile?.walletGroupId,
              walletAddress: flowProfile.profile.wallet.address,
              chain: swapInput.chainKey,
              txHash,
              actionType: WALLET_ACTIVITY_ACTION_TYPE.SWAP,
              protocol: WALLET_ACTIVITY_PROTOCOL.KYBERSWAP,
              source: WALLET_ACTIVITY_SOURCE.WORKFLOW,
              token0Address: swapInput.inputTokenAddress,
              token0Symbol:
                inputTokenContract?.symbol ||
                (swapInput.isInputNativeToken
                  ? MAP_CHAIN_KEY_TO_NATIVE_SYMBOL[swapInput.chainKey]
                  : undefined),
              token0Amount: amount,
              token0UsdValue: swapTxData?.amountInUsd || undefined,
              token1Address: swapInput.outputTokenAddress,
              token1Symbol:
                outputTokenContract?.symbol ||
                (swapInput.isOutputNativeToken
                  ? MAP_CHAIN_KEY_TO_NATIVE_SYMBOL[swapInput.chainKey]
                  : undefined),
              token1Amount,
              token1UsdValue: swapTxData?.amountOutUsd || undefined,
            },
            {
              isToken0Native: swapInput.isInputNativeToken,
              isToken1Native: swapInput.isOutputNativeToken,
            },
          );
        } catch (error: any) {
          logEveryWhere({
            message: `recordActivity() error: ${error?.message}`,
          });
        }
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
      let outAmountRaw: string | null = null;
      let swapInput: IJupiterSwapInput = config?.swapInput!;

      swapInput = {
        ...swapInput,
        amount,
      };

      const jupiterProxy = buildAxiosProxy(
        flowProfile.profile?.proxy,
        Boolean(flowProfile.campaignConfig?.isUseProxy),
      );
      const jupiterLogInfo = {
        campaignId: flowProfile.campaignConfig?.campaignId || 0,
        workflowId: flowProfile.campaignConfig?.workflowId || 0,
      };
      if (Number(numberOfTrasaction) === 1) {
        [txHash, err, outAmountRaw] = await swapOnJupiter.swapNormal(
          swapInput,
          privateKey,
          jupiterLogInfo,
          jupiterProxy,
        );
      } else {
        err = await swapOnJupiter.swapLikeBuyBot(
          swapInput,
          privateKey,
          Number(numberOfTrasaction),
          jupiterLogInfo,
          jupiterProxy,
        );
      }
      if (err) {
        throw err;
      }

      if (txHash && flowProfile.profile?.wallet?.address) {
        const solanaProvider = getSolanaProvider();
        const [connection] = solanaProvider.getNextProvider(listNodeProvider);
        if (connection) {
          const [tokenOutDecimals, token1Symbol, token0Symbol] =
            await Promise.all([
              solanaProvider.getTokenDecimal(
                swapInput.outputTokenAddress,
                connection,
              ),
              solanaProvider.getTokenSymbol(
                swapInput.outputTokenAddress,
                connection,
              ),
              solanaProvider.getTokenSymbol(
                swapInput.inputTokenAddress,
                connection,
              ),
            ]);
          const token1Amount = outAmountRaw
            ? new Big(outAmountRaw)
                .div(new Big(10).pow(tokenOutDecimals || 0))
                .toString()
            : undefined;

          await recordActivity(
            {
              walletId: flowProfile.profile?.walletId,
              walletGroupId: flowProfile.profile?.walletGroupId,
              walletAddress: flowProfile.profile.wallet.address,
              chain: "solana",
              txHash,
              actionType: WALLET_ACTIVITY_ACTION_TYPE.SWAP,
              protocol: WALLET_ACTIVITY_PROTOCOL.JUPITER,
              source: WALLET_ACTIVITY_SOURCE.WORKFLOW,
              token0Address: swapInput.inputTokenAddress,
              token0Symbol:
                token0Symbol ||
                (swapInput.inputTokenAddress === SOL_MINT_ADDRESS
                  ? "SOL"
                  : undefined),
              token0Amount: amount,
              token1Address: swapInput.outputTokenAddress,
              token1Symbol:
                token1Symbol ||
                (swapInput.outputTokenAddress === SOL_MINT_ADDRESS
                  ? "SOL"
                  : undefined),
              token1Amount,
            },
            {
              isToken0Native: swapInput.inputTokenAddress === SOL_MINT_ADDRESS,
              isToken1Native: swapInput.outputTokenAddress === SOL_MINT_ADDRESS,
            },
          );
        }
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
      let outputAmount: string | null = null;
      let swapInput: ICetusSwapInput = config?.swapInput!;
      let gasPrice = Number(gasPriceStr);
      if (gasPrice < 0) {
        gasPrice = 0;
      }
      swapInput = { ...swapInput, amount, gasPrice };

      if (Number(numberOfTrasaction) === 1) {
        [txHash, err, outputAmount] = await swapOnCetus.swapNormal(
          swapInput,
          privateKey,
          {
            campaignId: flowProfile.campaignConfig?.campaignId || 0,
            workflowId: flowProfile.campaignConfig?.workflowId || 0,
          },
        );
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

      if (txHash && flowProfile.profile?.wallet?.address) {
        await recordActivity(
          {
            walletId: flowProfile.profile?.walletId,
            walletGroupId: flowProfile.profile?.walletGroupId,
            walletAddress: flowProfile.profile.wallet.address,
            chain: "sui",
            txHash,
            actionType: WALLET_ACTIVITY_ACTION_TYPE.SWAP,
            protocol: WALLET_ACTIVITY_PROTOCOL.CETUS,
            source: WALLET_ACTIVITY_SOURCE.WORKFLOW,
            token0Address: swapInput.inputTokenAddress,
            token0Symbol:
              swapInput.inputTokenAddress === SUI_TYPE_ARG
                ? MAP_CHAIN_KEY_TO_NATIVE_SYMBOL.sui
                : undefined,
            token0Amount: amount,
            token1Address: swapInput.outputTokenAddress,
            token1Symbol:
              swapInput.outputTokenAddress === SUI_TYPE_ARG
                ? MAP_CHAIN_KEY_TO_NATIVE_SYMBOL.sui
                : undefined,
            token1Amount: outputAmount || undefined,
          },
          {
            isToken0Native: swapInput.inputTokenAddress === SUI_TYPE_ARG,
            isToken1Native: swapInput.outputTokenAddress === SUI_TYPE_ARG,
          },
        );
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
