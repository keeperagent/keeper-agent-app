import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_TYPE, CHAIN_TYPE } from "@/electron/constant";
import { safeStringify } from "@/electron/agentCore/utils";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { nodeEndpointGroupDB } from "@/electron/database/nodeEndpointGroup";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { decryptWallet } from "@/electron/service/wallet";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import { ICampaignProfile, IWallet } from "@/electron/type";
import { ToolContext } from "@/electron/agentCore/toolContext";
import { TOOL_KEYS } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_TOP_N = 5;
const DEFAULT_MAX_WALLETS_IN_RESPONSE = 50;

const resolveNodeProviders = async (
  nodeEndpointGroupId?: number,
): Promise<string[]> => {
  if (nodeEndpointGroupId) {
    const [listNodeEndpoint, errList] =
      await nodeEndpointDB.getListNodeEndpointByGroupId(nodeEndpointGroupId);
    if (errList) throw errList;
    return (
      listNodeEndpoint?.map((node) => node?.endpoint || "")?.filter(Boolean) ||
      []
    );
  }

  const [groupsRes, errGroups] =
    await nodeEndpointGroupDB.getListNodeEndpointGroup(
      1,
      5,
      undefined,
      CHAIN_TYPE.SOLANA,
    );
  if (errGroups) {
    throw errGroups;
  }
  const solanaGroup = groupsRes?.data?.[0];
  if (!solanaGroup?.id) {
    throw new Error(
      "No Solana node endpoint group found. Please configure one in Node Endpoints settings.",
    );
  }

  const [listNodeEndpoint, errList] =
    await nodeEndpointDB.getListNodeEndpointByGroupId(solanaGroup.id);
  if (errList) throw errList;
  return (
    listNodeEndpoint?.map((node) => node?.endpoint || "")?.filter(Boolean) || []
  );
};

export const getSolanaTokenBalanceTool = (toolContext?: ToolContext) =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.GET_SOLANA_TOKEN_BALANCE,
    description:
      "Get SOL or SPL token balance for any Solana wallet address. Only tokenAddress and walletAddresses are needed — do NOT ask for campaignId, nodeEndpointGroupId, or encryptKey. Read-only, no confirmation needed.",
    schema: z.object({
      tokenAddress: z
        .string()
        .describe("SPL mint address or empty for native SOL"),
      walletAddresses: z
        .array(z.string())
        .nullish()
        .describe(
          "Solana wallet addresses to query, or null/undefined to use campaign context",
        ),
    }),
    func: async ({ tokenAddress: tokenAddressParam, walletAddresses }) => {
      const effectiveEncryptKey = toolContext?.encryptKey;
      const effectiveCampaignId = toolContext?.campaignId;

      // Resolve node providers — fall back to first Solana group in DB
      const listNodeProvider = await resolveNodeProviders(
        toolContext?.nodeEndpointGroupId,
      );
      if (!listNodeProvider.length) {
        throw new Error(
          "The configured node endpoint group has no active endpoints",
        );
      }

      // Resolve wallets — schema walletAddresses takes priority over campaign context
      let wallets: IWallet[] = [];

      if (walletAddresses && walletAddresses.length > 0) {
        wallets = walletAddresses.map((address) => ({ address }));
      } else {
        if (!effectiveCampaignId) {
          throw new Error(
            "Either walletAddresses or campaignId (via context) is required.",
          );
        }

        const effectiveIsAllWallet = toolContext?.isAllWallet || false;
        const effectiveListCampaignProfileId =
          toolContext?.listCampaignProfileId || [];

        let profiles: ICampaignProfile[] = [];
        if (effectiveIsAllWallet) {
          const [allProfiles, errAll] =
            await campaignProfileDB.getAllProfileOfCampaign(
              effectiveCampaignId,
              true,
            );
          if (errAll) throw errAll;
          profiles = allProfiles || [];
        } else {
          if (!effectiveListCampaignProfileId.length) {
            throw new Error(
              "listCampaignProfileId is required when isAllWallet is false",
            );
          }
          const [resProfiles, errListProfiles] =
            await campaignProfileDB.getListCampaignProfile({
              page: 1,
              pageSize: effectiveListCampaignProfileId.length,
              campaignId: effectiveCampaignId,
              listId: effectiveListCampaignProfileId,
            });
          if (errListProfiles) throw errListProfiles;
          profiles = resProfiles?.data || [];
        }

        wallets =
          profiles
            ?.map((profile) => {
              const wallet = profile?.wallet
                ? decryptWallet(profile?.wallet, effectiveEncryptKey || "")
                : profile?.wallet;
              return wallet;
            })
            ?.filter((wallet): wallet is IWallet => Boolean(wallet)) || [];
      }

      if (!wallets.length) {
        throw new Error("No wallets found");
      }

      // Validate wallet addresses are valid Solana addresses
      const invalidWallets = wallets.filter((wallet) => {
        if (!wallet?.address) {
          return true;
        }
        try {
          new PublicKey(wallet.address);
          return false;
        } catch {
          return true;
        }
      });

      if (invalidWallets.length > 0) {
        const invalidAddresses = invalidWallets
          .map((w) => w?.address || "unknown")
          .slice(0, 3)
          .join(", ");
        throw new Error(
          `Invalid Solana wallet addresses. Found ${invalidWallets.length} invalid wallet(s): ${invalidAddresses}${
            invalidWallets.length > 3 ? "..." : ""
          }`,
        );
      }

      const solanaProvider = new SolanaProvider();
      const tokenAddress = tokenAddressParam || toolContext?.tokenAddress;
      const normalizedTokenAddress =
        tokenAddress?.trim().toUpperCase() === "SOL"
          ? ""
          : tokenAddress?.trim() || "";

      const tokenType = normalizedTokenAddress
        ? TOKEN_TYPE.SOLANA_TOKEN
        : TOKEN_TYPE.NATIVE_TOKEN;
      const resolvedTokenAddress = normalizedTokenAddress;

      const results: Array<{
        wallet: string;
        balance: number;
        error?: string;
      }> = [];

      for (const wallet of wallets) {
        const [balanceStr, errBalance] = await solanaProvider.getWalletBalance(
          listNodeProvider,
          tokenType,
          wallet?.address || "",
          resolvedTokenAddress,
          DEFAULT_TIMEOUT_MS,
        );
        if (errBalance) {
          results.push({
            wallet: wallet?.address || "",
            balance: 0,
            error: errBalance.message || String(errBalance),
          });
          continue;
        }

        const balanceNum = Number(balanceStr || 0);
        results.push({
          wallet: wallet?.address || "",
          balance: balanceNum,
        });
      }

      const successful = results.filter((result) => !result.error);
      const totalBalance = successful.reduce(
        (sum, result) => sum + result.balance,
        0,
      );
      const sortedDesc = [...successful].sort(
        (a, b) => (b.balance || 0) - (a.balance || 0),
      );
      const sortedAsc = [...successful].sort(
        (a, b) => (a.balance || 0) - (b.balance || 0),
      );

      const highest = sortedDesc[0] || null;
      const lowest = sortedAsc[0] || null;
      const topWallets = sortedDesc.slice(0, DEFAULT_TOP_N);
      const lowestWallets = sortedAsc.slice(0, DEFAULT_TOP_N);

      const maxBalances = Math.max(
        1,
        Math.min(DEFAULT_MAX_WALLETS_IN_RESPONSE, results.length),
      );
      const balancesSample = results.slice(0, maxBalances);
      const omittedCount = Math.max(0, results.length - maxBalances);

      const toolResult = safeStringify({
        chain: "Solana",
        token: resolvedTokenAddress || "SOL",
        tokenType: resolvedTokenAddress ? "SPL" : "SOL",
        walletCount: wallets.length,
        totalBalance,
        highest,
        lowest,
        topWallets,
        lowestWallets,
        balances: balancesSample,
        omittedCount,
      });
      logEveryWhere({
        message: `[get_solana_token_balance] result: ${toolResult}`,
      });
      return toolResult;
    },
  });
