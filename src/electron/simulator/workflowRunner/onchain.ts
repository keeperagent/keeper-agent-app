import _ from "lodash";
import { Page } from "playwright-core";
import {
  IApproveRevokeEVMNodeConfig,
  ICheckMarketcapNodeConfig,
  ICheckTokenPriceNodeConfig,
  IConvertTokenAmountNodeConfig,
  IEVMReadFromContractNodeConfig,
  IEVMSnipeContractNodeConfig,
  IEVMWriteContractNodeConfig,
  IExecuteTransactionNodeConfig,
  IFlowProfile,
  IGenerateVanityAddressNodeConfig,
  IGetGasPriceNodeConfig,
  IGetPriorityFeeNodeConfig,
  IGetTokenPriceNodeConfig,
  IGetWalletBalanceNodeConfig,
  INodeEndpoint,
  IWorkflowVariable,
  ISelectChainNodeConfig,
  ISelectTokenNodeConfig,
  ISnipeContractResult,
  ITransactionConfigEVM,
  ITransferTokenNodeConfig,
} from "@/electron/type";
import {
  updateVariable,
  processSkipSetting,
  getActualValue,
  sleep,
} from "@/electron/simulator/util";
import { ThreadManager } from "./threadManager";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { EVMProvider } from "@/electron/simulator/category/onchain/evm";
import { AptosProvider } from "@/electron/simulator/category/onchain/aptos";
import { SuiProvider } from "@/electron/simulator/category/onchain/sui";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import {
  BOOLEAN_RESULT,
  CHAIN_TYPE,
  CURRENT_TOKEN_MARKETCAP,
  CURRENT_TOKEN_PRICE,
  WORKFLOW_TYPE,
  SELECT_CHAIN_OUTPUT,
  SELECT_TOKEN_OUTPUT,
} from "@/electron/constant";
import { Pricing } from "@/electron/simulator/category/pricing";
import { logEveryWhere } from "@/electron/service/util";
import {
  ICheckTokenPriceCondition,
  ICheckTokenPriceInput,
  PriceCheckingManager,
} from "@/electron/simulator/category/pricing/priceChecking";
import {
  getPriceCheckingManager,
  getMarketcapCheckingManager,
  getSolanaVanityAddressManager,
} from "@/electron/inject";
import {
  ICheckMarketcapCondition,
  ICheckMarketcapInput,
  MarketcapCheckingManager,
} from "@/electron/simulator/category/pricing/marketcapChecking";
import { EvmTransactionExecutor } from "@/electron/simulator/category/onchain/evmExecuteTransaction";
import { SolanaTransactionExecutor } from "@/electron/simulator/category/onchain/solanaExecuteTransaction";
import { SolanaVanityAddressManager } from "@/electron/simulator/category/onchain/vanityAddress/solanaVanityAddress";
import { WorkflowRunnerArgs, NodeHandler } from "./index";

export class OnChainWorkflow {
  threadManager: ThreadManager;
  private evmProvider: EVMProvider;
  private aptosProvider: AptosProvider;
  private suiProvider: SuiProvider;
  private solanaProvider: SolanaProvider;
  private evmTransactionExecutor: EvmTransactionExecutor;
  private solanaTransactionExecutor: SolanaTransactionExecutor;
  private pricing: Pricing;
  private priceCheckingManager: PriceCheckingManager;
  private marketcapCheckingManager: MarketcapCheckingManager;
  private solanaVanityAddressManager: SolanaVanityAddressManager;

  constructor({
    threadManager,
    evmProvider,
    aptosProvider,
    suiProvider,
    solanaProvider,
  }: WorkflowRunnerArgs) {
    this.threadManager = threadManager;
    this.evmProvider = evmProvider;
    this.aptosProvider = aptosProvider;
    this.suiProvider = suiProvider;
    this.solanaProvider = solanaProvider;
    this.pricing = new Pricing(5000);
    this.priceCheckingManager = getPriceCheckingManager();
    this.marketcapCheckingManager = getMarketcapCheckingManager();
    this.evmTransactionExecutor = new EvmTransactionExecutor();
    this.solanaTransactionExecutor = new SolanaTransactionExecutor(
      solanaProvider,
    );
    this.solanaVanityAddressManager = getSolanaVanityAddressManager();
  }

  getWalletBalance = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IGetWalletBalanceNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { nodeEndpointGroupId, tokenType = "" } = config;
      if (!nodeEndpointGroupId) {
        throw Error("Node Provider is missing");
      }

      const [listNodeEndpoint] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(nodeEndpointGroupId);
      const listNodeProvider =
        listNodeEndpoint
          ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
          ?.filter((endpoint: string) => Boolean(endpoint)) || [];

      const tokenAddress = getActualValue(
        config?.tokenAddress || "",
        listVariable,
      );
      const walletAddress = getActualValue(
        config?.walletAddress || "",
        listVariable,
      );

      const timeout =
        ((flowProfile?.config as IGetWalletBalanceNodeConfig)?.timeout || 0) *
        1000;

      let balanceProvider:
        | EVMProvider
        | SolanaProvider
        | AptosProvider
        | SuiProvider
        | null = null;

      if (config?.chainType === CHAIN_TYPE.EVM) {
        balanceProvider = this.evmProvider;
      } else if (config?.chainType === CHAIN_TYPE.SOLANA) {
        balanceProvider = this.solanaProvider;
      } else if (config?.chainType === CHAIN_TYPE.APTOS) {
        balanceProvider = this.aptosProvider;
      } else if (config?.chainType === CHAIN_TYPE.SUI) {
        balanceProvider = this.suiProvider;
      }
      if (balanceProvider === null) {
        throw Error("can not find provider");
      }

      const [balance, err] = await balanceProvider.getWalletBalance(
        listNodeProvider,
        tokenType,
        walletAddress,
        tokenAddress,
        timeout,
      );

      if (err) {
        throw err;
      }
      if (balance === null) {
        throw Error("can not get balance");
      }
      const newListVariable = updateVariable(listVariable, {
        variable: config?.variable || "",
        value: balance,
      });
      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<IGetWalletBalanceNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as IGetWalletBalanceNodeConfig)?.timeout || 0) *
        1000,
      taskName: "getWalletBalance",
      withoutBrowser: true,
    });
  };

  convertTokenAmount = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IConvertTokenAmountNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { nodeEndpointGroupId, tokenType = "" } = config;
      if (!nodeEndpointGroupId) {
        throw Error("Node Provider is missing");
      }

      const [listNodeEndpoint] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(nodeEndpointGroupId);
      const listNodeProvider =
        listNodeEndpoint
          ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
          ?.filter((endpoint: string) => Boolean(endpoint)) || [];

      const tokenAddress = getActualValue(
        config?.tokenAddress || "",
        listVariable,
      );
      const rawAmount = getActualValue(config?.rawAmount || "", listVariable);

      let convertAmountProvider:
        | EVMProvider
        | SolanaProvider
        | AptosProvider
        | SuiProvider
        | null = null;
      if (config?.chainType === CHAIN_TYPE.EVM) {
        convertAmountProvider = this.evmProvider;
      } else if (config?.chainType === CHAIN_TYPE.SOLANA) {
        convertAmountProvider = this.solanaProvider;
      } else if (config?.chainType === CHAIN_TYPE.APTOS) {
        convertAmountProvider = this.aptosProvider;
      } else if (config?.chainType === CHAIN_TYPE.SUI) {
        convertAmountProvider = this.suiProvider;
      }
      if (convertAmountProvider === null) {
        throw Error("can not find provider");
      }

      const [tokenAmount, err] = await convertAmountProvider.convertTokenAmount(
        listNodeProvider,
        tokenType,
        tokenAddress,
        rawAmount,
      );
      if (err) {
        throw err;
      }

      if (tokenAmount === null) {
        throw Error("can not convert token amount");
      }

      const newListVariable = updateVariable(listVariable, {
        variable: config?.variable || "",
        value: tokenAmount,
      });
      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<IConvertTokenAmountNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as IConvertTokenAmountNodeConfig)?.timeout || 0) *
        1000,
      taskName: "convertTokenAmount",
      withoutBrowser: true,
    });
  };

  selectToken = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ISelectTokenNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { nodeEndpointGroupId } = config;
      if (typeof nodeEndpointGroupId !== "number") {
        throw Error("Node Provider is missing");
      }

      const [listNodeEndpoint, err] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(nodeEndpointGroupId);
      if (err) {
        throw err;
      }
      const listNodeProvider =
        listNodeEndpoint
          ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
          ?.filter((endpoint: string) => Boolean(endpoint)) || [];

      const walletAddress = getActualValue(
        config?.walletAddress || "",
        listVariable,
      );
      const [tokenOption, err1] = await this.evmProvider.selectToken(
        walletAddress,
        config?.listOption || [],
        listNodeProvider,
        ((flowProfile?.config as ISelectTokenNodeConfig)?.timeout || 0) * 1000,
      );
      if (err1 !== null) {
        throw err1;
      }

      let newListVariable = updateVariable(listVariable, {
        variable: SELECT_TOKEN_OUTPUT.SELECTED_TOKEN_NAME,
        value: tokenOption?.tokenName || "",
      });
      newListVariable = updateVariable(newListVariable, {
        variable: SELECT_TOKEN_OUTPUT?.SELECTED_TOKEN_ADDRESS,
        value: tokenOption?.tokenAddress || "",
      });

      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ISelectTokenNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as ISelectTokenNodeConfig)?.timeout || 0) * 1000,
      taskName: "selectToken",
      withoutBrowser: true,
    });
  };

  selectChain = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ISelectChainNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const mapListNodeProvider = new Map<number, string[]>();
      const listChainOption = config?.listOption || [];

      for (let i = 0; i < listChainOption?.length; i++) {
        const option = listChainOption[i];
        const { nodeEndpointGroupId } = option;
        if (!nodeEndpointGroupId) {
          throw Error("Node Provider is missing");
        }

        if (mapListNodeProvider.get(nodeEndpointGroupId)) {
          continue;
        }

        const [listNodeEndpoint, err] =
          await nodeEndpointDB.getListNodeEndpointByGroupId(
            nodeEndpointGroupId,
          );
        if (err) {
          throw err;
        }
        const listNodeProvider =
          listNodeEndpoint
            ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
            ?.filter((endpoint: string) => Boolean(endpoint)) || [];
        mapListNodeProvider.set(
          Number(option?.nodeEndpointGroupId),
          listNodeProvider,
        );
      }

      const walletAddress = getActualValue(
        config?.walletAddress || "",
        listVariable,
      );

      const [chainOption, err1] = await this.evmProvider.selectChain(
        walletAddress,
        listChainOption,
        mapListNodeProvider,
        ((flowProfile?.config as ISelectChainNodeConfig)?.timeout || 0) * 1000,
      );
      if (err1 !== null) {
        throw err1;
      }

      let newListVariable = updateVariable(listVariable, {
        variable: SELECT_CHAIN_OUTPUT.SELECTED_CHAIN_NAME,
        value: chainOption?.chainName || "",
      });
      newListVariable = updateVariable(newListVariable, {
        variable: SELECT_CHAIN_OUTPUT.SELECTED_CHAIN_TOKEN_ADDRESS,
        value: chainOption?.tokenAddress || "",
      });
      newListVariable = updateVariable(newListVariable, {
        variable: SELECT_CHAIN_OUTPUT.SELECTED_CHAIN_TOKEN_NAME,
        value: chainOption?.tokenName || "",
      });

      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ISelectChainNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as ISelectChainNodeConfig)?.timeout || 0) * 1000,
      taskName: "selectChain",
      withoutBrowser: true,
    });
  };

  getGasPrice = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IGetGasPriceNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { nodeEndpointGroupId } = config;
      if (!nodeEndpointGroupId) {
        throw Error("Node Provider is missing");
      }

      const [listNodeEndpoint, err] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(nodeEndpointGroupId);
      if (err) {
        throw err;
      }
      const listNodeProvider =
        listNodeEndpoint
          ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
          ?.filter((endpoint: string) => Boolean(endpoint)) || [];

      let gasProvider: EVMProvider | AptosProvider | SuiProvider | null = null;
      if (config?.chainType === CHAIN_TYPE.EVM) {
        gasProvider = this.evmProvider;
      } else if (config?.chainType === CHAIN_TYPE.APTOS) {
        gasProvider = this.aptosProvider;
      } else if (config?.chainType === CHAIN_TYPE.SUI) {
        gasProvider = this.suiProvider;
      }
      if (gasProvider === null) {
        throw Error("can not find provider");
      }

      const [gasPrice, err1] = await gasProvider.getGasPrice(
        listNodeProvider,
        ((flowProfile?.config as IGetGasPriceNodeConfig)?.timeout || 0) * 1000,
      );
      if (err1 !== null) {
        throw err1;
      }

      const newListVariable = updateVariable(listVariable, {
        variable: config?.variable || "",
        value: gasPrice,
      });

      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<IGetGasPriceNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as IGetGasPriceNodeConfig)?.timeout || 0) * 1000,
      taskName: "getGasPrice",
      withoutBrowser: true,
    });
  };

  getPriorityFee = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IGetPriorityFeeNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { nodeEndpointGroupId } = config;
      if (!nodeEndpointGroupId) {
        throw Error("Node Provider is missing");
      }

      const [listNodeEndpoint, err] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(nodeEndpointGroupId);
      if (err) {
        throw err;
      }
      const listNodeProvider =
        listNodeEndpoint
          ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
          ?.filter((endpoint: string) => Boolean(endpoint)) || [];

      const listAccount = config?.accounts
        ?.split(",")
        ?.map((account) => account?.trim())
        ?.filter((account) => Boolean(account));
      const [priorityFee, err1] = await this.solanaProvider.getPriorityFee(
        listNodeProvider,
        listAccount || [],
      );
      if (err1 !== null) {
        throw err1;
      }

      const newListVariable = updateVariable(listVariable, {
        variable: config?.variable || "",
        value: priorityFee,
      });

      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<IGetPriorityFeeNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as IGetPriorityFeeNodeConfig)?.timeout || 0) *
        1000,
      taskName: "getPriorityFee",
      withoutBrowser: true,
    });
  };

  generateVanityAddress = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IGenerateVanityAddressNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const solanaVanityAddress =
        this.solanaVanityAddressManager.getSolanaVanityAddress(
          flowProfile.campaignConfig?.campaignId || 0,
          flowProfile.campaignConfig?.workflowId || 0,
        );
      const [address, privateKey, err] =
        await solanaVanityAddress.generateVanityAddress(
          config?.prefix || "",
          config?.suffix || "",
          ((flowProfile?.config as IGenerateVanityAddressNodeConfig)?.timeout ||
            0) * 1000,
        );
      if (err) {
        throw err;
      }

      let newListVariable = updateVariable(listVariable, {
        variable: config?.variableToSaveAddress || "",
        value: address,
      });
      newListVariable = updateVariable(newListVariable, {
        variable: config?.variableToSavePrivateKey || "",
        value: privateKey,
      });

      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<IGenerateVanityAddressNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as IGenerateVanityAddressNodeConfig)?.timeout ||
          0) * 1000,
      taskName: "generateVanityAddress",
      withoutBrowser: true,
    });
  };

  transferToken = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ITransferTokenNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { nodeEndpointGroupId, tokenType = "" } = config;
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
      const toAddress = getActualValue(config?.toAddress || "", listVariable);
      const tokenAddress = getActualValue(
        config?.tokenAddress || "",
        listVariable,
      );
      const amount = getActualValue(config?.amount || "", listVariable);
      const gasPrice = getActualValue(config?.gasPrice || "", listVariable);
      const gasLimit = getActualValue(config?.gasLimit || "", listVariable);

      let transferProvider:
        | EVMProvider
        | SolanaProvider
        | AptosProvider
        | SuiProvider
        | null = null;
      if (config?.chainType === CHAIN_TYPE.EVM) {
        transferProvider = this.evmProvider;
      } else if (config?.chainType === CHAIN_TYPE.SOLANA) {
        transferProvider = this.solanaProvider;
      } else if (config?.chainType === CHAIN_TYPE.APTOS) {
        transferProvider = this.aptosProvider;
      } else if (config?.chainType === CHAIN_TYPE.SUI) {
        transferProvider = this.suiProvider;
      }
      if (transferProvider === null) {
        throw Error("can not find provider");
      }

      const timeout =
        ((flowProfile?.config as ITransferTokenNodeConfig)?.timeout || 0) *
        1000;
      const [txHash, walletAddress, error] =
        await transferProvider?.transferToken(
          privateKey,
          toAddress,
          tokenType,
          tokenAddress,
          amount,
          listNodeProvider,
          timeout,
          gasPrice,
          gasLimit,
        );

      if (error) {
        throw error;
      }

      logEveryWhere({
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
        message: `transferToken() for wallet ${walletAddress}, transaction hash: ${txHash}`,
      });

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

    return this.threadManager.runNormalTask<ITransferTokenNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as ITransferTokenNodeConfig)?.timeout || 0) *
        1000,
      taskName: "transferToken",
      withoutBrowser: true,
    });
  };

  approveRevokeTokenEVM = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IApproveRevokeEVMNodeConfig,
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
      const spenderAddress = getActualValue(
        config?.spenderAddress || "",
        listVariable,
      );
      const tokenAddress = getActualValue(
        config?.tokenAddress || "",
        listVariable,
      );
      const amount = getActualValue(config?.amount || "", listVariable);
      const gasPrice = getActualValue(config?.gasPrice || "", listVariable);

      const [txHash, err] = await this.evmProvider?.approveToken(
        privateKey,
        spenderAddress,
        tokenAddress,
        amount,
        Boolean(config?.isUnlimitedAmount),
        Boolean(config?.isRevoke),
        listNodeProvider,
        ((flowProfile?.config as IApproveRevokeEVMNodeConfig)?.timeout || 0) *
          1000,
        gasPrice,
      );
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

    return this.threadManager.runNormalTask<IApproveRevokeEVMNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as IApproveRevokeEVMNodeConfig)?.timeout || 0) *
        1000,
      taskName: "approveRevokeTokenEVM",
      withoutBrowser: true,
    });
  };

  executeTransaction = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IExecuteTransactionNodeConfig,
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
      const gasPrice = getActualValue(config?.gasPrice || "", listVariable);
      const gasLimit = getActualValue(config?.gasLimit || "", listVariable);
      const transactionData = getActualValue(
        config?.transactionData || "",
        listVariable,
      );
      const toAddress = getActualValue(config?.toAddress || "", listVariable);
      const transactionValue = getActualValue(
        config?.transactionValue || "",
        listVariable,
      );
      const timeout =
        ((flowProfile?.config as IExecuteTransactionNodeConfig)?.timeout || 0) *
        1000;
      const logInfo = {
        campaignId: flowProfile.campaignConfig?.campaignId || 0,
        workflowId: flowProfile.campaignConfig?.workflowId || 0,
      };

      const resolvedConfig: IExecuteTransactionNodeConfig = {
        ...config,
        gasPrice,
        gasLimit,
        transactionData,
        toAddress,
        transactionValue,
      };

      let txHash = null;
      let err = null;

      if (config.chainType === CHAIN_TYPE.SOLANA) {
        [txHash, err] = await this.solanaTransactionExecutor.executeTransaction(
          resolvedConfig,
          privateKey,
          listNodeProvider,
          timeout,
          logInfo,
        );
      } else {
        [txHash, err] =
          await this.evmTransactionExecutor.executeSingleTransaction(
            resolvedConfig,
            listNodeProvider,
            privateKey,
            timeout,
            logInfo,
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

    return this.threadManager.runNormalTask<IExecuteTransactionNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as IExecuteTransactionNodeConfig)?.timeout || 0) *
        1000,
      taskName: "executeTransaction",
      withoutBrowser: true,
    });
  };

  getTokenPrice = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IGetTokenPriceNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const coingeckoId = getActualValue(
        config?.coingeckoId || "",
        listVariable,
      );
      const tokenAddress = getActualValue(
        config?.tokenAddress || "",
        listVariable,
      );

      const [price, err] = await this.pricing.getTokenPrice({
        ...config,
        coingeckoId,
        tokenAddress,
      });
      if (err) {
        throw err;
      }

      const newListVariable = updateVariable(listVariable, {
        variable: config?.variable!,
        value: price,
      });
      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<IGetTokenPriceNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as IGetTokenPriceNodeConfig)?.timeout || 0) *
        1000,
      taskName: "getTokenPrice",
      withoutBrowser: true,
    });
  };

  checkTokenPrice = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ICheckTokenPriceNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const input: ICheckTokenPriceInput = {
        dataSource: config?.dataSource || "",
        tokenAddress: config?.tokenAddress || "",
        coingeckoId: config?.coingeckoId || "",
        chainId: config?.chainId || 0,
        apiTimeout: config?.timeout || 0,
        poolInterval: config.poolInterval || 0,
        timeFrame: config?.timeFrame || 0,
      };
      const priceChecking = this.priceCheckingManager.getPriceChecking(
        input,
        flowProfile.campaignConfig?.workflowId || 0,
      );
      priceChecking.start();
      const condition: ICheckTokenPriceCondition = {
        compareCondition: config?.compareCondition || "",
        compareValue: config?.compareValue || 0,
      };
      const [isConditionSuccess, currentPrice, err] =
        priceChecking.checkPrice(condition);
      if (err) {
        throw err;
      }

      let newListVariable = updateVariable(listVariable, {
        variable: config?.variable!,
        value: isConditionSuccess ? BOOLEAN_RESULT.TRUE : BOOLEAN_RESULT.FALSE,
      });
      newListVariable = updateVariable(newListVariable, {
        variable: CURRENT_TOKEN_PRICE,
        value: currentPrice,
      });
      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ICheckTokenPriceNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as ICheckTokenPriceNodeConfig)?.timeout || 0) *
        1000,
      taskName: "checkTokenPrice",
      withoutBrowser: true,
    });
  };

  checkMarketcap = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ICheckMarketcapNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const input: ICheckMarketcapInput = {
        dataSource: config?.dataSource || "",
        tokenAddress: config?.tokenAddress || "",
        coingeckoId: config?.coingeckoId || "",
        chainId: config?.chainId || 0,
        apiTimeout: config?.timeout || 0,
        poolInterval: config.poolInterval || 0,
        timeFrame: config?.timeFrame || 0,
      };
      const marketcapChecking =
        this.marketcapCheckingManager.getMarketcapChecking(
          input,
          flowProfile.campaignConfig?.workflowId || 0,
        );
      marketcapChecking.start();
      const condition: ICheckMarketcapCondition = {
        compareCondition: config?.compareCondition || "",
        compareValue: config?.compareValue || 0,
      };
      const [isConditionSuccess, priceAndMarketcap, err] =
        marketcapChecking.checkMarketcap(condition);
      if (err) {
        throw err;
      }

      let newListVariable = updateVariable(listVariable, {
        variable: config?.variable!,
        value: isConditionSuccess ? BOOLEAN_RESULT.TRUE : BOOLEAN_RESULT.FALSE,
      });
      newListVariable = updateVariable(newListVariable, {
        variable: CURRENT_TOKEN_PRICE,
        value: priceAndMarketcap?.price,
      });
      newListVariable = updateVariable(newListVariable, {
        variable: CURRENT_TOKEN_MARKETCAP,
        value: priceAndMarketcap?.marketcap,
      });
      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ICheckTokenPriceNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as ICheckTokenPriceNodeConfig)?.timeout || 0) *
        1000,
      taskName: "checkMarketcap",
      withoutBrowser: true,
    });
  };

  snipeContract = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IEVMSnipeContractNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }
      const campaignId = flowProfile?.campaignConfig?.campaignId || 0;
      const workflowId = flowProfile?.campaignConfig?.workflowId || 0;
      const contractSniper = await this.threadManager.getContractSniper(
        config,
        true,
        campaignId,
        workflowId,
      );
      if (!contractSniper) {
        throw Error("can not create sniper");
      }
      let result: ISnipeContractResult | null = null;

      // wait until has Event or sniper is stopped
      while (result === null && contractSniper?.isRunning) {
        result = await contractSniper?.getOldestResult();
        await sleep(1000);
      }

      if (result === null) {
        // sniper was stopped before an event was received
        return flowProfile;
      }

      let newListVariable = listVariable;
      Object.keys(result).forEach((variable: string) => {
        newListVariable = updateVariable(newListVariable, {
          variable: variable,
          value: result?.[variable],
        });
      });
      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<IEVMSnipeContractNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout: 0,
      taskName: "snipeContract",
      withoutBrowser: true,
    });
  };

  readFromContract = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IEVMReadFromContractNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      if (!config?.nodeEndpointGroupId) {
        throw Error("Node Provider is missing");
      }
      const [listNodeEndpoint] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(
          config?.nodeEndpointGroupId!,
        );
      const listNodeProvider =
        listNodeEndpoint
          ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
          ?.filter((endpoint: string) => Boolean(endpoint)) || [];
      const contractAddress = getActualValue(
        config?.contractAddress || "",
        listVariable,
      );

      const timeout =
        ((flowProfile?.config as IEVMReadFromContractNodeConfig)?.timeout ||
          0) * 1000;
      let listInput = config?.listInput || [];
      listInput = listInput?.map((input: string) => {
        const actualInput = getActualValue(input, listVariable);
        return actualInput;
      });
      const [result, err] = await this.evmProvider.readFromContract(
        contractAddress,
        JSON.parse(config?.contractAbi || "[]"),
        config?.method || "",
        listInput,
        listNodeProvider,
        timeout,
      );
      if (err) {
        throw err;
      }

      let newListVariable = listVariable;
      const variableToSaveResult = config?.listVariable || [];
      if (_.isArray(result) && variableToSaveResult?.length > 1) {
        variableToSaveResult.forEach((variable: string, index: number) => {
          newListVariable = updateVariable(newListVariable, {
            variable: variable,
            value: result?.[index],
          });
        });
      } else {
        const variable = variableToSaveResult[0];
        newListVariable = updateVariable(newListVariable, {
          variable,
          value: result,
        });
      }

      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<IEVMReadFromContractNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as IEVMReadFromContractNodeConfig)?.timeout ||
          0) * 1000,
      taskName: "readFromContract",
      withoutBrowser: true,
    });
  };

  writeToContract = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IEVMWriteContractNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      if (!config?.nodeEndpointGroupId) {
        throw Error("Node Provider is missing");
      }
      const [listNodeEndpoint] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(
          config?.nodeEndpointGroupId!,
        );
      const listNodeProvider =
        listNodeEndpoint
          ?.map((nodeEndpoint: INodeEndpoint) => nodeEndpoint?.endpoint || "")
          ?.filter((endpoint: string) => Boolean(endpoint)) || [];
      const contractAddress = getActualValue(
        config?.contractAddress || "",
        listVariable,
      );
      const gasPrice = getActualValue(
        config?.transactionConfig?.gasPrice?.toString() || "",
        listVariable,
      );
      const gasLimit = getActualValue(
        config?.transactionConfig?.gasLimit?.toString() || "",
        listVariable,
      );
      let transactionConfig: ITransactionConfigEVM = config?.transactionConfig;
      transactionConfig = {
        ...transactionConfig,
        gasLimit,
        gasPrice,
      };

      const timeout =
        ((flowProfile?.config as IEVMWriteContractNodeConfig)?.timeout || 0) *
        1000;
      const [txHash, err] = await this.evmProvider.writeToContract(
        config?.privateKey || "",
        contractAddress,
        JSON.parse(config?.contractAbi || "[]"),
        config?.method || "",
        config?.listInput || [],
        listNodeProvider,
        transactionConfig,
        timeout,
      );
      if (err) {
        throw err;
      }

      let newListVariable = listVariable;
      newListVariable = updateVariable(newListVariable, {
        variable: config?.variable || "",
        value: txHash,
      });
      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<IEVMWriteContractNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as IEVMWriteContractNodeConfig)?.timeout || 0) *
        1000,
      taskName: "writeToContract",
      withoutBrowser: true,
    });
  };
}

export const registerOnChainHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const s = new OnChainWorkflow(args);
  handlers.set(WORKFLOW_TYPE.GET_WALLET_BALANCE, s.getWalletBalance);
  handlers.set(WORKFLOW_TYPE.TRANSFER_TOKEN, s.transferToken);
  handlers.set(WORKFLOW_TYPE.GET_TOKEN_PRICE, s.getTokenPrice);
  handlers.set(WORKFLOW_TYPE.CHECK_TOKEN_PRICE, s.checkTokenPrice);
  handlers.set(WORKFLOW_TYPE.CHECK_MARKETCAP, s.checkMarketcap);
  handlers.set(WORKFLOW_TYPE.EVM_SNIPE_CONTRACT, s.snipeContract);
  handlers.set(WORKFLOW_TYPE.CONVERT_TOKEN_AMOUNT, s.convertTokenAmount);
  handlers.set(WORKFLOW_TYPE.EVM_READ_FROM_CONTRACT, s.readFromContract);
  handlers.set(WORKFLOW_TYPE.EVM_WRITE_TO_CONTRACT, s.writeToContract);
  handlers.set(WORKFLOW_TYPE.EVM_APPROVE_REVOKE_TOKEN, s.approveRevokeTokenEVM);
  handlers.set(WORKFLOW_TYPE.EXECUTE_TRANSACTION, s.executeTransaction);
  handlers.set(WORKFLOW_TYPE.SELECT_TOKEN, s.selectToken);
  handlers.set(WORKFLOW_TYPE.SELECT_CHAIN, s.selectChain);
  handlers.set(WORKFLOW_TYPE.GET_GAS_PRICE, s.getGasPrice);
  handlers.set(WORKFLOW_TYPE.GET_PRIORITY_FEE, s.getPriorityFee);
  handlers.set(WORKFLOW_TYPE.GENERATE_VANITY_ADDRESS, s.generateVanityAddress);
};
