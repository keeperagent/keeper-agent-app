import { app } from "electron";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { LLMProvider } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";

const MODEL_CAPABILITY_URL =
  "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";
const MODEL_CAPABILITY_FILE_NAME = "model-capability.json";

export type IModelCapability = {
  supportsVision: boolean;
};

const PROVIDER_PREFIXES: Record<LLMProvider, string[]> = {
  [LLMProvider.OPENAI]: ["openai/"],
  [LLMProvider.CLAUDE]: ["claude-", "openrouter/anthropic/"],
  [LLMProvider.GEMINI]: ["gemini/", "openrouter/google/"],
  [LLMProvider.OPENROUTER]: ["openrouter/"],
  [LLMProvider.OLLAMA]: ["ollama/"],
};

class ModelCapabilityService {
  private cache: Record<string, IModelCapability> = {};
  private cacheLoaded = false;

  private cacheKey = (provider: LLMProvider, modelName: string) =>
    `${provider}:${modelName}`;

  checkModelCapability = async (
    modelName: string,
    provider: LLMProvider,
  ): Promise<IModelCapability> => {
    if (!modelName) {
      return { supportsVision: false };
    }

    await this.ensureCacheLoaded();
    const key = this.cacheKey(provider, modelName);
    if (key in this.cache) {
      return this.cache[key];
    }

    const capability = await this.fetchModelCapability(modelName, provider);
    this.cache[key] = capability;
    await this.saveToDisk(this.cache);
    return capability;
  };

  private getCachePath = () =>
    path.join(app.getPath("userData"), MODEL_CAPABILITY_FILE_NAME);

  private loadFromDisk = async (): Promise<
    Record<string, IModelCapability>
  > => {
    try {
      const raw = await fs.readFile(this.getCachePath(), "utf-8");
      return JSON.parse(raw);
    } catch {
      return {};
    }
  };

  private saveToDisk = async (data: Record<string, IModelCapability>) => {
    try {
      await fs.writeFile(
        this.getCachePath(),
        JSON.stringify(data, null, 2),
        "utf-8",
      );
    } catch {}
  };

  private ensureCacheLoaded = async () => {
    if (this.cacheLoaded) {
      return;
    }
    this.cache = await this.loadFromDisk();
    this.cacheLoaded = true;
  };

  private fetchModelCapability = async (
    modelName: string,
    provider: LLMProvider,
  ): Promise<IModelCapability> => {
    try {
      const response = await axios.get(MODEL_CAPABILITY_URL, {
        timeout: 10000,
      });
      const data = response.data;

      // Try exact match first
      if (data[modelName]) {
        return { supportsVision: data[modelName]?.supports_vision === true };
      }

      // Try with provider-specific prefixes
      for (const prefix of PROVIDER_PREFIXES[provider]) {
        const key = `${prefix}${modelName}`;
        if (data[key]) {
          return { supportsVision: data[key]?.supports_vision === true };
        }
      }

      // Not found — assume vision is supported (optimistic)
      return { supportsVision: true };
    } catch (err: any) {
      logEveryWhere({
        message: `ModelCapabilityService: failed to fetch LiteLLM data: ${err?.message}`,
      });
      // On network error — assume vision is supported (optimistic)
      return { supportsVision: true };
    }
  };
}

const modelCapabilityService = new ModelCapabilityService();
export const checkModelCapability = modelCapabilityService.checkModelCapability;
