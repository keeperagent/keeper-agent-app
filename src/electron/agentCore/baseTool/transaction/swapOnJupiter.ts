import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { PublicKey } from "@solana/web3.js";
import Big from "big.js";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { SwapOnJupiterManager } from "@/electron/simulator/category/onchain/jupiter";
import { SOL_MINT_ADDRESS, TOKEN_TYPE } from "@/electron/constant";
import { IJupiterSwapInput, ICampaignProfile, IWallet } from "@/electron/type";
import { safeStringify } from "@/electron/agentCore/utils";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { decryptWallet } from "@/electron/service/wallet";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import { logEveryWhere } from "@/electron/service/util";
import { ToolContext, PlanState } from "@/electron/agentCore/toolContext";
import { redistributeToCapacity, extractErrorMessage } from "../utils";
import { TOOL_KEYS } from "@/electron/constant";

const GAS_BUFFER_SOL = 0.0005;
const BALANCE_BATCH_SIZE = 10;

const swapOnJupiterSchema = z
  .object({
    swapDirection: z
      .enum(["BUY", "SELL"])
      .describe("BUY = SOL -> token, SELL = token -> SOL (default: BUY)"),
    inputTokenAddress: z
      .string()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true;
          try {
            new PublicKey(val);
            return val.length >= 32;
          } catch {
            return false;
          }
        },
        {
          message:
            "Must be a valid SPL mint address. Pass empty string for BUY (input is always SOL).",
        },
      )
      .describe("SPL mint address. SELL only — pass empty string for BUY."),
    outputTokenAddress: z
      .string()
      .describe("SPL mint address. BUY only — pass empty string for SELL."),
    amountStrategy: z
      .enum(["EQUAL_PER_WALLET", "RANDOM_PER_WALLET", "TOTAL_SPLIT_RANDOM"])
      .describe("Amount allocation strategy across wallets"),
    amount: z
      .number()
      .min(0)
      .describe(
        "Per-wallet amount (for EQUAL_PER_WALLET). Pass 0 if not applicable.",
      ),
    totalAmount: z
      .number()
      .min(0)
      .describe(
        "Total amount to split across wallets (for TOTAL_SPLIT_RANDOM). Pass 0 if not applicable.",
      ),
    minAmount: z
      .number()
      .nonnegative()
      .describe(
        "Min per-wallet amount (for RANDOM_PER_WALLET). Pass 0 if not applicable.",
      ),
    maxAmount: z
      .number()
      .min(0)
      .describe(
        "Max per-wallet amount (REQUIRED for RANDOM_PER_WALLET). Pass 0 if not applicable.",
      ),
    sellPercentage: z
      .union([z.enum(["all", "half"]), z.number().min(0).max(100)])
      .describe("SELL only. 'all'=100%, 'half'=50%, or 0-100. Pass 0 for BUY."),
    balanceTimeoutMs: z
      .number()
      .positive()
      .describe("Balance fetch timeout in ms (default: 15000)"),
    slippagePercentage: z
      .number()
      .min(0)
      .max(50)
      .describe("Slippage %. 0 = dynamic slippage (default: 0)."),
    maxPriceImpactPercentage: z
      .number()
      .min(0.1)
      .max(50)
      .describe("Max price impact % before aborting (default: 5)"),
    pritorityFeeMicroLamport: z
      .number()
      .min(0)
      .max(0.5)
      .describe("Max priority fee in micro-lamports (default: 0)"),
    shouldWaitTransactionComfirmed: z
      .boolean()
      .describe("Wait for tx confirmation (default: true)"),
  })
  .refine(
    (data) => {
      if (data.amountStrategy === "RANDOM_PER_WALLET" && !data.sellPercentage) {
        const effectiveMax = data.maxAmount ?? data.amount;
        return effectiveMax !== undefined && effectiveMax > 0;
      }
      return true;
    },
    {
      message:
        "maxAmount (or amount) is required when amountStrategy is RANDOM_PER_WALLET",
      path: ["maxAmount"],
    },
  ) as z.ZodTypeAny;

export const swapOnJupiterTool = (
  toolContext?: ToolContext,
): DynamicStructuredTool =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.SWAP_ON_JUPITER,
    description: `Swap tokens on Solana via Jupiter. BUY = SOL -> token, SELL = token -> SOL.
ONLY use when chainKey is "solana". For EVM chains use swap_on_kyberswap.

Token Address: extract from user prompt first, fallback to context tokenAddress. Prompt ALWAYS overrides context. These are mint addresses, NOT wallet addresses.

BUY: amount in SOL or USD (convert via native token price). Percentages NOT allowed for BUY.
SELL: use sellPercentage for "sell all/half/X%", or amount in tokens/USD (convert via token price).

Strategies: EQUAL_PER_WALLET (amount), RANDOM_PER_WALLET (maxAmount required), TOTAL_SPLIT_RANDOM (totalAmount).
"buy total X SOL" = TOTAL_SPLIT_RANDOM. "buy randomly" = RANDOM_PER_WALLET.

Display: SOL for native, "tokens" for token amounts. NEVER show balance after swaps.`,
    schema: swapOnJupiterSchema,
    func: async ({
      swapDirection = "BUY",
      inputTokenAddress,
      outputTokenAddress,
      amountStrategy,
      amount,
      totalAmount,
      minAmount,
      maxAmount,
      sellPercentage,
      balanceTimeoutMs = 15000,
      slippagePercentage = 0,
      maxPriceImpactPercentage = 5,
      pritorityFeeMicroLamport = 0,
      shouldWaitTransactionComfirmed = true,
    }) => {
      console.log(
        `[swap_on_jupiter] planState="${toolContext?.planState}" expected="${PlanState.APPROVED}"`,
      );
      if (toolContext?.planState !== PlanState.APPROVED) {
        return safeStringify({
          error:
            "Cannot execute swap in planning mode. Call confirm_approval with your execution plan first to get user approval.",
          status: "blocked_planning_mode",
        });
      }
      // Validate token addresses are valid Solana addresses
      const isValidSolanaAddress = (address: string): boolean => {
        try {
          new PublicKey(address);
          return true;
        } catch {
          return false;
        }
      };

      // Apply ToolContext fallback for token addresses when the model provides
      // an invalid or wrong-chain address (e.g. EVM 0x... address on Solana).
      // Only fall back to context tokenAddress when chainKey confirms Solana.
      const isSolanaChain =
        !toolContext?.chainKey ||
        toolContext.chainKey.toLowerCase() === "solana";
      const effectiveOutputTokenAddress = (() => {
        if (swapDirection !== "BUY") return outputTokenAddress;
        if (outputTokenAddress && isValidSolanaAddress(outputTokenAddress)) {
          return outputTokenAddress;
        }
        const ctxAddr = toolContext?.tokenAddress;
        if (isSolanaChain && ctxAddr && isValidSolanaAddress(ctxAddr))
          return ctxAddr;
        return outputTokenAddress; // let validation below surface the error
      })();

      const effectiveInputTokenAddress = (() => {
        if (swapDirection !== "SELL") return inputTokenAddress;
        if (inputTokenAddress && isValidSolanaAddress(inputTokenAddress)) {
          return inputTokenAddress;
        }
        const ctxAddr = toolContext?.tokenAddress;
        if (isSolanaChain && ctxAddr && isValidSolanaAddress(ctxAddr))
          return ctxAddr;
        return inputTokenAddress; // let validation below surface the error
      })();

      if (swapDirection === "BUY" && effectiveOutputTokenAddress) {
        if (!isValidSolanaAddress(effectiveOutputTokenAddress)) {
          throw new Error(
            `Invalid Solana token address: ${effectiveOutputTokenAddress}. Please provide a valid Solana token address (base58 format, typically 32-44 characters).`,
          );
        }
      }

      if (swapDirection === "SELL" && effectiveInputTokenAddress) {
        if (!isValidSolanaAddress(effectiveInputTokenAddress)) {
          throw new Error(
            `Invalid Solana token address: ${effectiveInputTokenAddress}. Please provide a valid Solana token address (base58 format, typically 32-44 characters).`,
          );
        }
      }
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
      if (errList) {
        throw errList;
      }
      const listNodeProvider =
        listNodeEndpoint
          ?.map((node) => node?.endpoint || "")
          ?.filter((endpoint) => Boolean(endpoint)) || [];
      if (!listNodeProvider.length) {
        throw new Error(
          "The configured node endpoint group has no active endpoints",
        );
      }

      // Resolve effective wallet selection from ToolContext.
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

      // Validate swap direction requirements
      if (swapDirection === "BUY" && !effectiveOutputTokenAddress) {
        throw new Error("outputTokenAddress is required for BUY direction");
      }
      if (swapDirection === "SELL" && !effectiveInputTokenAddress) {
        throw new Error("inputTokenAddress is required for SELL direction");
      }

      // Validate that sellPercentage is not used for BUY operations
      if (swapDirection === "BUY" && sellPercentage) {
        throw new Error(
          "Percentages are not supported for BUY operations. Please specify an absolute SOL amount (e.g., 'buy 0.1 SOL', 'buy 0.5 SOL'). Percentages are only available for SELL operations.",
        );
      }

      const isBuy = swapDirection === "BUY";
      // For BUY operations, inputTokenAddress should not be provided (input is always SOL)
      // Ignore it if provided incorrectly
      const tokenAddress = isBuy
        ? effectiveOutputTokenAddress!
        : effectiveInputTokenAddress!;

      const jupiterManager = new SwapOnJupiterManager();
      const swapper = await jupiterManager.getSwapOnJupiter(listNodeProvider);
      const solanaProvider = new SolanaProvider();

      const balanceInfo: {
        balance: number | null;
        balanceStr: string | null; // Store original balance string for precision
        available: number;
        availableStr: string | null; // Store original available string for precision
        error: string | null;
      }[] = [];

      const startTime = new Date().getTime();
      logEveryWhere({
        message: `[Agent] Fetching ${isBuy ? "SOL" : "token"} balance for ${wallets.length} wallets`,
      });
      for (let i = 0; i < wallets.length; i += BALANCE_BATCH_SIZE) {
        const batch = wallets.slice(i, i + BALANCE_BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (wallet) => {
            let balanceStr: string | null = null;
            let balanceErr: Error | null | undefined = null;

            if (isBuy) {
              // For BUY: fetch SOL balance
              [balanceStr, balanceErr] = await solanaProvider.getNativeBalance(
                wallet?.address || "",
                listNodeProvider,
                balanceTimeoutMs,
              );
            } else {
              // For SELL: fetch token balance
              [balanceStr, balanceErr] = await solanaProvider.getWalletBalance(
                listNodeProvider,
                TOKEN_TYPE.SOLANA_TOKEN,
                wallet?.address || "",
                tokenAddress,
                balanceTimeoutMs,
              );
            }

            if (balanceErr) {
              return {
                balance: null,
                balanceStr: null,
                available: 0,
                availableStr: null,
                error: extractErrorMessage(balanceErr),
              };
            }
            const bal = Number(balanceStr || "0");
            // For BUY: reserve gas buffer from SOL. For SELL: no buffer needed (token balance)
            // Use Big.js to preserve precision when calculating available
            const balanceBig = new Big(balanceStr || "0");
            const availableBig = isBuy
              ? balanceBig.minus(GAS_BUFFER_SOL).gt(0)
                ? balanceBig.minus(GAS_BUFFER_SOL)
                : new Big(0)
              : balanceBig;
            const available = availableBig.toNumber();
            return {
              balance: bal,
              balanceStr: balanceStr,
              available,
              availableStr: availableBig.toString(),
              error: null,
            };
          }),
        );
        balanceInfo.push(...batchResults);
      }
      const endTime = new Date().getTime();
      logEveryWhere({
        message: `[Agent] Fetching balance for ${wallets.length} wallets done, take: ${(endTime - startTime) / 1000} seconds`,
      });

      const availableTotal = balanceInfo.reduce(
        (sum, b) => sum + (b?.available || 0),
        0,
      );
      if (availableTotal <= 0) {
        const assetName = isBuy ? "SOL after gas buffer" : "token balance";
        throw new Error(`All wallets have zero available ${assetName}`);
      }

      // Prefer total split when a total amount is provided, even if caller picked a per-wallet strategy.
      // Only treat an amount as "total" when totalAmount is explicitly provided.
      const effectiveTotalAmount = totalAmount;

      // Infer strategy from whichever amount field the model provided when amountStrategy is omitted.
      let resolvedAmountStrategy = amountStrategy;
      if (effectiveTotalAmount) {
        resolvedAmountStrategy = "TOTAL_SPLIT_RANDOM";
      } else if (!resolvedAmountStrategy) {
        if (amount) {
          resolvedAmountStrategy = "EQUAL_PER_WALLET";
        } else if (maxAmount) {
          resolvedAmountStrategy = "RANDOM_PER_WALLET";
        }
      }

      // Handle sellPercentage for SELL direction
      let sellPercentageValue: number | null = null;
      if (!isBuy && sellPercentage) {
        if (sellPercentage === "all") {
          sellPercentageValue = 100;
        } else if (sellPercentage === "half") {
          sellPercentageValue = 50;
        } else if (typeof sellPercentage === "number") {
          sellPercentageValue = sellPercentage;
        }
      }

      const plannedPerWalletAmounts = (() => {
        const count = wallets.length;
        const randBetween = (min: number, max: number) =>
          min + Math.random() * (max - min);

        // For SELL with sellPercentage: calculate based on token balance percentage
        if (!isBuy && sellPercentageValue !== null) {
          return balanceInfo.map((b) => {
            const balance = b.balance || 0;
            return (balance * sellPercentageValue!) / 100;
          });
        }

        if (resolvedAmountStrategy === "EQUAL_PER_WALLET") {
          if (!amount || amount <= 0) {
            throw new Error("amount must be > 0 for EQUAL_PER_WALLET");
          }
          return Array(count).fill(amount);
        }

        if (resolvedAmountStrategy === "RANDOM_PER_WALLET") {
          const effectiveMax = maxAmount || amount;
          if (!effectiveMax || effectiveMax <= 0) {
            throw new Error(
              "maxAmount (or amount) is required and must be > 0 for RANDOM_PER_WALLET strategy",
            );
          }
          const min = minAmount || 0;
          const max = Math.max(effectiveMax, min);
          if (max === min) {
            return Array(count).fill(min);
          }
          return Array.from({ length: count }, () => randBetween(min, max));
        }

        if (resolvedAmountStrategy === "TOTAL_SPLIT_RANDOM") {
          if (!effectiveTotalAmount || effectiveTotalAmount <= 0) {
            throw new Error("totalAmount must be > 0 for TOTAL_SPLIT_RANDOM");
          }
          const weights = Array.from(
            { length: count },
            () => Math.random() || 0.0001,
          );
          const weightSum = weights.reduce((a, b) => a + b, 0);
          const amounts = weights.map(
            (w) => (w / weightSum) * effectiveTotalAmount,
          );
          return amounts;
        }

        throw new Error(`Unknown amountStrategy: ${resolvedAmountStrategy}`);
      })();

      // Adjust planned amounts based on available balances
      const availableArr = balanceInfo.map((b) => b.available || 0);
      let plannedAdjusted = plannedPerWalletAmounts;

      // For EQUAL_PER_WALLET: Only clamp to capacity, don't redistribute (keep amounts equal)
      // For TOTAL_SPLIT_RANDOM: Use redistributeToCapacity to fill remaining capacity
      // For RANDOM_PER_WALLET: Only clamp to capacity (amounts are already random)
      if (resolvedAmountStrategy === "TOTAL_SPLIT_RANDOM") {
        const targetTotal = plannedPerWalletAmounts.reduce((a, b) => a + b, 0);
        plannedAdjusted = redistributeToCapacity(
          plannedPerWalletAmounts,
          availableArr,
          targetTotal,
        );
      } else {
        // For EQUAL_PER_WALLET and RANDOM_PER_WALLET: Just clamp to capacity, don't redistribute
        plannedAdjusted = plannedPerWalletAmounts.map((amt, idx) =>
          Math.min(amt, availableArr[idx] || 0),
        );
      }

      const results: Array<{
        wallet: string;
        balanceInSol?: number;
        amount: number;
        signature: string | null;
        error?: string;
      }> = [];

      const actualPerWalletAmounts: number[] = [];

      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const plannedAmount = plannedAdjusted[i];
        const balance = balanceInfo[i];

        if (balance.error) {
          actualPerWalletAmounts.push(0);
          results.push({
            wallet: wallet?.address || "",
            balanceInSol: undefined,
            amount: plannedAmount,
            signature: null,
            error: balance.error,
          });
          continue;
        }

        const balanceNum = balance.balance || 0;
        // Use original balance string with Big.js to preserve full precision
        const availableStr =
          balance.availableStr || balance.available?.toString() || "0";
        const plannedAmountBig = new Big(plannedAmount.toString());
        const availableBig = new Big(availableStr);
        const effectiveAmountBig = plannedAmountBig.lt(availableBig)
          ? plannedAmountBig
          : availableBig;
        const effectiveAmount = effectiveAmountBig.toNumber();
        actualPerWalletAmounts.push(effectiveAmount > 0 ? effectiveAmount : 0);

        if (!effectiveAmount || effectiveAmount <= 0) {
          const assetName = isBuy ? "SOL" : "token";
          results.push({
            wallet: wallet?.address || "",
            balanceInSol: balanceNum,
            amount: plannedAmount,
            signature: null,
            error: `Insufficient ${assetName} balance`,
          });
          continue;
        }

        const swapInput: IJupiterSwapInput = {
          inputTokenAddress: isBuy ? SOL_MINT_ADDRESS : tokenAddress.trim(),
          inputTokenDecimals: 0,
          outputTokenAddress: isBuy
            ? effectiveOutputTokenAddress!.trim()
            : SOL_MINT_ADDRESS,
          amount: effectiveAmountBig.toString(), // Use Big.js string to preserve full precision
          slippagePercentage,
          maxPriceImpactPercentage,
          dynamicSlippage: !slippagePercentage,
          pritorityFeeMicroLamport,
          shouldWaitTransactionComfirmed,
        };

        try {
          const [txHash, err] = await swapper.swapNormal(
            swapInput,
            wallet?.privateKey || "",
            {
              campaignId: 0,
              workflowId: 0,
            },
          );
          results.push({
            wallet: wallet?.address || "",
            balanceInSol: balanceNum,
            amount: effectiveAmount,
            signature: txHash,
            error: err ? extractErrorMessage(err) : undefined,
          });
        } catch (err: any) {
          // Catch any unexpected errors and continue with next wallet
          results.push({
            wallet: wallet?.address || "",
            balanceInSol: balanceNum,
            amount: effectiveAmount,
            signature: null,
            error: extractErrorMessage(err),
          });
        }
      }

      const successCount = results.filter(
        (r) => r.signature && !r.error,
      ).length;
      const failedEntries = results.filter((r) => r.error);
      const totalSwapped = actualPerWalletAmounts.reduce((a, b) => a + b, 0);

      // Consume the approval after execution — any retry attempt will be blocked
      // at the planState check, preventing double-spend without re-approval
      if (successCount > 0) {
        toolContext?.resetPlanState();
      }

      const toolResult = safeStringify({
        chain: "Solana",
        swapDirection,
        inputToken: isBuy ? "SOL" : effectiveInputTokenAddress?.trim(),
        outputToken: isBuy ? effectiveOutputTokenAddress?.trim() : "SOL",
        strategy:
          sellPercentageValue !== null
            ? `SELL_${sellPercentageValue}%`
            : resolvedAmountStrategy,
        summary: {
          total: wallets.length,
          success: successCount,
          failed: failedEntries.length,
          totalAmount: totalSwapped,
        },
        ...(wallets.length <= 5 && {
          results: results.map((r) => ({
            wallet: r.wallet,
            amount: r.amount,
            txHash: r.signature,
            ...(r.error && { error: r.error }),
          })),
        }),
        ...(wallets.length > 5 &&
          failedEntries.length > 0 && { failures: failedEntries }),
      });

      logEveryWhere({
        message: `[swap_on_jupiter] tool result: ${toolResult}`,
      });
      return toolResult;
    },
  });
