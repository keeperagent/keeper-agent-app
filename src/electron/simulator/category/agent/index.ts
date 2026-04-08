import { ChatOpenAI, tools } from "@langchain/openai";
import path from "path";
import { ensureDirSync, writeFile } from "fs-extra";
import {
  LLMProvider,
  OPENAI_IMAGE_QUALITY,
  OPENAI_IMAGE_SIZE,
  GOOGLE_IMAGE_ASPECT_RATIO,
} from "@/electron/type";

type AgentConfig = {
  model?: string;
};

export class SimpleAgent {
  private readonly config: AgentConfig;

  constructor(config?: AgentConfig) {
    this.config = config || {};
  }

  generateImage = async (
    prompt: string,
    folderPath: string,
    fileName: string,
    provider: LLMProvider,
    apiKey: string,
    size: OPENAI_IMAGE_SIZE,
    quality: OPENAI_IMAGE_QUALITY,
    aspectRatio: GOOGLE_IMAGE_ASPECT_RATIO,
  ): Promise<[string | null, Error | null]> => {
    try {
      if (!prompt || !prompt.trim()) {
        throw new Error("prompt is required");
      }
      if (!folderPath || !folderPath.trim()) {
        throw new Error("folderPath is required");
      }
      if (!fileName || !fileName.trim()) {
        throw new Error("fileName is required");
      }
      if (!apiKey || !apiKey.trim()) {
        throw new Error("apiKey is required");
      }

      if (provider === LLMProvider.GEMINI) {
        return this.generateImageWithGoogle(
          prompt,
          folderPath,
          fileName,
          apiKey,
          this.config.model || "imagen-3.0-generate-001",
          aspectRatio || GOOGLE_IMAGE_ASPECT_RATIO.SQUARE,
        );
      }

      return this.generateImageWithOpenAI(
        prompt,
        folderPath,
        fileName,
        apiKey,
        size,
        quality,
      );
    } catch (err: any) {
      return [null, err];
    }
  };

  private generateImageWithOpenAI = async (
    prompt: string,
    folderPath: string,
    fileName: string,
    apiKey: string,
    size: OPENAI_IMAGE_SIZE,
    quality: OPENAI_IMAGE_QUALITY,
  ): Promise<[string | null, Error | null]> => {
    try {
      const model = new ChatOpenAI({
        apiKey,
        modelName: this.config.model || "gpt-4o-mini",
        temperature: 0.35,
        maxTokens: 3000,
      });

      const response = await model.invoke(prompt, {
        tools: [
          tools.imageGeneration({ size: size as any, quality: quality as any }),
        ],
      });

      const imageOutput = (
        response as any
      )?.additional_kwargs?.tool_outputs?.find(
        (output: any) => output?.type === "image_generation_call",
      );

      if (!imageOutput) {
        return [null, new Error("No image output returned")];
      }

      const outputDir = path.resolve(folderPath);
      ensureDirSync(outputDir);
      const targetPath = path.join(
        outputDir,
        fileName.toLowerCase().endsWith(".png") ? fileName : `${fileName}.png`,
      );
      await writeFile(targetPath, Buffer.from(imageOutput.result, "base64"));
      return [targetPath, null];
    } catch (err: any) {
      return [null, err];
    }
  };

  private generateImageWithGoogle = async (
    prompt: string,
    folderPath: string,
    fileName: string,
    apiKey: string,
    model: string,
    aspectRatio: GOOGLE_IMAGE_ASPECT_RATIO,
  ): Promise<[string | null, Error | null]> => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1, aspectRatio },
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Google Imagen API error ${response.status}: ${errorBody}`,
        );
      }

      const data: any = await response.json();
      const base64Image = data?.predictions?.[0]?.bytesBase64Encoded;

      if (!base64Image) {
        throw new Error("No image returned from Google Imagen API");
      }

      const outputDir = path.resolve(folderPath);
      ensureDirSync(outputDir);
      const targetPath = path.join(
        outputDir,
        fileName.toLowerCase().endsWith(".png") ? fileName : `${fileName}.png`,
      );
      await writeFile(targetPath, Buffer.from(base64Image, "base64"));
      return [targetPath, null];
    } catch (err: any) {
      return [null, err];
    }
  };
}
