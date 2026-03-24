import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { IMcpToken } from "@/electron/type";
import { showApprovalDialog } from "../approvalDialog";

/**
 * Register write tools (swap, transfer) onto the MCP server.
 * Each tool shows an approval dialog before executing.
 * Only registered for tokens with read-write permission.
 */
const registerWriteTools = (server: McpServer, mcpToken: IMcpToken) => {
  server.registerTool(
    "request_agent_run",
    {
      description:
        "Ask the user to run a specific Keeper Agent registry agent with a prompt",
      inputSchema: {
        agentName: z.string().describe("Name of the agent to run"),
        prompt: z
          .string()
          .describe("Prompt or instruction to send to the agent"),
      },
    },
    async ({ agentName, prompt }) => {
      const argsText = `Agent: ${agentName}\nPrompt: ${prompt}`;
      const approval = await showApprovalDialog(
        mcpToken.name!,
        "request_agent_run",
        "Run a Keeper Agent with the given prompt",
        argsText,
      );

      if (approval === "denied") {
        return {
          content: [
            {
              type: "text" as const,
              text: "Action denied by user.",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Approval granted. Agent "${agentName}" should be triggered via the Keeper Agent UI with prompt: ${prompt}`,
          },
        ],
      };
    },
  );
};

export { registerWriteTools };
