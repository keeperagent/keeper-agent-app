import {
  IFlowProfile,
  IImportMetamaskNodeConfig,
  IUnlockMetamaskNodeConfig,
  IConnectMetamaskNodeConfig,
  IApproveMetamaskNodeConfig,
  IConfirmMetamaskNodeConfig,
  ICancelMetamaskNodeConfig,
} from "@/electron/type";
import { Metamask } from "@/electron/simulator/category/wallet/metamask";
import { ThreadManager } from "./threadManager";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { WorkflowRunnerArgs, NodeHandler } from "./index";

export class MetamaskWalletWorkflow {
  threadManager: ThreadManager;
  private metamask: Metamask;

  constructor({ threadManager }: WorkflowRunnerArgs) {
    this.threadManager = threadManager;
    this.metamask = new Metamask();
  }

  importMetamaskWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IImportMetamaskNodeConfig>({
      flowProfile,
      taskFn: this.metamask.import,
      timeout:
        ((flowProfile?.config as IImportMetamaskNodeConfig)?.timeout || 0) *
        1000,
      taskName: "importMetamaskWallet",
    });
  };

  unlockMetamaskWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IUnlockMetamaskNodeConfig>({
      flowProfile,
      taskFn: this.metamask.unlock,
      timeout:
        ((flowProfile?.config as IUnlockMetamaskNodeConfig)?.timeout || 0) *
        1000,
      taskName: "unlockMetamaskWallet",
    });
  };

  connectMetamaskWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IConnectMetamaskNodeConfig>({
      flowProfile,
      taskFn: this.metamask.connect,
      timeout:
        ((flowProfile?.config as IConnectMetamaskNodeConfig)?.timeout || 0) *
        1000,
      taskName: "connectMetamaskWallet",
      withExtensionPopup: true,
    });
  };

  approveMetamaskWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IApproveMetamaskNodeConfig>({
      flowProfile,
      taskFn: this.metamask.approve,
      timeout:
        ((flowProfile?.config as IApproveMetamaskNodeConfig)?.timeout || 0) *
        1000,
      taskName: "approveMetamaskWallet",
      withExtensionPopup: true,
    });
  };

  cancelMetamaskWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<ICancelMetamaskNodeConfig>({
      flowProfile,
      taskFn: this.metamask.cancel,
      timeout:
        ((flowProfile?.config as ICancelMetamaskNodeConfig)?.timeout || 0) *
        1000,
      taskName: "cancelMetamaskWallet",
      withExtensionPopup: true,
    });
  };

  confirmMetamaskWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IConfirmMetamaskNodeConfig>({
      flowProfile,
      taskFn: this.metamask.confirm,
      timeout:
        ((flowProfile?.config as IConfirmMetamaskNodeConfig)?.timeout || 0) *
        1000,
      taskName: "confirmMetamaskWallet",
      withExtensionPopup: true,
    });
  };
}

export const registerMetamaskHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const s = new MetamaskWalletWorkflow(args);
  handlers.set(WORKFLOW_TYPE.IMPORT_METAMASK_WALLET, s.importMetamaskWallet);
  handlers.set(WORKFLOW_TYPE.UNLOCK_METAMASK_WALLET, s.unlockMetamaskWallet);
  handlers.set(WORKFLOW_TYPE.CONNECT_METAMASK_WALLET, s.connectMetamaskWallet);
  handlers.set(WORKFLOW_TYPE.APPROVE_METAMASK_WALLET, s.approveMetamaskWallet);
  handlers.set(WORKFLOW_TYPE.CANCEL_METAMASK_WALLET, s.cancelMetamaskWallet);
  handlers.set(WORKFLOW_TYPE.CONFIRM_METAMASK_WALLET, s.confirmMetamaskWallet);
};
