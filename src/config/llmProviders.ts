import { LLMProvider, IPreference } from "@/electron/type";
import claudeLogo from "@/asset/claude.webp";
import openaiLogo from "@/asset/openai.webp";
import geminiLogo from "@/asset/gemini.webp";

export const LLM_PROVIDERS: {
  key: LLMProvider;
  label: string;
  icon: string;
  apiKeyField: keyof IPreference;
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
];
