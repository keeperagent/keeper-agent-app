import { Page } from "puppeteer-core";
import {
  IAskAgentNodeConfig,
  IFlowProfile,
  IGenerateImageNodeConfig,
  IWorkflowVariable,
  OPENAI_IMAGE_QUALITY,
  OPENAI_IMAGE_SIZE,
} from "@/electron/type";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { SimpleAgent } from "@/electron/simulator/category/agent";
import { logEveryWhere } from "@/electron/service/util";
import {
  getActualValue,
  processSkipSetting,
  updateVariable,
} from "@/electron/simulator/util";
import { WorkflowRunnerArgs, NodeHandler } from "./index";
import { ThreadManager } from "./threadManager";

export class AgentWorkflow {
  threadManager: ThreadManager;

  constructor({ threadManager }: WorkflowRunnerArgs) {
    this.threadManager = threadManager;
  }

  askAgent = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        page: Page,
        config: IAskAgentNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        const prompt = getActualValue(config?.prompt || "", listVariable);
        const agent = new SimpleAgent({
          model: config?.model,
        });

        const [response, err] = await agent.askAgent(prompt);
        if (err) {
          throw err;
        }
        logEveryWhere({
          message: `askAgent() response: ${response}`,
          campaignId: flowProfile.campaignConfig?.campaignId,
          workflowId: flowProfile.campaignConfig?.workflowId,
        });
        const newListVariable = updateVariable(listVariable, {
          variable: config?.variable || "",
          value: response,
        });

        const updatedProfile: IFlowProfile = {
          ...flowProfile,
          listVariable: newListVariable,
        };

        return updatedProfile;
      };

      return this.threadManager.runNormalTask<IAskAgentNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout:
          ((flowProfile?.config as IAskAgentNodeConfig)?.timeout || 0) * 1000,
        taskName: "askAgent",
        withoutBrowser: true,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `askAgent() error: ${err?.message}`,
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
      });
      return [flowProfile, err];
    }
  };

  generateImage = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        page: Page,
        config: IGenerateImageNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        const prompt = getActualValue(config?.prompt || "", listVariable);
        const agent = new SimpleAgent({
          model: config?.model,
        });

        const [response, err] = await agent.generateImage(
          prompt,
          config?.folderPath || "",
          config?.fileName || "",
          config?.size || OPENAI_IMAGE_SIZE.SIZE_1024_1024,
          config?.quality || OPENAI_IMAGE_QUALITY.MEDIUM,
        );
        if (err) {
          throw err;
        }
        logEveryWhere({
          message: `generateImage() image path: ${response}`,
          campaignId: flowProfile.campaignConfig?.campaignId,
          workflowId: flowProfile.campaignConfig?.workflowId,
        });
        const newListVariable = updateVariable(listVariable, {
          variable: config?.variable!,
          value: response,
        });

        const updatedProfile: IFlowProfile = {
          ...flowProfile,
          listVariable: newListVariable,
        };

        return updatedProfile;
      };

      return this.threadManager.runNormalTask<IGenerateImageNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout:
          ((flowProfile?.config as IGenerateImageNodeConfig)?.timeout || 0) *
          1000,
        taskName: "generateImage",
        withoutBrowser: true,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `generateImage() error: ${err?.message}`,
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
      });
      return [flowProfile, err];
    }
  };
}

export const registerAgentHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const s = new AgentWorkflow(args);
  handlers.set(WORKFLOW_TYPE.ASK_AGENT, s.askAgent);
  handlers.set(WORKFLOW_TYPE.GENERATE_IMAGE, s.generateImage);
};
