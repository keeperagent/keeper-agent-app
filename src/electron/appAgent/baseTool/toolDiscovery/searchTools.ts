import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import {
  BASE_TOOL_REGISTRY,
  BASE_TOOL_GROUP_LABELS,
  BaseToolGroup,
} from "@/electron/appAgent/baseTool/registry";
import { mcpServerDB } from "@/electron/database/mcpServer";
import { safeStringify } from "@/electron/appAgent/utils";

const GROUP_TO_SUBAGENT: Record<BaseToolGroup, string | null> = {
  [BaseToolGroup.APP_MANAGEMENT]: "app_management_agent",
  [BaseToolGroup.TRANSACTION]: "transaction_agent",
  [BaseToolGroup.CODE_EXECUTION]: "code_execution_agent",
  [BaseToolGroup.WORKFLOW]: "workflow_agent",
  [BaseToolGroup.SCHEDULER]: "scheduler_agent",
  [BaseToolGroup.RESEARCH]: "research_agent",
  [BaseToolGroup.AGENT_TASK_MANAGEMENT]: "task_management_agent",
  [BaseToolGroup.AGENT_ORCHESTRATION]: null, // orchestration tools are on the main agent
};

const schema = z.object({
  query: z
    .string()
    .describe(
      "Search keywords describing the capability you need (e.g. 'swap token', 'schedule task', 'web search', 'wallet balance')",
    ),
});

export const searchToolsTool = () =>
  new DynamicStructuredTool({
    name: "search_tools",
    description:
      "Discover available tools and which subagent handles them. Use when you are unsure which subagent to delegate to for a given capability.",
    schema: schema as any,
    func: async ({ query }: { query: string }) => {
      const searchText = query.trim().toLowerCase();
      if (!searchText) {
        return "Query is required. Provide keywords describing the capability you need.";
      }

      const baseResults = BASE_TOOL_REGISTRY.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText) ||
          item.description.toLowerCase().includes(searchText),
      ).map((item) => ({
        type: "base_tool",
        key: item.key,
        name: item.name,
        description: item.description,
        group: BASE_TOOL_GROUP_LABELS[item.group] || item.group,
        subagent: GROUP_TO_SUBAGENT[item.group] || null,
      }));

      // Search MCP servers by name/description (no connection needed)
      const [mcpResult] = await mcpServerDB.getListMcpServer(1, 30, searchText);
      const mcpServers = mcpResult?.data || [];
      const mcpResults = mcpServers
        .filter(
          (server) =>
            server.name?.toLowerCase().includes(searchText) ||
            server.description?.toLowerCase().includes(searchText),
        )
        .map((server) => ({
          type: "mcp_server",
          name: server.name,
          description: server.description || "",
          subagent: server.name,
        }));

      const results = [...baseResults, ...mcpResults];

      return safeStringify({
        query,
        count: results.length,
        results,
        tip:
          results.length === 0
            ? "No tools matched. Try broader keywords or check available subagents."
            : undefined,
      });
    },
  });
