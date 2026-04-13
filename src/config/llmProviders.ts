import { LLMProvider, IPreference } from "@/electron/type";
import claudeLogo from "@/asset/claude.webp";
import openaiLogo from "@/asset/openai.webp";
import geminiLogo from "@/asset/gemini.webp";
import openrouterLogo from "@/asset/openrouter.png";
import ollamaLogo from "@/asset/ollama.png";

export const LLM_PROVIDERS: {
  key: LLMProvider;
  label: string;
  icon: string;
  apiKeyField: keyof IPreference | null;
  modelField: keyof IPreference;
}[] = [
  {
    key: LLMProvider.CLAUDE,
    label: "Claude",
    icon: claudeLogo,
    apiKeyField: "anthropicApiKey",
    modelField: "anthropicModel",
  },
  {
    key: LLMProvider.OPENAI,
    label: "GPT",
    icon: openaiLogo,
    apiKeyField: "openAIApiKey",
    modelField: "openAIModel",
  },
  {
    key: LLMProvider.GEMINI,
    label: "Gemini",
    icon: geminiLogo,
    apiKeyField: "googleGeminiApiKey",
    modelField: "googleGeminiModel",
  },
  {
    key: LLMProvider.OPENROUTER,
    label: "OpenRouter",
    icon: openrouterLogo,
    apiKeyField: "openRouterApiKey",
    modelField: "openRouterModel",
  },
  {
    key: LLMProvider.OLLAMA,
    label: "Ollama",
    icon: ollamaLogo,
    apiKeyField: null,
    modelField: "ollamaModel",
  },
];
