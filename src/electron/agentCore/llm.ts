import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenRouter } from "@langchain/openrouter";
import { ILlmSetting, LLMProvider } from "@/electron/type";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { getLlmSetting } from "./utils";
import { claudeCliAuth } from "./claudeCli/claudeCliAuth";
import { claudeCliTransport } from "./claudeCli/claudeCliTransport";

type ProviderConfig = {
  apiKeyField: keyof ILlmSetting | null;
  modelField: keyof ILlmSetting;
  backgroundModelField: keyof ILlmSetting | null;
  keyError: string | null;
  createChat: (
    apiKey: string,
    model: string,
    temperature: number,
    llmSetting: ILlmSetting,
  ) => any;
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
  [LLMProvider.OPENROUTER]: {
    apiKeyField: "openRouterApiKey",
    modelField: "openRouterModel",
    backgroundModelField: null,
    keyError:
      "OpenRouter API key is not found, please set it in the Settings page",
    createChat: (apiKey, model, temperature) =>
      new ChatOpenRouter(model, {
        apiKey,
        temperature,
        siteUrl: "https://keeperagent.app",
        siteName: "Keeper Agent",
      }),
  },
  [LLMProvider.OLLAMA]: {
    apiKeyField: null,
    modelField: "ollamaModel",
    backgroundModelField: null,
    keyError: null,
    createChat: (_, model, temperature, llmSetting) =>
      new ChatOllama({
        model,
        baseUrl: llmSetting?.ollamaBaseUrl || "http://localhost:11434",
        temperature,
      }),
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

  if (provider === LLMProvider.CLAUDE && llm?.useClaudeCLI) {
    if (!claudeCliAuth.isAvailable()) {
      throw new Error(
        "Claude CLI credentials not found. Please run: claude auth login",
      );
    }
    const accessToken = await claudeCliAuth.getAccessToken();
    const modelName =
      modelOverride || llm?.[config.modelField] || DEFAULT_LLM_MODELS[provider];

    return new ChatAnthropic({
      anthropicApiKey: "any_key",
      model: modelName as string,
      temperature,
      streaming: true,
      clientOptions: {
        fetch: claudeCliTransport.createClaudeOAuthFetch(
          accessToken,
          modelName as string,
        ),
      },
    });
  }

  const apiKey = config.apiKeyField ? llm?.[config.apiKeyField] || "" : "";
  if (config.apiKeyField && !apiKey) {
    throw new Error(config.keyError!);
  }
  const modelName =
    modelOverride || llm?.[config.modelField] || DEFAULT_LLM_MODELS[provider];
  return config.createChat(
    apiKey as string,
    modelName as string,
    temperature,
    llm || {},
  );
};

export const createBackgroundLLM = async (provider: LLMProvider) => {
  const config = getProviderConfig(provider);
  const [llm] = await getLlmSetting();
  const backgroundModel = config.backgroundModelField
    ? llm?.[config.backgroundModelField] || undefined
    : undefined;
  return createLLM(provider, 0, backgroundModel as string);
};

export const getModelName = async (provider: LLMProvider): Promise<string> => {
  const config = getProviderConfig(provider);
  const [llm] = await getLlmSetting();
  return (llm?.[config.modelField] as string) || DEFAULT_LLM_MODELS[provider];
};

export const hasApiKey = async (provider: LLMProvider): Promise<boolean> => {
  const config = getProviderConfig(provider);
  if (!config.apiKeyField) {
    return true;
  }
  const [llm, llmErr] = await getLlmSetting();
  if (llmErr) {
    throw llmErr;
  }
  if (provider === LLMProvider.CLAUDE && llm?.useClaudeCLI) {
    return true;
  }
  return !!llm?.[config.apiKeyField];
};
