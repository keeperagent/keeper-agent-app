import { Page } from "playwright-core";
import {
  IFlowProfile,
  ILaunchTokenPumpfunNodeConfig,
  INodeEndpoint,
  IWorkflowVariable,
} from "@/electron/type";
import {
  updateVariable,
  processSkipSetting,
  getActualValue,
} from "@/electron/simulator/util";
import { ThreadManager } from "./threadManager";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { Pumpfun } from "@/electron/simulator/category/onchain/pumpfun";
import { WorkflowRunnerArgs, NodeHandler } from "./index";

export class LaunchTokenWorkflow {
  threadManager: ThreadManager;
  private pumpfun: Pumpfun;

  constructor({ threadManager, pumpfun }: WorkflowRunnerArgs) {
    this.threadManager = threadManager;
    this.pumpfun = pumpfun;
  }

  launchTokenPumpfun = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ILaunchTokenPumpfunNodeConfig,
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
      const buyAmountSol = getActualValue(
        config?.buyAmountSol || "0",
        listVariable,
      );
      const unitLimit = getActualValue(config?.unitLimit || "0", listVariable);
      const unitPrice = getActualValue(config?.unitPrice || "0", listVariable);
      const tokenName = getActualValue(config?.tokenName || "", listVariable);
      const symbol = getActualValue(config?.symbol || "", listVariable);
      const description = getActualValue(
        config?.description || "",
        listVariable,
      );
      const imageUrl = getActualValue(config?.imageUrl || "", listVariable);
      const twitter = getActualValue(config?.twitter || "", listVariable);
      const telegram = getActualValue(config?.telegram || "", listVariable);
      const website = getActualValue(config?.website || "", listVariable);
      const vanityAddressPrivateKey = getActualValue(
        config?.vanityAddressPrivateKey || "",
        listVariable,
      );

      config = {
        ...config,
        privateKey,
        buyAmountSol,
        unitLimit,
        unitPrice,
        tokenName,
        symbol,
        description,
        imageUrl,
        twitter,
        telegram,
        website,
        vanityAddressPrivateKey,
      };

      const [txHash, tokenAddress, err] = await this.pumpfun.createToken(
        privateKey,
        listNodeProvider,
        config,
      );
      if (err) {
        throw err;
      }

      let newListVariable = updateVariable(listVariable, {
        variable: config?.variableTxHash || "",
        value: txHash,
      });
      newListVariable = updateVariable(newListVariable, {
        variable: config?.variableTokenAddress || "",
        value: tokenAddress,
      });

      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ILaunchTokenPumpfunNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as ILaunchTokenPumpfunNodeConfig)?.timeout || 0) *
        1000,
      taskName: "launchTokenPumpfun",
      withoutBrowser: true,
    });
  };
}

export const registerLaunchTokenHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const s = new LaunchTokenWorkflow(args);
  handlers.set(WORKFLOW_TYPE.LAUNCH_TOKEN_PUMPFUN, s.launchTokenPumpfun);
};
