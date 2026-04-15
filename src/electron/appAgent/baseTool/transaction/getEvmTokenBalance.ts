import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ethers } from "ethers";
import { TOKEN_TYPE, KYBERSWAP_CHAIN_KEY } from "@/electron/constant";
import {
  safeStringify,
  capitalizeFirstLetter,
} from "@/electron/appAgent/utils";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { decryptWallet } from "@/electron/service/wallet";
import { EVMProvider } from "@/electron/simulator/category/onchain/evm";
import { ICampaignProfile, IWallet } from "@/electron/type";
import { mapNativeTokenName } from "./swapOnKyberswap";
import { ToolContext } from "@/electron/appAgent/toolContext";
import { TOOL_KEYS } from "@/electron/constant";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_TOP_N = 5;
const DEFAULT_MAX_WALLETS_IN_RESPONSE = 50;

export const getEvmTokenBalanceTool = (toolContext?: ToolContext) =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.GET_EVM_TOKEN_BALANCE,
    description: `Get native token or ERC20 balances across campaign wallets on EVM chains.
ONLY use when chainKey from context is an EVM chain. For Solana use get_solana_token_balance.

tokenAddress: omit for native balance (ETH, BNB, etc.), or pass ERC20 contract address (0x format). Extract token address from user prompt — these are contract addresses, NOT wallet addresses. Wallets come from campaign profiles.

Read-only, no confirmation needed. Returns per-wallet balances, totals, and top/lowest lists.
Display: native token symbol for native, "tokens" for ERC20. NEVER show token addresses after amounts.`,
    schema: z.object({
      tokenAddress: z
        .string()
        .optional()
        .describe(
          "ERC20 contract address (0x format), or omit for native balance. Prompt address overrides context.",
        ),
      timeoutMs: z
        .number()
        .positive()
        .default(DEFAULT_TIMEOUT_MS)
        .optional()
        .describe("Per-request timeout in ms"),
      topN: z
        .number()
        .positive()
        .max(100)
        .default(DEFAULT_TOP_N)
        .optional()
        .describe("Number of wallets in top/bottom lists"),
      maxWalletsInResponse: z
        .number()
        .positive()
        .max(100)
        .default(DEFAULT_MAX_WALLETS_IN_RESPONSE)
        .optional()
        .describe("Max wallet entries in response"),
    }),
    func: async ({
      tokenAddress: tokenAddressParam,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      topN = DEFAULT_TOP_N,
      maxWalletsInResponse = DEFAULT_MAX_WALLETS_IN_RESPONSE,
    }) => {
      const chainKey = toolContext?.chainKey as KYBERSWAP_CHAIN_KEY;
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

      // Validate wallet addresses are valid EVM addresses
      const invalidWallets = wallets.filter((wallet) => {
        if (!wallet?.address) return true;
        return !ethers.utils.isAddress(wallet.address);
      });

      if (invalidWallets.length > 0) {
        const invalidAddresses = invalidWallets
          .map((w) => w?.address || "unknown")
          .slice(0, 3)
          .join(", ");
        throw new Error(
          `Invalid wallet addresses detected for EVM chain (${chainKey}). Found ${
            invalidWallets.length
          } invalid wallet(s): ${invalidAddresses}${
            invalidWallets.length > 3 ? "..." : ""
          }. Please check: (1) If you provided the correct encryption key, (2) If you selected wallets on the correct chain (${chainKey}). You may have forgotten to switch chains after working on Solana.`,
        );
      }

      const evmProvider = new EVMProvider();

      // Normalize token address - if it's a valid EVM address (0x hex format), use it; otherwise treat as native token
      // Model-provided value takes priority over context.
      const tokenAddress = tokenAddressParam || toolContext?.tokenAddress;
      const trimmedTokenAddress = tokenAddress?.trim() || "";
      const isValidEvmAddress =
        trimmedTokenAddress && ethers.utils.isAddress(trimmedTokenAddress);

      // Only use tokenAddress if it's a valid EVM address (0x...), otherwise treat as native token balance
      const normalizedTokenAddress = isValidEvmAddress
        ? trimmedTokenAddress
        : "";

      const tokenType = normalizedTokenAddress
        ? TOKEN_TYPE.EVM_ERC20_TOKEN
        : TOKEN_TYPE.NATIVE_TOKEN;
      const resolvedTokenAddress = normalizedTokenAddress;

      const nativeTokenName = mapNativeTokenName[chainKey] || "native";

      const results: Array<{
        wallet: string;
        balance: number;
        error?: string;
      }> = [];

      for (const wallet of wallets) {
        const [balanceStr, errBalance] = await evmProvider.getWalletBalance(
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

      return safeStringify({
        chain: capitalizeFirstLetter(chainKey),
        token: resolvedTokenAddress || nativeTokenName,
        tokenType: resolvedTokenAddress ? "ERC20" : nativeTokenName,
        walletCount: wallets.length,
        totalBalance,
        highest,
        lowest,
        topWallets,
        lowestWallets,
        balances: balancesSample,
        omittedCount,
      });
    },
  });
