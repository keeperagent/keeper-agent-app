import {
  IFlowProfile,
  IImportMartianWalletNodeConfig,
  IApproveMetamaskNodeConfig,
  IUnlockMartianWalletNodeConfig,
  ISwitchMartianWalletNodeConfig,
} from "@/electron/type";
import { MartianWallet } from "@/electron/simulator/category/wallet/martian";
import { ThreadManager } from "./threadManager";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { WorkflowRunnerArgs, NodeHandler } from "./index";

export class MartianWalletWorkflow {
  threadManager: ThreadManager;
  private martianWallet: MartianWallet;

  constructor({ threadManager }: WorkflowRunnerArgs) {
    this.threadManager = threadManager;
    this.martianWallet = new MartianWallet();
  }

  importMartianWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IImportMartianWalletNodeConfig>({
      flowProfile,
      taskFn: this.martianWallet.importWallet,
      timeout:
        ((flowProfile?.config as IImportMartianWalletNodeConfig)?.timeout ||
          0) * 1000,
      taskName: "importMartianWallet",
    });
  };

  unlockMartianWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IUnlockMartianWalletNodeConfig>({
      flowProfile,
      taskFn: this.martianWallet.unlockWallet,
      timeout:
        ((flowProfile?.config as IUnlockMartianWalletNodeConfig)?.timeout ||
          0) * 1000,
      taskName: "unlockMartianWallet",
    });
  };

  approveMartianWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IApproveMetamaskNodeConfig>({
      flowProfile,
      taskFn: this.martianWallet.approve,
      timeout:
        ((flowProfile?.config as IApproveMetamaskNodeConfig)?.timeout || 0) *
        1000,
      taskName: "approveMartianWallet",
      withExtensionPopup: true,
    });
  };

  switchMartianWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<ISwitchMartianWalletNodeConfig>({
      flowProfile,
      taskFn: this.martianWallet.switch,
      timeout:
        ((flowProfile?.config as ISwitchMartianWalletNodeConfig)?.timeout ||
          0) * 1000,
      taskName: "switchMartianWallet",
      withExtensionPopup: true,
    });
  };
}

export const registerMartianHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const s = new MartianWalletWorkflow(args);
  handlers.set(WORKFLOW_TYPE.IMPORT_MARTIAN_WALLET, s.importMartianWallet);
  handlers.set(WORKFLOW_TYPE.UNLOCK_MARTIAN_WALLET, s.unlockMartianWallet);
  handlers.set(WORKFLOW_TYPE.APPROVE_MARTIAN_WALLET, s.approveMartianWallet);
  handlers.set(WORKFLOW_TYPE.SWITCH_MARTIAN_WALLET, s.switchMartianWallet);
};
