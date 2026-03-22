import { LLMProvider } from "@/electron/type";
import claudeLogo from "@/asset/claude.webp";
import openaiLogo from "@/asset/openai.webp";
import geminiLogo from "@/asset/gemini.webp";

export const LLM_PROVIDERS = [
  { key: LLMProvider.CLAUDE, label: "Claude", icon: claudeLogo },
  { key: LLMProvider.OPENAI, label: "GPT", icon: openaiLogo },
  { key: LLMProvider.GEMINI, label: "Gemini", icon: geminiLogo },
];
