import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { LLMProvider } from "@/electron/type";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import {
  getOpenAIKey,
  getAnthropicKey,
  getGoogleGeminiKey,
  getOpenAIModel,
  getAnthropicModel,
  getGoogleGeminiModel,
  getOpenAIBackgroundModel,
  getAnthropicBackgroundModel,
  getGoogleGeminiBackgroundModel,
} from "./utils";

type ProviderConfig = {
  getKey: () => Promise<[string | null, ...any[]]>;
  getModel: () => Promise<string | null>;
  getBackgroundModel: () => Promise<string | null>;
  keyError: string;
  createChat: (apiKey: string, model: string, temperature: number) => any;
};

const PROVIDER_CONFIG: Record<LLMProvider, ProviderConfig> = {
  [LLMProvider.CLAUDE]: {
    getKey: getAnthropicKey,
    getModel: getAnthropicModel,
    getBackgroundModel: getAnthropicBackgroundModel,
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
    getKey: getGoogleGeminiKey,
    getModel: getGoogleGeminiModel,
    getBackgroundModel: getGoogleGeminiBackgroundModel,
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
    getKey: getOpenAIKey,
    getModel: getOpenAIModel,
    getBackgroundModel: getOpenAIBackgroundModel,
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
  const [apiKey] = await config.getKey();
  if (!apiKey) {
    throw new Error(config.keyError);
  }
  const modelName =
    modelOverride || (await config.getModel()) || DEFAULT_LLM_MODELS[provider];
  return config.createChat(apiKey, modelName, temperature);
};

export const createBackgroundLLM = async (provider: LLMProvider) => {
  const config = getProviderConfig(provider);
  const backgroundModel = await config.getBackgroundModel();
  return createLLM(provider, 0, backgroundModel || undefined);
};

export const hasApiKey = async (provider: LLMProvider): Promise<boolean> => {
  const config = getProviderConfig(provider);
  const [apiKey] = await config.getKey();
  return !!apiKey;
};
