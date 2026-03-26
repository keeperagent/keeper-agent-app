import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IMcpToken } from "@/electron/type";
import {
  listAgentTasksTool,
  getAgentTaskTool,
  createAgentTaskTool,
  updateAgentTaskTool,
} from "@/electron/appAgent/baseTool/agentTask";
import { showApprovalDialog } from "../approvalDialog";

const DENIED_RESPONSE = {
  content: [{ type: "text" as const, text: "Action denied by user." }],
};

const wrapText = (text: string) => ({
  content: [{ type: "text" as const, text }],
});

const formatArgs = (args: Record<string, unknown>) =>
  Object.entries(args)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");

export const registerAgentTaskReadTools = (server: McpServer) => {
  const listInstance = listAgentTasksTool();
  server.registerTool(
    "list_tasks",
    {
      description: listInstance.description,
      inputSchema: listInstance.schema.shape,
    },
    async (args: any) =>
      wrapText((await (listInstance.func as any)(args)) as string),
  );

  const getOneInstance = getAgentTaskTool();
  server.registerTool(
    "get_task",
    {
      description: getOneInstance.description,
      inputSchema: getOneInstance.schema.shape,
    },
    async (args: any) =>
      wrapText((await (getOneInstance.func as any)(args)) as string),
  );
};

export const registerAgentTaskWriteTools = (
  server: McpServer,
  mcpToken: IMcpToken,
) => {
  const displayName = mcpToken.name || "External agent";

  const createInstance = createAgentTaskTool();
  server.registerTool(
    "create_task",
    {
      description: createInstance.description,
      inputSchema: createInstance.schema.shape,
    },
    async (args: any) => {
      const approval = await showApprovalDialog(
        displayName,
        "create_task",
        createInstance.description,
        formatArgs(args),
      );
      if (approval === "denied") {
        return DENIED_RESPONSE;
      }
      const result = await (createInstance.func as any)(args);
      return wrapText(result as string);
    },
  );

  const updateInstance = updateAgentTaskTool();
  server.registerTool(
    "update_task",
    {
      description: updateInstance.description,
      inputSchema: updateInstance.schema.shape,
    },
    async (args: any) => {
      const approval = await showApprovalDialog(
        displayName,
        "update_task",
        updateInstance.description,
        formatArgs(args),
      );
      if (approval === "denied") {
        return DENIED_RESPONSE;
      }
      const result = await (updateInstance.func as any)(args);
      return wrapText(result as string);
    },
  );
};
