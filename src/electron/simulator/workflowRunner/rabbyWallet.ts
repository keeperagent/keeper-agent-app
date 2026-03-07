import {
  IFlowProfile,
  IUnlockRabbyWalletNodeConfig,
  IRabbyAddNetworkNodeConfig,
  IImportRabbyWalletNodeConfig,
  IConnectRabbyWalletNodeConfig,
  ISignRabbyWalletNodeConfig,
  ICancelRabbyWalletNodeConfig,
} from "@/electron/type";
import { RabbyWallet } from "@/electron/simulator/category/wallet/rabby";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { WorkflowRunnerArgs, NodeHandler } from "./index";
import { ThreadManager } from "./threadManager";

export class RabbyWalletWorkflow {
  threadManager: ThreadManager;
  private rabbyWallet: RabbyWallet;

  constructor({ threadManager }: WorkflowRunnerArgs) {
    this.threadManager = threadManager;
    this.rabbyWallet = new RabbyWallet();
  }

  importRabbyWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IImportRabbyWalletNodeConfig>({
      flowProfile,
      taskFn: this.rabbyWallet.imporWallet,
      timeout:
        ((flowProfile?.config as IImportRabbyWalletNodeConfig)?.timeout || 0) *
        1000,
      taskName: "importRabbyWallet",
    });
  };

  connectRabbyWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IConnectRabbyWalletNodeConfig>({
      flowProfile,
      taskFn: this.rabbyWallet.connectWallet,
      timeout:
        ((flowProfile?.config as IConnectRabbyWalletNodeConfig)?.timeout || 0) *
        1000,
      taskName: "connectRabbyWallet",
      withExtensionPopup: true,
    });
  };

  signRabbyWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<ISignRabbyWalletNodeConfig>({
      flowProfile,
      taskFn: this.rabbyWallet.sign,
      timeout:
        ((flowProfile?.config as ISignRabbyWalletNodeConfig)?.timeout || 0) *
        1000,
      taskName: "signRabbyWallet",
      withExtensionPopup: true,
    });
  };

  cancelRabbyWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<ICancelRabbyWalletNodeConfig>({
      flowProfile,
      taskFn: this.rabbyWallet.cancel,
      timeout:
        ((flowProfile?.config as ICancelRabbyWalletNodeConfig)?.timeout || 0) *
        1000,
      taskName: "cancelRabbyWallet",
      withExtensionPopup: true,
    });
  };

  unlockRabbyWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IUnlockRabbyWalletNodeConfig>({
      flowProfile,
      taskFn: this.rabbyWallet.unlockWallet,
      timeout:
        ((flowProfile?.config as IUnlockRabbyWalletNodeConfig)?.timeout || 0) *
        1000,
      taskName: "unlockRabbyWallet",
    });
  };

  addNetworkRabby = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IRabbyAddNetworkNodeConfig>({
      flowProfile,
      taskFn: this.rabbyWallet.addNetwork,
      timeout:
        ((flowProfile?.config as IRabbyAddNetworkNodeConfig)?.timeout || 0) *
        1000,
      taskName: "addNetworkRabby",
    });
  };
}

export const registerRabbyHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const s = new RabbyWalletWorkflow(args);
  handlers.set(WORKFLOW_TYPE.IMPORT_RABBY_WALLET, s.importRabbyWallet);
  handlers.set(WORKFLOW_TYPE.CONNECT_RABBY_WALLET, s.connectRabbyWallet);
  handlers.set(WORKFLOW_TYPE.UNLOCK_RABBY_WALLET, s.unlockRabbyWallet);
  handlers.set(WORKFLOW_TYPE.CANCEL_RABBY_WALLET, s.cancelRabbyWallet);
  handlers.set(WORKFLOW_TYPE.SIGN_RABBY_WALLET, s.signRabbyWallet);
  handlers.set(WORKFLOW_TYPE.ADD_NETWORK_RABBY_WALLET, s.addNetworkRabby);
};
