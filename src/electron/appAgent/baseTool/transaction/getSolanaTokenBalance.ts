import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_TYPE } from "@/electron/constant";
import { safeStringify } from "@/electron/appAgent/utils";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { decryptWallet } from "@/electron/service/wallet";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import { ICampaignProfile, IWallet } from "@/electron/type";
import { ToolContext } from "@/electron/appAgent/toolContext";
import { TOOL_KEYS } from "@/electron/constant";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_TOP_N = 5;
const DEFAULT_MAX_WALLETS_IN_RESPONSE = 50;

export const getSolanaTokenBalanceTool = (toolContext?: ToolContext) =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.GET_SOLANA_TOKEN_BALANCE,
    description: `Get SOL or SPL token balances across campaign wallets on Solana.
ONLY use when chainKey from context is "solana". For EVM chains use get_evm_token_balance.

tokenAddress: omit or 'SOL' for native balance, or pass SPL mint address. Extract token address from user prompt — these are mint addresses, NOT wallet addresses. Wallets come from campaign profiles.

Read-only, no confirmation needed. Returns per-wallet balances, totals, and top/lowest lists.
Display: use "SOL" for native, "tokens" for SPL. NEVER show token addresses after amounts.`,
    schema: z.object({
      tokenAddress: z
        .string()
        .describe(
          "SPL mint address, or empty string '' for native SOL balance. Prompt address overrides context.",
        ),
      timeoutMs: z
        .number()
        .positive()
        .describe(`Per-request timeout in ms (default: ${DEFAULT_TIMEOUT_MS})`),
      topN: z
        .number()
        .positive()
        .max(100)
        .describe(
          `Number of wallets in top/bottom lists (default: ${DEFAULT_TOP_N})`,
        ),
      maxWalletsInResponse: z
        .number()
        .positive()
        .max(100)
        .describe(
          `Max wallet entries in response (default: ${DEFAULT_MAX_WALLETS_IN_RESPONSE})`,
        ),
    }),
    func: async ({
      tokenAddress: tokenAddressParam,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      topN = DEFAULT_TOP_N,
      maxWalletsInResponse = DEFAULT_MAX_WALLETS_IN_RESPONSE,
    }) => {
      const effectiveNodeEndpointGroupId = toolContext?.nodeEndpointGroupId;
      const effectiveEncryptKey = toolContext?.encryptKey;
      const effectiveCampaignId = toolContext?.campaignId;
      if (!effectiveCampaignId) {
        throw new Error(
          "campaignId is required. Please provide it from context or specify it explicitly.",
        );
      }

      if (!effectiveNodeEndpointGroupId) {
        throw new Error(
          "nodeEndpointGroupId is required. Please provide it from context or specify it explicitly.",
        );
      }

      const [listNodeEndpoint, errList] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(
          effectiveNodeEndpointGroupId,
        );
      if (errList) throw errList;
      const listNodeProvider =
        listNodeEndpoint
          ?.map((node) => node?.endpoint || "")
          ?.filter((endpoint) => Boolean(endpoint)) || [];
      if (!listNodeProvider.length) {
        throw new Error(
          "The configured node endpoint group has no active endpoints",
        );
      }

      const effectiveIsAllWallet = toolContext?.isAllWallet || false;
      const effectiveListCampaignProfileId =
        toolContext?.listCampaignProfileId || [];

      // Resolve wallets from campaign profiles
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

      const wallets: IWallet[] =
        profiles
          ?.map((profile) => {
            const wallet = profile?.wallet
              ? decryptWallet(profile?.wallet, effectiveEncryptKey || "")
              : profile?.wallet;
            return wallet;
          })
          ?.filter((wallet): wallet is IWallet => Boolean(wallet)) || [];

      if (!wallets.length) {
        throw new Error("No wallets found for the selected campaign profiles");
      }

      // Validate wallet addresses are valid Solana addresses
      const invalidWallets = wallets.filter((wallet) => {
        if (!wallet?.address) return true;
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
          `Invalid wallet addresses detected for Solana chain. Found ${
            invalidWallets.length
          } invalid wallet(s): ${invalidAddresses}${
            invalidWallets.length > 3 ? "..." : ""
          }. Please check: (1) If you provided the correct encryption key, (2) If you selected wallets on the correct chain (Solana). You may have forgotten to switch chains after working on EVM chains.`,
        );
      }

      const solanaProvider = new SolanaProvider();
      // Normalize "SOL" to mean native token. Model-provided value takes priority over context.
      const tokenAddress = tokenAddressParam || toolContext?.tokenAddress;
      console.log(
        `[get_solana_token_balance] input: tokenAddressParam="${tokenAddressParam}" toolContext.tokenAddress="${toolContext?.tokenAddress}" walletCount=${wallets.length}`,
      );
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
          timeoutMs,
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

      const successful = results.filter((r) => !r.error);
      const totalBalance = successful.reduce((sum, r) => sum + r.balance, 0);
      const sortedDesc = [...successful].sort(
        (a, b) => (b.balance || 0) - (a.balance || 0),
      );
      const sortedAsc = [...successful].sort(
        (a, b) => (a.balance || 0) - (b.balance || 0),
      );

      const highest = sortedDesc[0] || null;
      const lowest = sortedAsc[0] || null;

      const topWallets = sortedDesc.slice(0, topN);
      const lowestWallets = sortedAsc.slice(0, topN);

      // Clamp balances returned to avoid flooding UI
      const maxBalances = Math.max(
        1,
        Math.min(maxWalletsInResponse, results.length),
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
      console.log(`[get_solana_token_balance] result: ${toolResult}`);
      return toolResult;
    },
  });
