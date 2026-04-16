import { IFlowProfile } from "@/electron/type";
import { WORKFLOW_TYPE } from "@/electron/constant";
import {
  WorkflowRunnerArgs,
  NodeHandler,
} from "@/electron/simulator/workflowRunner";
import { ThreadManager } from "@/electron/simulator/workflowRunner/threadManager";
import { registerBrowserHandlers } from "@/electron/simulator/workflowRunner/browserInteraction";
import { registerOnChainHandlers } from "@/electron/simulator/workflowRunner/onchain";
import { registerMetamaskHandlers } from "@/electron/simulator/workflowRunner/metamaskWallet";
import { registerMartianHandlers } from "@/electron/simulator/workflowRunner/martianWallet";
import { registerPhantomHandlers } from "@/electron/simulator/workflowRunner/phantomWallet";
import { registerRabbyHandlers } from "@/electron/simulator/workflowRunner/rabbyWallet";
import { registerTelegramHandlers } from "@/electron/simulator/workflowRunner/telegram";
import { registerTwitterHandlers } from "@/electron/simulator/workflowRunner/twitter";
import { registerOtherHandlers } from "@/electron/simulator/workflowRunner/others";
import { registerAgentHandlers } from "@/electron/simulator/workflowRunner/agent";
import { registerLaunchTokenHandlers } from "@/electron/simulator/workflowRunner/launchToken";
import { registerSwapHandlers } from "@/electron/simulator/workflowRunner/swap";
import { MESSAGE_LOOP_DONE } from "@/electron/simulator/constant";
import { ILoopNodeConfig } from "@/electron/type";
import { licenseService } from "@/electron/service/licenseService";
import { workflowManager } from "./index";

export class Executor {
  private handlers = new Map<string, NodeHandler>();
  threadManager: ThreadManager;

  constructor(args: WorkflowRunnerArgs) {
    this.threadManager = args.threadManager;

    registerBrowserHandlers(this.handlers, args);
    registerOnChainHandlers(this.handlers, args);
    registerMetamaskHandlers(this.handlers, args);
    registerMartianHandlers(this.handlers, args);
    registerPhantomHandlers(this.handlers, args);
    registerRabbyHandlers(this.handlers, args);
    registerTelegramHandlers(this.handlers, args);
    registerTwitterHandlers(this.handlers, args);
    registerOtherHandlers(this.handlers, args);
    registerAgentHandlers(this.handlers, args);
    registerLaunchTokenHandlers(this.handlers, args);
    registerSwapHandlers(this.handlers, args);

    this.handlers.set(
      WORKFLOW_TYPE.SWITCH_WINDOW,
      args.threadManager.getExtensionPage,
    );
  }

  private runTask = async (
    flowProfile: IFlowProfile,
    handler: (
      flowProfile: IFlowProfile,
    ) => Promise<[IFlowProfile | null, Error | null, ...any]>,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const [updatedFlowProfile, err] = await handler(flowProfile);

    return [
      {
        ...updatedFlowProfile,
        threadID: updatedFlowProfile?.threadID!,
        endTimestamp: new Date().getTime(),
      },
      err,
    ];
  };

  executeScript = async (
    workflowType: string,
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const nodeQuotaLimit = licenseService.isFreeTier;
    if (nodeQuotaLimit) {
      return [flowProfile, new Error("Node execution limit exceeded")];
    }

    if (workflowType === WORKFLOW_TYPE.LOOP) {
      const nodeId = flowProfile?.nodeID || "";
      const numberOfLoop = (flowProfile?.config as ILoopNodeConfig)?.loop || 0;
      const currentCount = (flowProfile?.loopCounters?.[nodeId] || 0) + 1;

      if (currentCount < numberOfLoop) {
        return [
          {
            ...flowProfile,
            loopCounters: {
              ...flowProfile?.loopCounters,
              [nodeId]: currentCount,
            },
          },
          null,
        ];
      }

      return [
        {
          ...flowProfile,
          loopCounters: { ...flowProfile?.loopCounters, [nodeId]: 0 },
        },
        new Error(MESSAGE_LOOP_DONE),
      ];
    }

    if (workflowType === WORKFLOW_TYPE.STOP_SCRIPT) {
      const { workflowId = 0, campaignId = 0 } =
        flowProfile?.campaignConfig || {};
      const workflow = await workflowManager.getWorkflow(
        workflowId,
        campaignId,
        0,
      );
      await workflow.stopWorkflow();
      return [flowProfile, null];
    }

    const handler = this.handlers.get(workflowType);
    if (!handler) {
      return [flowProfile, null];
    }

    return this.runTask(flowProfile, handler);
  };
}
