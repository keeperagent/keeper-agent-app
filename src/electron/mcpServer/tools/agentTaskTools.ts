import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AppLogType,
  AppLogActorType,
  IMcpToken,
  AppLogTaskAction,
} from "@/electron/type";
import {
  listAgentTasksTool,
  getAgentTaskTool,
  createAgentTaskTool,
  updateAgentTaskTool,
} from "@/electron/agentCore/baseTool/agentTask";
import { appLogDB } from "@/electron/database/appLog";
import { showApprovalDialog, ApprovalResult } from "../approvalDialog";

const wrapText = (text: string) => ({
  content: [{ type: "text" as const, text }],
});

const DENIED_RESPONSE = wrapText("Action denied by user.");

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
    async (args: any) => wrapText((await listInstance.invoke(args)).toString()),
  );

  const getOneInstance = getAgentTaskTool();
  server.registerTool(
    "get_task",
    {
      description: getOneInstance.description,
      inputSchema: getOneInstance.schema.shape,
    },
    async (args: any) =>
      wrapText((await getOneInstance.invoke(args)).toString()),
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
      const approved = approval !== ApprovalResult.DENIED;
      appLogDB.createAppLog({
        logType: AppLogType.MCP,
        actorType: AppLogActorType.MCP,
        actorName: displayName,
        action: AppLogTaskAction.TASK_CREATED,
        status: approved ? ApprovalResult.APPROVED : ApprovalResult.DENIED,
        message: formatArgs(args).substring(0, 500),
        startedAt: Date.now(),
      });
      if (!approved) {
        return DENIED_RESPONSE;
      }
      const result = (await createInstance.invoke(args)).toString();
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
      const approved = approval !== ApprovalResult.DENIED;
      appLogDB.createAppLog({
        logType: AppLogType.MCP,
        actorType: AppLogActorType.MCP,
        actorName: displayName,
        action: AppLogTaskAction.TASK_UPDATED,
        status: approved ? ApprovalResult.APPROVED : ApprovalResult.DENIED,
        message: formatArgs(args).substring(0, 500),
        startedAt: Date.now(),
      });
      if (!approved) {
        return DENIED_RESPONSE;
      }
      const result = (await updateInstance.invoke(args)).toString();
      return wrapText(result as string);
    },
  );
};
