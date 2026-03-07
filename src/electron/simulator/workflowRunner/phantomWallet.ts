import {
  IFlowProfile,
  IImportPhantomWalletNodeConfig,
  IUnlockPhantomWalletNodeConfig,
  IConnectPhantomWalletNodeConfig,
  IClickConfirmPhantomWalletNodeConfig,
} from "@/electron/type";
import { PhantomWallet } from "@/electron/simulator/category/wallet/phantom";
import { ThreadManager } from "./threadManager";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { WorkflowRunnerArgs, NodeHandler } from "./index";

export class PhantomWalletWorkflow {
  threadManager: ThreadManager;
  private phantomWallet: PhantomWallet;

  constructor({ threadManager }: WorkflowRunnerArgs) {
    this.threadManager = threadManager;
    this.phantomWallet = new PhantomWallet();
  }

  importPhantomWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IImportPhantomWalletNodeConfig>({
      flowProfile,
      taskFn: this.phantomWallet.importWallet,
      timeout:
        ((flowProfile?.config as IImportPhantomWalletNodeConfig)?.timeout ||
          0) * 1000,
      taskName: "importPhantomWallet",
    });
  };

  unlockPhantomWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IUnlockPhantomWalletNodeConfig>({
      flowProfile,
      taskFn: this.phantomWallet.unlockWallet,
      timeout:
        ((flowProfile?.config as IUnlockPhantomWalletNodeConfig)?.timeout ||
          0) * 1000,
      taskName: "unlockPhantomWallet",
    });
  };

  connectPhantomWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IConnectPhantomWalletNodeConfig>({
      flowProfile,
      taskFn: this.phantomWallet.connectWallet,
      timeout:
        ((flowProfile?.config as IConnectPhantomWalletNodeConfig)?.timeout ||
          0) * 1000,
      taskName: "connectPhantomWallet",
      withExtensionPopup: true,
    });
  };

  clickConfirmPhantomWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IClickConfirmPhantomWalletNodeConfig>(
      {
        flowProfile,
        taskFn: this.phantomWallet.clickConfirm,
        timeout:
          ((flowProfile?.config as IClickConfirmPhantomWalletNodeConfig)
            ?.timeout || 0) * 1000,
        taskName: "clickConfirmPhantomWallet",
        withExtensionPopup: true,
      },
    );
  };
}

export const registerPhantomHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const s = new PhantomWalletWorkflow(args);
  handlers.set(WORKFLOW_TYPE.IMPORT_PHANTOM_WALLET, s.importPhantomWallet);
  handlers.set(WORKFLOW_TYPE.UNLOCK_PHANTOM_WALLET, s.unlockPhantomWallet);
  handlers.set(WORKFLOW_TYPE.CONNECT_PHANTOM_WALLET, s.connectPhantomWallet);
  handlers.set(
    WORKFLOW_TYPE.CLICK_CONFIRM_PHANTOM_WALLET,
    s.clickConfirmPhantomWallet,
  );
};
