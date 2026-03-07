import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import Big from "big.js";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { TOKEN_TYPE } from "@/electron/constant";
import { ICampaignProfile, IWallet } from "@/electron/type";
import { safeStringify } from "@/electron/appAgent/utils";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { decryptWallet } from "@/electron/service/wallet";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import { logEveryWhere } from "@/electron/service/util";
import { redistributeToCapacity, extractErrorMessage } from "./utils";
import { ToolContext } from "@/electron/appAgent/toolContext";

const GAS_BUFFER_SOL = 0.0005;

const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export const transferSolanaTokenTool = (toolContext?: ToolContext) =>
  new DynamicStructuredTool({
    name: "transfer_solana_token",
    description: `Transfer native SOL or any SPL token on Solana from a source wallet to target wallets in a campaign.

The source wallet must be a wallet in the campaign. Target wallets are all other wallets in the campaign (the source wallet is excluded automatically).

Transfer strategies:
- EQUAL_PER_WALLET: Send the same amount to each target wallet (requires amount).
- RANDOM_PER_WALLET: Send a random amount per target wallet within [minAmount, maxAmount] (requires maxAmount).
- TOTAL_SPLIT_RANDOM: Split a total amount randomly across all target wallets (requires totalAmount).

For native SOL transfers, omit tokenAddress or pass it empty. For SPL tokens, provide the token mint address.

CRITICAL - Confirmation Required:
- ALWAYS ask the user for explicit confirmation before calling this tool. Show: Token, Source wallet, Amount strategy, Amount details, Target wallet count.
- Only call this tool after the user explicitly confirms.`,
    schema: z.object({
      sourceWalletAddress: z
        .string()
        .describe(
          "Solana address of the source wallet (must belong to the campaign). Funds will be sent FROM this wallet.",
        ),
      tokenAddress: z
        .string()
        .optional()
        .describe(
          "SPL token mint address to transfer. Omit or leave empty for native SOL.",
        ),
      amountStrategy: z
        .enum(["EQUAL_PER_WALLET", "RANDOM_PER_WALLET", "TOTAL_SPLIT_RANDOM"])
        .describe("How to distribute amounts across target wallets."),
      amount: z
        .number()
        .positive()
        .optional()
        .describe("Per-wallet amount (required for EQUAL_PER_WALLET)."),
      totalAmount: z
        .number()
        .positive()
        .optional()
        .describe(
          "Total amount to split across all target wallets (required for TOTAL_SPLIT_RANDOM).",
        ),
      minAmount: z
        .number()
        .positive()
        .optional()
        .describe(
          "Minimum per-wallet amount (optional for RANDOM_PER_WALLET).",
        ),
      maxAmount: z
        .number()
        .positive()
        .optional()
        .describe(
          "Maximum per-wallet amount (required for RANDOM_PER_WALLET).",
        ),
      balanceTimeoutMs: z
        .number()
        .positive()
        .default(15000)
        .optional()
        .describe("Timeout (ms) when fetching wallet balances."),
    }),
    func: async ({
      sourceWalletAddress,
      tokenAddress,
      amountStrategy,
      amount,
      totalAmount,
      minAmount,
      maxAmount,
      balanceTimeoutMs = 15000,
    }) => {
      const effectiveNodeEndpointGroupId = toolContext?.nodeEndpointGroupId;
      const effectiveEncryptKey = toolContext?.encryptKey;
      const effectiveCampaignId = toolContext?.campaignId;

      if (!effectiveNodeEndpointGroupId) {
        throw new Error(
          "nodeEndpointGroupId is required. Please provide it from context or specify it explicitly.",
        );
      }

      if (!isValidSolanaAddress(sourceWalletAddress)) {
        throw new Error(
          `Invalid source wallet address: ${sourceWalletAddress}`,
        );
      }

      if (tokenAddress && !isValidSolanaAddress(tokenAddress)) {
        throw new Error(`Invalid token mint address: ${tokenAddress}`);
      }

      const [listNodeEndpoint, errList] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(
          effectiveNodeEndpointGroupId,
        );
      if (errList) throw errList;
      const listNodeProvider =
        listNodeEndpoint
          ?.map((node) => node?.endpoint || "")
          ?.filter(Boolean) || [];
      if (!listNodeProvider.length) {
        throw new Error(
          "The configured node endpoint group has no active endpoints.",
        );
      }

      if (!effectiveCampaignId) {
        throw new Error(
          "campaignId is required. Please provide it from context or specify it explicitly.",
        );
      }

      // Fetch all campaign profiles
      const [allProfiles, errAll] =
        await campaignProfileDB.getAllProfileOfCampaign(
          effectiveCampaignId,
          true,
        );
      if (errAll) throw errAll;
      const profiles: ICampaignProfile[] = allProfiles || [];
      if (!profiles.length) {
        throw new Error("No profiles found for this campaign.");
      }

      // Decrypt wallets
      const allWallets: Array<{ wallet: IWallet; profile: ICampaignProfile }> =
        profiles
          .map((profile) => {
            const wallet = profile?.wallet
              ? decryptWallet(profile.wallet, effectiveEncryptKey || "")
              : profile?.wallet;
            return wallet ? { wallet, profile } : null;
          })
          .filter(
            (entry): entry is { wallet: IWallet; profile: ICampaignProfile } =>
              Boolean(entry),
          );

      // Find source wallet
      const sourceEntry = allWallets.find(
        (e) =>
          e.wallet.address?.toLowerCase() === sourceWalletAddress.toLowerCase(),
      );
      if (!sourceEntry) {
        throw new Error(
          `Source wallet ${sourceWalletAddress} not found in campaign ${effectiveCampaignId}.`,
        );
      }
      if (!sourceEntry.wallet.privateKey) {
        throw new Error(
          "Source wallet private key is unavailable. Check your encryption key.",
        );
      }

      // Target wallets: all wallets in campaign except source
      const targetWallets = allWallets
        .filter(
          (e) =>
            e.wallet.address?.toLowerCase() !==
            sourceWalletAddress.toLowerCase(),
        )
        .map((e) => e.wallet);

      if (!targetWallets.length) {
        throw new Error(
          "No target wallets found in the campaign (excluding the source wallet).",
        );
      }

      // Validate all target addresses
      const invalidTargets = targetWallets.filter(
        (w) => !w.address || !isValidSolanaAddress(w.address),
      );
      if (invalidTargets.length) {
        throw new Error(
          `${invalidTargets.length} target wallet(s) have invalid Solana addresses. Check encryption key and chain selection.`,
        );
      }

      const isNative = !tokenAddress || tokenAddress.trim() === "";
      const tokenType = isNative
        ? TOKEN_TYPE.NATIVE_TOKEN
        : TOKEN_TYPE.SOLANA_TOKEN;
      const solanaProvider = new SolanaProvider();

      // Fetch source wallet balance
      logEveryWhere({
        message: `[Agent] Fetching ${isNative ? "SOL" : "token"} balance for source wallet ${sourceWalletAddress}`,
      });
      let sourceBalanceStr: string | null = null;
      if (isNative) {
        const [bal, balErr] = await solanaProvider.getNativeBalance(
          sourceWalletAddress,
          listNodeProvider,
          balanceTimeoutMs,
        );
        if (balErr) throw balErr;
        sourceBalanceStr = bal;
      } else {
        const [bal, balErr] = await solanaProvider.getWalletBalance(
          listNodeProvider,
          TOKEN_TYPE.SOLANA_TOKEN,
          sourceWalletAddress,
          tokenAddress!.trim(),
          balanceTimeoutMs,
        );
        if (balErr) throw balErr;
        sourceBalanceStr = bal;
      }

      const sourceBalance = Number(sourceBalanceStr || "0");
      const sourceAvailable = isNative
        ? Math.max(
            new Big(sourceBalanceStr || "0").minus(GAS_BUFFER_SOL).toNumber(),
            0,
          )
        : sourceBalance;

      if (sourceAvailable <= 0) {
        throw new Error(
          `Source wallet has insufficient ${isNative ? "SOL (after gas buffer)" : "token"} balance.`,
        );
      }

      // Calculate per-wallet amounts
      const count = targetWallets.length;
      const randBetween = (min: number, max: number) =>
        min + Math.random() * (max - min);

      let plannedAmounts: number[];
      if (amountStrategy === "EQUAL_PER_WALLET") {
        if (!amount || amount <= 0) {
          throw new Error("amount must be > 0 for EQUAL_PER_WALLET.");
        }
        plannedAmounts = Array(count).fill(amount);
      } else if (amountStrategy === "RANDOM_PER_WALLET") {
        if (!maxAmount || maxAmount <= 0) {
          throw new Error(
            "maxAmount is required and must be > 0 for RANDOM_PER_WALLET.",
          );
        }
        const min = minAmount || 0;
        const max = Math.max(maxAmount, min);
        plannedAmounts =
          max === min
            ? Array(count).fill(min)
            : Array.from({ length: count }, () => randBetween(min, max));
      } else {
        // TOTAL_SPLIT_RANDOM
        if (!totalAmount || totalAmount <= 0) {
          throw new Error("totalAmount must be > 0 for TOTAL_SPLIT_RANDOM.");
        }
        const weights = Array.from(
          { length: count },
          () => Math.random() || 0.0001,
        );
        const weightSum = weights.reduce((a, b) => a + b, 0);
        plannedAmounts = weights.map((w) => (w / weightSum) * totalAmount);
      }

      // Cap total to source available balance
      const plannedTotal = plannedAmounts.reduce((a, b) => a + b, 0);
      if (plannedTotal > sourceAvailable) {
        if (amountStrategy === "TOTAL_SPLIT_RANDOM") {
          plannedAmounts = redistributeToCapacity(
            plannedAmounts,
            Array(count).fill(sourceAvailable / count),
            sourceAvailable,
          );
        } else {
          // Scale down proportionally
          const scale = sourceAvailable / plannedTotal;
          plannedAmounts = plannedAmounts.map((a) => a * scale);
        }
      }

      // Execute transfers sequentially
      const results: Array<{
        targetWallet: string;
        amount: number;
        txHash: string | null;
        error?: string;
      }> = [];

      let remainingBalance = sourceAvailable;

      for (let i = 0; i < targetWallets.length; i++) {
        const target = targetWallets[i];
        const transferAmount = Math.min(plannedAmounts[i], remainingBalance);

        if (transferAmount <= 0) {
          results.push({
            targetWallet: target.address || "",
            amount: plannedAmounts[i],
            txHash: null,
            error: "Source wallet has no remaining balance.",
          });
          continue;
        }

        logEveryWhere({
          message: `[Agent] Transferring ${transferAmount} to ${target.address} (${i + 1}/${targetWallets.length})`,
        });

        try {
          const [txHash, , err] = await solanaProvider.transferToken(
            sourceEntry.wallet.privateKey!,
            target.address!,
            tokenType,
            isNative ? "" : tokenAddress!.trim(),
            new Big(transferAmount).toString(),
            listNodeProvider,
            balanceTimeoutMs,
            "",
            "",
          );

          if (err) {
            results.push({
              targetWallet: target.address || "",
              amount: transferAmount,
              txHash: null,
              error: extractErrorMessage(err),
            });
          } else {
            remainingBalance -= transferAmount;
            results.push({
              targetWallet: target.address || "",
              amount: transferAmount,
              txHash: txHash,
            });
          }
        } catch (err: any) {
          results.push({
            targetWallet: target.address || "",
            amount: transferAmount,
            txHash: null,
            error: extractErrorMessage(err),
          });
        }
      }

      const successCount = results.filter((r) => r.txHash).length;
      const failedEntries = results.filter((r) => r.error);
      const totalTransferred = results
        .filter((r) => r.txHash)
        .reduce((sum, r) => sum + r.amount, 0);

      return safeStringify({
        chain: "Solana",
        token: isNative ? "SOL" : tokenAddress,
        sourceWallet: sourceWalletAddress,
        strategy: amountStrategy,
        summary: {
          total: targetWallets.length,
          success: successCount,
          failed: failedEntries.length,
          totalTransferred,
        },
        ...(targetWallets.length <= 5 && {
          results: results.map((r) => ({
            wallet: r.targetWallet,
            amount: r.amount,
            txHash: r.txHash,
            ...(r.error && { error: r.error }),
          })),
        }),
        ...(targetWallets.length > 5 &&
          failedEntries.length > 0 && { failures: failedEntries }),
      });
    },
  });
