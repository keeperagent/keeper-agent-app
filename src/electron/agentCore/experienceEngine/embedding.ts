import path from "path";
import { app } from "electron";
import { logEveryWhere } from "@/electron/service/util";

class EmbeddingModel {
  private embedder: any = null;

  private getEmbedder = async () => {
    if (this.embedder) {
      return this.embedder;
    }
    const { pipeline, env } = await import("@xenova/transformers");
    env.cacheDir = path.join(app.getPath("userData"), "models");
    this.embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
    logEveryWhere({ message: "[Embedding] Model loaded: all-MiniLM-L6-v2" });
    return this.embedder;
  };

  embed = async (text: string): Promise<number[]> => {
    const embedder = await this.getEmbedder();
    const output = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(output.data) as number[];
  };
}

export const embeddingModel = new EmbeddingModel();
