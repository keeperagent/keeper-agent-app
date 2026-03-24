import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { walletDB } from "@/electron/database/wallet";
import { walletGroupDB } from "@/electron/database/walletGroup";
import { campaignDB } from "@/electron/database/campaign";
import { preferenceDB } from "@/electron/database/preference";

const registerReadTools = (server: McpServer) => {
  server.registerTool(
    "list_wallet_groups",
    { description: "List all wallet groups in Keeper Agent" },
    async () => {
      const [groups] = await walletGroupDB.getListWalletGroup(1, 15);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(groups?.data || []),
          },
        ],
      };
    },
  );

  server.registerTool(
    "list_wallets",
    {
      description: "List wallets, optionally filtered by wallet group ID",
      inputSchema: {
        groupId: z.number().optional().describe("Wallet group ID to filter by"),
        page: z.number().optional().describe("Page number (default 1)"),
        pageSize: z.number().optional().describe("Page size (default 15)"),
      },
    },
    async ({ groupId, page, pageSize }) => {
      const [result] = await walletDB.getListWallet({
        page: page || 1,
        pageSize: pageSize || 15,
        groupId,
      });

      const wallets = (result?.data || []).map((wallet: any) => ({
        id: wallet.id,
        address: wallet.address,
        groupId: wallet.groupId,
        note: wallet.note,
        typeName: wallet.typeName,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              wallets,
              totalData: result?.totalData || 0,
              totalPage: result?.totalPage || 0,
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "list_campaigns",
    {
      description: "List all automation campaigns in Keeper Agent",
      inputSchema: {
        page: z.number().optional().describe("Page number (default 1)"),
        pageSize: z.number().optional().describe("Page size (default 15)"),
        searchText: z.string().optional().describe("Search by campaign name"),
      },
    },
    async ({ page, pageSize, searchText }) => {
      const [result] = await campaignDB.getListCampaign(
        page || 1,
        pageSize || 15,
        searchText,
      );
      const campaigns = (result?.data || []).map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        note: campaign.note,
        color: campaign.color,
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              campaigns,
              totalData: result?.totalData || 0,
              totalPage: result?.totalPage || 0,
            }),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_preference",
    {
      description:
        "Get Keeper Agent general preferences (LLM provider, chain settings, etc.)",
    },
    async () => {
      const [preference] = await preferenceDB.getOnePreference();
      if (!preference) {
        return {
          content: [{ type: "text" as const, text: "No preference found" }],
        };
      }
      // Only expose safe non-secret fields
      const safePreference = {
        hideMinimap: preference.hideMinimap,
        maxConcurrentJob: preference.maxConcurrentJob,
        openAIModel: preference.openAIModel,
        anthropicModel: preference.anthropicModel,
        googleGeminiModel: preference.googleGeminiModel,
        dayResetJobStatus: preference.dayResetJobStatus,
        maxLogAge: preference.maxLogAge,
        maxHistoryLogAge: preference.maxHistoryLogAge,
      };
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(safePreference),
          },
        ],
      };
    },
  );
};

export { registerReadTools };
