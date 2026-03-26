import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  searchCampaignsTool,
  searchWorkflowsTool,
  checkWorkflowStatusTool,
  getTokenPriceTool,
  webSearchTavilyTool,
  webSearchExaTool,
  webExtractTavilyTool,
  findSimilarExaTool,
  getSolanaTokenBalanceTool,
  getEvmTokenBalanceTool,
} from "@/electron/appAgent/baseTool";
import { listAgentSchedulesTool } from "@/electron/appAgent/baseTool/scheduler";
import { ToolContext } from "@/electron/appAgent/toolContext";
import { registerAgentTaskReadTools } from "./agentTaskTools";

const wrapText = (text: string) => ({
  content: [{ type: "text" as const, text }],
});

const registerReadTools = (server: McpServer) => {
  const searchCampaignsInstance = searchCampaignsTool();
  server.registerTool(
    "search_campaigns",
    {
      description: searchCampaignsInstance.description,
      inputSchema: searchCampaignsInstance.schema.shape,
    },
    async (args: any) =>
      wrapText((await (searchCampaignsInstance.func as any)(args)) as string),
  );

  const searchWorkflowsInstance = searchWorkflowsTool();
  server.registerTool(
    "search_workflows",
    {
      description: searchWorkflowsInstance.description,
      inputSchema: searchWorkflowsInstance.schema.shape,
    },
    async (args: any) =>
      wrapText((await (searchWorkflowsInstance.func as any)(args)) as string),
  );

  const checkWorkflowStatusInstance = checkWorkflowStatusTool();
  server.registerTool(
    "check_workflow_status",
    {
      description: checkWorkflowStatusInstance.description,
      inputSchema: checkWorkflowStatusInstance.schema.shape,
    },
    async (args: any) =>
      wrapText(
        (await (checkWorkflowStatusInstance.func as any)(args)) as string,
      ),
  );

  const listAgentSchedulesInstance = listAgentSchedulesTool();
  server.registerTool(
    "list_agent_schedules",
    {
      description: listAgentSchedulesInstance.description,
      inputSchema: listAgentSchedulesInstance.schema.shape,
    },
    async (args: any) =>
      wrapText(
        (await (listAgentSchedulesInstance.func as any)(args)) as string,
      ),
  );

  const getTokenPriceInstance = getTokenPriceTool();
  server.registerTool(
    "get_token_price",
    {
      description: getTokenPriceInstance.description,
      inputSchema: getTokenPriceInstance.schema.shape,
    },
    async (args: any) =>
      wrapText((await (getTokenPriceInstance.func as any)(args)) as string),
  );

  server.registerTool(
    "get_solana_token_balance",
    {
      description:
        "Get SOL or SPL token balances across wallets in a campaign on Solana",
      inputSchema: {
        campaignId: z.number().describe("Campaign ID containing the wallets"),
        nodeEndpointGroupId: z
          .number()
          .describe("Node endpoint group ID for Solana RPC connections"),
        encryptKey: z
          .string()
          .optional()
          .describe("Encryption key to decrypt wallet data"),
        isAllWallet: z
          .boolean()
          .optional()
          .describe("Use all wallets in campaign (default true)"),
        listCampaignProfileId: z
          .array(z.number())
          .optional()
          .describe(
            "Specific profile IDs to check (when isAllWallet is false)",
          ),
        tokenAddress: z
          .string()
          .optional()
          .describe("SPL mint address, 'SOL', or omit for native SOL balance"),
      },
    },
    async ({
      campaignId,
      nodeEndpointGroupId,
      encryptKey,
      isAllWallet,
      listCampaignProfileId,
      tokenAddress,
    }) => {
      const toolCtx = new ToolContext();
      toolCtx.update({
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet: isAllWallet !== false,
        listCampaignProfileId,
      });
      const result = await (getSolanaTokenBalanceTool(toolCtx).func as any)({
        tokenAddress,
      });
      return wrapText(result as string);
    },
  );

  server.registerTool(
    "get_evm_token_balance",
    {
      description:
        "Get native or ERC-20 token balances across wallets in a campaign on EVM chains",
      inputSchema: {
        campaignId: z.number().describe("Campaign ID containing the wallets"),
        nodeEndpointGroupId: z
          .number()
          .describe("Node endpoint group ID for EVM RPC connections"),
        chainKey: z
          .string()
          .describe(
            "EVM chain key (e.g. 'ethereum', 'bsc', 'base', 'arbitrum', 'polygon')",
          ),
        encryptKey: z
          .string()
          .optional()
          .describe("Encryption key to decrypt wallet data"),
        isAllWallet: z
          .boolean()
          .optional()
          .describe("Use all wallets in campaign (default true)"),
        listCampaignProfileId: z
          .array(z.number())
          .optional()
          .describe(
            "Specific profile IDs to check (when isAllWallet is false)",
          ),
        tokenAddress: z
          .string()
          .optional()
          .describe(
            "ERC-20 token contract address (0x...), or omit for native token balance",
          ),
      },
    },
    async ({
      campaignId,
      nodeEndpointGroupId,
      chainKey,
      encryptKey,
      isAllWallet,
      listCampaignProfileId,
      tokenAddress,
    }) => {
      const toolCtx = new ToolContext();
      toolCtx.update({
        campaignId,
        nodeEndpointGroupId,
        chainKey,
        encryptKey,
        isAllWallet: isAllWallet !== false,
        listCampaignProfileId,
      });
      const result = await (getEvmTokenBalanceTool(toolCtx).func as any)({
        tokenAddress,
      });
      return wrapText(result as string);
    },
  );

  const webSearchTavilyInstance = webSearchTavilyTool();
  server.registerTool(
    "web_search_tavily",
    {
      description: webSearchTavilyInstance.description,
      inputSchema: webSearchTavilyInstance.schema.shape,
    },
    async (args: any) =>
      wrapText((await (webSearchTavilyInstance.func as any)(args)) as string),
  );

  const webSearchExaInstance = webSearchExaTool();
  server.registerTool(
    "web_search_exa",
    {
      description: webSearchExaInstance.description,
      inputSchema: webSearchExaInstance.schema.shape,
    },
    async (args: any) =>
      wrapText((await (webSearchExaInstance.func as any)(args)) as string),
  );

  const webExtractTavilyInstance = webExtractTavilyTool();
  server.registerTool(
    "web_extract_tavily",
    {
      description: webExtractTavilyInstance.description,
      inputSchema: webExtractTavilyInstance.schema.shape,
    },
    async (args: any) =>
      wrapText((await (webExtractTavilyInstance.func as any)(args)) as string),
  );

  const findSimilarExaInstance = findSimilarExaTool();
  server.registerTool(
    "find_similar_exa",
    {
      description: findSimilarExaInstance.description,
      inputSchema: findSimilarExaInstance.schema.shape,
    },
    async (args: any) =>
      wrapText((await (findSimilarExaInstance.func as any)(args)) as string),
  );

  registerAgentTaskReadTools(server);
};

export { registerReadTools };
