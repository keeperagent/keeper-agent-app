import { Page } from "playwright-core";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  IRunAgentNodeConfig,
  IFlowProfile,
  IGenerateImageNodeConfig,
  IDebateNodeConfig,
  IWorkflowVariable,
  LLMProvider,
  OPENAI_IMAGE_QUALITY,
  OPENAI_IMAGE_SIZE,
  GOOGLE_IMAGE_ASPECT_RATIO,
  RUN_AGENT_OUTPUT_FORMAT,
} from "@/electron/type";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { SimpleAgent } from "@/electron/simulator/category/agent";
import {
  createAgentFromProfile,
  createLLM,
  ToolContext,
} from "@/electron/appAgent";
import { agentProfileDB } from "@/electron/database/agentProfile";
import { ILlmSetting } from "@/electron/type";
import { getLlmSetting } from "@/electron/appAgent/utils";
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
        const providerConfig = LLM_PROVIDERS.find(
          (item) => item.key === provider,
        );
        if (!providerConfig) {
          throw new Error(`Provider ${provider} not found`);
        }
        const [llmSetting] = await getLlmSetting();
        const apiKey = providerConfig.apiKeyField
          ? llmSetting?.[providerConfig.apiKeyField as keyof ILlmSetting]
          : "";
        if (!apiKey && providerConfig.apiKeyField) {
          throw new Error(`API key for ${provider} not found in preferences`);
        }

        const prompt = getActualValue(config?.prompt || "", listVariable);
        const agent = new SimpleAgent({ model: config?.model });

        const [response, err] = await agent.generateImage(
          prompt,
          config?.folderPath || "",
          config?.fileName || "",
          provider,
          apiKey as string,
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
        const { agent, cleanup } = await createAgentFromProfile({
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

  runDebate = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        _page: Page,
        config: IDebateNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        const topic = getActualValue(config?.topic || "", listVariable);
        const personaA = getActualValue(
          config?.agentAPersona || "",
          listVariable,
        );
        const personaB = getActualValue(
          config?.agentBPersona || "",
          listVariable,
        );
        const judgePrompt = getActualValue(
          config?.judgePrompt || "",
          listVariable,
        );
        const rounds = config?.rounds || 3;

        const createDebateLLM = async (profileId?: number) => {
          if (profileId) {
            const [profile, profileErr] =
              await agentProfileDB.getOneAgentProfile(profileId);
            if (profileErr || !profile) {
              throw (
                profileErr || new Error(`Agent profile #${profileId} not found`)
              );
            }
            const provider =
              (profile.llmProvider as LLMProvider) || LLMProvider.CLAUDE;
            return createLLM(provider, 0, profile.llmModel || undefined);
          }
          return createLLM(LLMProvider.CLAUDE);
        };

        const agentALlm = await createDebateLLM(config?.agentAProfileId);
        const agentBLlm = await createDebateLLM(config?.agentBProfileId);
        const judgeLlm = await createDebateLLM(config?.judgeAgentProfileId);

        const transcript: string[] = [];

        for (let round = 1; round <= rounds; round++) {
          const debateHistoryText =
            transcript.length > 0
              ? `\n\nDebate so far:\n${transcript.join("\n\n")}`
              : "";

          const agentAContext = `Topic: ${topic}${debateHistoryText}\n\nRound ${round}: Make your argument.`;
          const agentAResponse = await agentALlm.invoke([
            new SystemMessage(personaA),
            new HumanMessage(agentAContext),
          ]);
          const agentAText = normalizeAgentMessageContent(
            agentAResponse.content,
          );
          transcript.push(`[Agent A - Round ${round}]: ${agentAText}`);

          const updatedHistoryText = `\n\nDebate so far:\n${transcript.join("\n\n")}`;
          const agentBContext = `Topic: ${topic}${updatedHistoryText}\n\nRound ${round}: Make your argument.`;
          const agentBResponse = await agentBLlm.invoke([
            new SystemMessage(personaB),
            new HumanMessage(agentBContext),
          ]);
          const agentBText = normalizeAgentMessageContent(
            agentBResponse.content,
          );
          transcript.push(`[Agent B - Round ${round}]: ${agentBText}`);
        }

        const fullTranscript = transcript.join("\n\n");
        const judgeInput = `Topic: ${topic}\n\n${fullTranscript}\n\n${judgePrompt}`;
        const judgeResponse = await judgeLlm.invoke([
          new HumanMessage(judgeInput),
        ]);
        const verdict = normalizeAgentMessageContent(judgeResponse.content);

        let output: string;
        if (config?.includeTranscript) {
          output = `${fullTranscript}\n\n=== VERDICT ===\n${verdict}`;
        } else {
          output = verdict;
        }

        const newListVariable = updateVariable(listVariable, {
          variable: config?.variable || "",
          value: output,
        });

        return { ...flowProfile, listVariable: newListVariable };
      };

      return this.threadManager.runNormalTask<IDebateNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout:
          ((flowProfile?.config as IDebateNodeConfig)?.timeout || 0) * 1000,
        taskName: "runDebate",
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
  handlers.set(WORKFLOW_TYPE.DEBATE, agentWorkflow.runDebate);
};
