import { createMiddleware } from "langchain";
import { filterMcpTools } from "@/electron/agentCore/mcpTool/toolFilter";

const extractQueryFromMessages = (messages: any[]): string => {
  const firstHuman = messages.find(
    (message) => message?._getType?.() === "human",
  );
  if (!firstHuman) {
    return "";
  }

  const content = firstHuman.content;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter(
        (chunk: any) => chunk?.type === "text" || typeof chunk === "string",
      )
      .map((chunk: any) =>
        typeof chunk === "string" ? chunk : chunk.text || "",
      )
      .join(" ");
  }
  return "";
};

export const createMcpToolFilterMiddleware = () =>
  createMiddleware({
    name: "McpToolFilter",
    wrapModelCall: async (request: any, handler: any) => {
      const tools: any[] = request?.tools || [];
      const query = extractQueryFromMessages(request?.messages || []);

      if (!query) {
        return handler(request);
      }

      const filteredTools = await filterMcpTools(tools, query);
      return handler({ ...request, tools: filteredTools });
    },
  });
