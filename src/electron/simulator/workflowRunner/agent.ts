import { Page } from "playwright-core";
import { HumanMessage } from "@langchain/core/messages";
import {
  IRunAgentNodeConfig,
  IFlowProfile,
  IGenerateImageNodeConfig,
  IWorkflowVariable,
  LLMProvider,
  OPENAI_IMAGE_QUALITY,
  OPENAI_IMAGE_SIZE,
  GOOGLE_IMAGE_ASPECT_RATIO,
  RUN_AGENT_OUTPUT_FORMAT,
} from "@/electron/type";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { SimpleAgent } from "@/electron/simulator/category/agent";
import { createProfileKeeperAgent, ToolContext } from "@/electron/appAgent";
import { agentProfileDB } from "@/electron/database/agentProfile";
import { preferenceDB } from "@/electron/database/preference";
import { LLM_PROVIDERS } from "@/config/llmProviders";
import { normalizeAgentMessageContent } from "@/service/agentMessageContent";
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

  generateImage = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        _page: Page,
        config: IGenerateImageNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        const provider = config?.provider || LLMProvider.OPENAI;
        const providerConfig = LLM_PROVIDERS.find((p) => p.key === provider);
        const [preference] = await preferenceDB.getOnePreference();
        const apiKey = providerConfig
          ? (preference?.[providerConfig?.apiKeyField] as string)
          : "";

        if (!apiKey) {
          throw new Error(`API key for ${provider} not found in preferences`);
        }

        const prompt = getActualValue(config?.prompt || "", listVariable);
        const agent = new SimpleAgent({ model: config?.model });

        const [response, err] = await agent.generateImage(
          prompt,
          config?.folderPath || "",
          config?.fileName || "",
          provider,
          apiKey,
          config?.size || OPENAI_IMAGE_SIZE.SIZE_1024_1024,
          config?.quality || OPENAI_IMAGE_QUALITY.MEDIUM,
          config?.aspectRatio || GOOGLE_IMAGE_ASPECT_RATIO.SQUARE,
        );
        if (err) {
          throw err;
        }
        const newListVariable = updateVariable(listVariable, {
          variable: config?.variable!,
          value: response,
        });

        return { ...flowProfile, listVariable: newListVariable };
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
      return [flowProfile, err];
    }
  };

  runAgent = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        _page: Page,
        config: IRunAgentNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        const agentProfileId = config?.agentProfileId;
        if (!agentProfileId) {
          throw new Error("No agent profile selected");
        }

        const [profile, profileErr] =
          await agentProfileDB.getOneAgentProfile(agentProfileId);
        if (profileErr || !profile) {
          throw (
            profileErr ||
            new Error(`Agent profile #${agentProfileId} not found`)
          );
        }

        const prompt = getActualValue(
          config?.promptTemplate || "",
          listVariable,
        );
        const toolContext = new ToolContext();
        const { agent, cleanup } = await createProfileKeeperAgent({
          profile,
          toolContext,
        });

        let resultValue: any = "";
        try {
          const response = await (agent as any).invoke(
            { messages: [new HumanMessage(prompt)] },
            {
              configurable: {
                thread_id: `workflow_agent_profile_${agentProfileId}_${Date.now()}`,
              },
            },
          );
          const lastMessage =
            response?.messages?.[response.messages.length - 1];

          if (config?.outputFormat === RUN_AGENT_OUTPUT_FORMAT.JSON) {
            const rawText = normalizeAgentMessageContent(lastMessage?.content);
            try {
              resultValue = JSON.parse(rawText);
            } catch {
              resultValue = rawText;
            }
          } else {
            resultValue = normalizeAgentMessageContent(lastMessage?.content);
          }
        } finally {
          cleanup().catch(() => {});
        }

        const newListVariable = updateVariable(listVariable, {
          variable: config?.variable || "",
          value: resultValue,
        });

        return { ...flowProfile, listVariable: newListVariable };
      };

      return this.threadManager.runNormalTask<IRunAgentNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout:
          ((flowProfile?.config as IRunAgentNodeConfig)?.timeout || 0) * 1000,
        taskName: "runAgent",
        withoutBrowser: true,
      });
    } catch (err: any) {
      return [flowProfile, err];
    }
  };
}

export const registerAgentHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const agentWorkflow = new AgentWorkflow(args);
  handlers.set(WORKFLOW_TYPE.GENERATE_IMAGE, agentWorkflow.generateImage);
  handlers.set(WORKFLOW_TYPE.RUN_AGENT, agentWorkflow.runAgent);
};
