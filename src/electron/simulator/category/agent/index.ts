import { ChatOpenAI, tools } from "@langchain/openai";
import path from "path";
import { ensureDirSync, writeFile } from "fs-extra";
import { getOpenAIKey } from "@/electron/appAgent/utils";
import { OPENAI_IMAGE_QUALITY, OPENAI_IMAGE_SIZE } from "@/electron/type";

type AgentConfig = {
  model?: string;
};

export class SimpleAgent {
  private readonly config: AgentConfig;

  constructor(config?: AgentConfig) {
    this.config = config || {};
  }

  private buildModel = async (): Promise<ChatOpenAI> => {
    const [apiKey] = await getOpenAIKey();
    if (!apiKey) {
      throw new Error(
        "OpenAI key is not found, please set it in the Settings page",
      );
    }

    return new ChatOpenAI({
      apiKey,
      modelName: this.config.model || "gpt-4o-mini",
      temperature: 0.35,
      maxTokens: 3000,
    });
  };

  askAgent = async (prompt: string): Promise<[string | null, Error | null]> => {
    try {
      if (!prompt || !prompt.trim()) {
        throw new Error("prompt is required");
      }

      const model = await this.buildModel();
      const res = await model.invoke(prompt);

      if (typeof res.content === "string") {
        return [res.content, null];
      }

      if (Array.isArray(res.content)) {
        const content = res.content
          .map((part: any) => {
            if (typeof part === "string") return part;
            if (part?.text) return part.text;
            if (part?.type === "text" && part?.data?.content) {
              return part.data.content;
            }
            return "";
          })
          .join("")
          .trim();
        return [content, null];
      }

      return ["", null];
    } catch (err: any) {
      return [null, err];
    }
  };

  generateImage = async (
    prompt: string,
    folderPath: string,
    fileName: string,
    size: OPENAI_IMAGE_SIZE,
    quality: OPENAI_IMAGE_QUALITY,
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

      const model = await this.buildModel();
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
}
