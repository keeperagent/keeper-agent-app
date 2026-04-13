import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ILlmSetting, LLMProvider } from "@/electron/type";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { getLlmSetting } from "./utils";

type ProviderConfig = {
  apiKeyField: keyof ILlmSetting;
  modelField: keyof ILlmSetting;
  backgroundModelField: keyof ILlmSetting;
  keyError: string;
  createChat: (apiKey: string, model: string, temperature: number) => any;
};

const PROVIDER_CONFIG: Record<LLMProvider, ProviderConfig> = {
  [LLMProvider.CLAUDE]: {
    apiKeyField: "anthropicApiKey",
    modelField: "anthropicModel",
    backgroundModelField: "anthropicBackgroundModel",
    keyError:
      "Anthropic API key is not found, please set it in the Settings page",
    createChat: (apiKey, model, temperature) =>
      new ChatAnthropic({
        anthropicApiKey: apiKey,
        model,
        temperature,
        streaming: true,
      }),
  },
  [LLMProvider.GEMINI]: {
    apiKeyField: "googleGeminiApiKey",
    modelField: "googleGeminiModel",
    backgroundModelField: "googleGeminiBackgroundModel",
    keyError:
      "Google Gemini API key is not found, please set it in the Settings page",
    createChat: (apiKey, model, temperature) =>
      new ChatGoogleGenerativeAI({
        apiKey,
        model,
        temperature,
        streaming: true,
      }),
  },
  [LLMProvider.OPENAI]: {
    apiKeyField: "openAIApiKey",
    modelField: "openAIModel",
    backgroundModelField: "openAIBackgroundModel",
    keyError: "OpenAI API key is not found, please set it in the Settings page",
    createChat: (apiKey, model, temperature) =>
      new ChatOpenAI({ apiKey, model, temperature, streaming: true }),
  },
};

const getProviderConfig = (provider: LLMProvider): ProviderConfig =>
  PROVIDER_CONFIG[provider] || PROVIDER_CONFIG[LLMProvider.CLAUDE];

export const createLLM = async (
  provider: LLMProvider,
  temperature = 0,
  modelOverride?: string,
) => {
  const config = getProviderConfig(provider);
  const [llm, llmErr] = await getLlmSetting();
  if (llmErr) {
    throw llmErr;
  }
  const apiKey = (llm?.[config.apiKeyField] as string) || null;
  if (!apiKey) {
    throw new Error(config.keyError);
  }
  const modelName =
    modelOverride ||
    (llm?.[config.modelField] as string) ||
    DEFAULT_LLM_MODELS[provider];
  return config.createChat(apiKey, modelName, temperature);
};

export const createBackgroundLLM = async (provider: LLMProvider) => {
  const config = getProviderConfig(provider);
  const [llm] = await getLlmSetting();
  const backgroundModel =
    (llm?.[config.backgroundModelField] as string) || undefined;
  return createLLM(provider, 0, backgroundModel);
};

export const getModelName = async (provider: LLMProvider): Promise<string> => {
  const config = getProviderConfig(provider);
  const [llm] = await getLlmSetting();
  return (llm?.[config.modelField] as string) || DEFAULT_LLM_MODELS[provider];
};

export const hasApiKey = async (provider: LLMProvider): Promise<boolean> => {
  const config = getProviderConfig(provider);
  const [llm, llmErr] = await getLlmSetting();
  if (llmErr) {
    throw llmErr;
  }
  return !!llm?.[config.apiKeyField];
};
