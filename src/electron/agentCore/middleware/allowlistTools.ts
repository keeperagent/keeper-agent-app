import { createMiddleware } from "langchain";

export const createAllowlistToolsMiddleware = (allowedNames: Set<string>) =>
  createMiddleware({
    name: "AllowlistTools",
    wrapModelCall: async (request: any, handler: any) => {
      const filteredTools = (request.tools || []).filter((tool: any) =>
        allowedNames.has(tool?.name || ""),
      );
      return handler({ ...request, tools: filteredTools });
    },
  });
