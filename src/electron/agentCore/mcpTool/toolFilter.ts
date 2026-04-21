import { DynamicStructuredTool } from "@langchain/core/tools";
import { embeddingModel } from "@/electron/agentCore/experienceEngine/embedding";

export const MCP_TOOL_FILTER_K = 5;

const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
};

// Persists across calls within a session — tools are re-embedded at most once per 8h cache cycle
const toolEmbeddingCache = new Map<string, number[]>();

const getToolEmbedding = async (
  tool: DynamicStructuredTool,
): Promise<number[]> => {
  const cached = toolEmbeddingCache.get(tool.name);
  if (cached) {
    return cached;
  }

  const text = `${tool.name}: ${tool.description || ""}`;
  const embedding = await embeddingModel.embed(text);
  toolEmbeddingCache.set(tool.name, embedding);
  return embedding;
};

export const filterMcpTools = async (
  tools: DynamicStructuredTool[],
  query: string,
): Promise<DynamicStructuredTool[]> => {
  if (tools.length <= MCP_TOOL_FILTER_K) {
    return tools;
  }

  const [queryEmbedding, ...toolEmbeddings] = await Promise.all([
    embeddingModel.embed(query),
    ...tools.map(getToolEmbedding),
  ]);

  const scored = tools.map((tool, index) => ({
    tool,
    score: cosineSimilarity(queryEmbedding, toolEmbeddings[index]),
  }));
  scored.sort((scoredA, scoredB) => scoredB.score - scoredA.score);

  return scored.slice(0, MCP_TOOL_FILTER_K).map((scored) => scored.tool);
};
