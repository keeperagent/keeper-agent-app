import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { ethers } from "ethers";
import Big from "big.js";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { KyberswapManager } from "@/electron/simulator/category/onchain/kyberswap";
import {
  TOKEN_TYPE,
  KYBERSWAP_CHAIN_KEY,
  EVM_TRANSACTION_TYPE,
} from "@/electron/constant";
import {
  ISwapKyberswapInput,
  ICampaignProfile,
  IWallet,
} from "@/electron/type";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { decryptWallet } from "@/electron/service/wallet";
import { EVMProvider } from "@/electron/simulator/category/onchain/evm";
import { logEveryWhere, sleep } from "@/electron/service/util";
import { ToolContext, PlanState } from "@/electron/agentCore/toolContext";
import { safeStringify } from "@/electron/agentCore/utils";
import {
  redistributeToCapacity,
  capitalizeFirstLetter,
  extractErrorMessage,
} from "../utils";
import { TOOL_KEYS } from "@/electron/constant";

const BALANCE_BATCH_SIZE = 10;

const swapOnKyberswapSchema = z
  .object({
    swapDirection: z
      .enum(["BUY", "SELL"])
      .describe("BUY = native -> ERC20, SELL = ERC20 -> native (default: BUY)"),
    inputTokenAddress: z
      .string()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true;
          return ethers.utils.isAddress(val);
        },
        {
          message:
            "Must be a valid EVM address (0x + 40 hex chars). Pass empty string for BUY.",
        },
      )
      .describe("ERC20 address. SELL only — pass empty string for BUY."),
    outputTokenAddress: z
      .string()
      .describe("ERC20 address. BUY only — pass empty string for SELL."),
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
      .union([z.literal("all"), z.literal("half"), z.number().min(0).max(100)])
      .describe("SELL only. 'all'=100%, 'half'=50%, or 0-100. Pass 0 for BUY."),
    balanceTimeoutMs: z
      .number()
      .int()
      .positive()
      .describe("Balance fetch timeout in ms (default: 15000)"),
    slippage: z
      .number()
      .min(0)
      .max(100)
      .describe("Slippage tolerance % (default: 2)"),
    priceImpact: z
      .number()
      .min(0)
      .max(100)
      .describe("Max price impact % (default: 5)"),
    deadlineInSecond: z
      .number()
      .int()
      .positive()
      .describe("Tx deadline in seconds (default: 10)"),
    gasLimit: z
      .number()
      .int()
      .nonnegative()
      .describe("Gas limit. Pass 0 for auto-estimate (default: 0)."),
    transactionType: z
      .enum([EVM_TRANSACTION_TYPE.LEGACY, EVM_TRANSACTION_TYPE.EIP_1559])
      .describe(`LEGACY or EIP_1559 (default: ${EVM_TRANSACTION_TYPE.LEGACY})`),
    gasPrice: z
      .number()
      .int()
      .nonnegative()
      .describe("Gas price in gwei (LEGACY). Pass 0 for auto (default: 0)."),
    maxFeePerGas: z
      .number()
      .int()
      .nonnegative()
      .describe("Max fee per gas in gwei (EIP_1559). Pass 0 for auto."),
    maxPriorityFeePerGas: z
      .number()
      .int()
      .nonnegative()
      .describe("Max priority fee in gwei (EIP_1559). Pass 0 for auto."),
    shouldWaitTransactionComfirmed: z
      .boolean()
      .describe("Wait for tx confirmation (default: true)"),
    includedSources: z
      .string()
      .describe(
        "Included liquidity sources (comma-separated). Pass empty string for all.",
      ),
    excludedSources: z
      .string()
      .describe(
        "Excluded liquidity sources (comma-separated). Pass empty string for none.",
      ),
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

export const mapNativeTokenName: Record<KYBERSWAP_CHAIN_KEY, string> = {
  [KYBERSWAP_CHAIN_KEY.ETHEREUM]: "ETH",
  [KYBERSWAP_CHAIN_KEY.BSC]: "BNB",
  [KYBERSWAP_CHAIN_KEY.ARBITRUM]: "ETH",
  [KYBERSWAP_CHAIN_KEY.POLYGON]: "MATIC",
  [KYBERSWAP_CHAIN_KEY.OPTIMISM]: "ETH",
  [KYBERSWAP_CHAIN_KEY.AVALANCHE]: "AVAX",
  [KYBERSWAP_CHAIN_KEY.BASE]: "ETH",
  [KYBERSWAP_CHAIN_KEY.ZKSYNC]: "ETH",
  [KYBERSWAP_CHAIN_KEY.LINEA]: "ETH",
  [KYBERSWAP_CHAIN_KEY.SCROLL]: "ETH",
  [KYBERSWAP_CHAIN_KEY.MANTLE]: "MNT",
  [KYBERSWAP_CHAIN_KEY.BLAST]: "ETH",
  [KYBERSWAP_CHAIN_KEY.SONIC]: "SONIC",
  [KYBERSWAP_CHAIN_KEY.UNICHAIN]: "ETH",
  [KYBERSWAP_CHAIN_KEY.BERACHAIN]: "BERA",
  [KYBERSWAP_CHAIN_KEY.RONIN]: "RON",
  [KYBERSWAP_CHAIN_KEY.MONAD]: "MON",
  [KYBERSWAP_CHAIN_KEY.PLASMA]: "XPL",
  [KYBERSWAP_CHAIN_KEY.HYPEREVM]: "HYPE",
};

export const swapOnKyberswapTool = (
  toolContext?: ToolContext,
): DynamicStructuredTool =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.SWAP_ON_KYBERSWAP,
    description: `Swap tokens on EVM chains via Kyberswap. BUY = native -> ERC20, SELL = ERC20 -> native.
ONLY use when chainKey is an EVM chain. For Solana use swap_on_jupiter.

Token Address: extract from user prompt first, fallback to context tokenAddress. Prompt ALWAYS overrides context. These are contract addresses, NOT wallet addresses.

BUY: amount in native token or USD (convert via native token price). Percentages NOT allowed.
SELL: use sellPercentage for "sell all/half/X%", or amount in tokens/USD (convert via token price).

Strategies: EQUAL_PER_WALLET (amount), RANDOM_PER_WALLET (maxAmount required), TOTAL_SPLIT_RANDOM (totalAmount).
"buy total X" = TOTAL_SPLIT_RANDOM. "buy randomly" = RANDOM_PER_WALLET.

Display: native token symbol for native amounts, "tokens" for token amounts. NEVER show balance after swaps.`,
    schema: swapOnKyberswapSchema,
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
      slippage = 2,
      priceImpact = 5,
      deadlineInSecond = 10,
      gasLimit,
      transactionType = EVM_TRANSACTION_TYPE.LEGACY,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      shouldWaitTransactionComfirmed = true,
      includedSources = "",
      excludedSources = "",
    }) => {
      console.log(
        `[swap_on_kyberswap] planState="${toolContext?.planState}" expected="${PlanState.APPROVED}"`,
      );
      if (toolContext?.planState !== PlanState.APPROVED) {
        return safeStringify({
          error:
            "Cannot execute swap in planning mode. Call confirm_approval with your execution plan first to get user approval.",
          status: "blocked_planning_mode",
        });
      }
      const chainKey = toolContext?.chainKey as KYBERSWAP_CHAIN_KEY;
      // Validate token addresses are valid EVM addresses
      const isValidEVMAddress = (address: string): boolean => {
        return ethers.utils.isAddress(address);
      };

      // Apply ToolContext fallback for token addresses when the model provides
      // an invalid or wrong-chain address (e.g. Solana base58 address on EVM).
      // Only fall back to context tokenAddress when chainKey confirms an EVM chain.
      const isEvmChain =
        !toolContext?.chainKey ||
        toolContext.chainKey.toLowerCase() !== "solana";
      const effectiveOutputTokenAddress = (() => {
        if (swapDirection !== "BUY") return outputTokenAddress;
        if (outputTokenAddress && isValidEVMAddress(outputTokenAddress)) {
          return outputTokenAddress;
        }
        const ctxAddr = toolContext?.tokenAddress;
        if (isEvmChain && ctxAddr && isValidEVMAddress(ctxAddr)) return ctxAddr;
        return outputTokenAddress; // let validation below surface the error
      })();

      const effectiveInputTokenAddress = (() => {
        if (swapDirection !== "SELL") return inputTokenAddress;
        if (inputTokenAddress && isValidEVMAddress(inputTokenAddress)) {
          return inputTokenAddress;
        }
        const ctxAddr = toolContext?.tokenAddress;
        if (isEvmChain && ctxAddr && isValidEVMAddress(ctxAddr)) return ctxAddr;
        return inputTokenAddress; // let validation below surface the error
      })();

      // For BUY operations: only validate outputTokenAddress (ERC20 token), never validate inputTokenAddress (native token has no address)
      if (swapDirection === "BUY" && effectiveOutputTokenAddress) {
        if (!isValidEVMAddress(effectiveOutputTokenAddress)) {
          throw new Error(
            `Invalid EVM token address: ${effectiveOutputTokenAddress}. Please provide a valid EVM token address (0x followed by 40 hex characters).`,
          );
        }
      }

      // For SELL operations: validate inputTokenAddress (ERC20 token)
      if (swapDirection === "SELL" && effectiveInputTokenAddress) {
        if (!isValidEVMAddress(effectiveInputTokenAddress)) {
          throw new Error(
            `Invalid EVM token address: ${effectiveInputTokenAddress}. Please provide a valid EVM token address (0x followed by 40 hex characters).`,
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
        throw new Error(
          "No valid wallets found in the selected campaign profiles",
        );
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

      const isBuy = swapDirection === "BUY";
      const tokenAddress = isBuy
        ? effectiveOutputTokenAddress
        : effectiveInputTokenAddress;

      if (!tokenAddress) {
        throw new Error(
          isBuy
            ? "outputTokenAddress is required for BUY operations"
            : "inputTokenAddress is required for SELL operations",
        );
      }

      // Validate that sellPercentage is not used for BUY operations
      if (isBuy && sellPercentage) {
        throw new Error("sellPercentage can only be used for SELL operations");
      }

      const evmProvider = new EVMProvider();
      const kyberswapManager = new KyberswapManager();
      const kyberswap = await kyberswapManager.getKyberswap(listNodeProvider);

      // Fetch balances for all wallets
      const balanceInfo: Array<{
        balance: number | null;
        balanceStr: string | null; // Store original balance string for precision
        available: number;
        availableStr: string | null; // Store original available string for precision
        error: string | null;
      }> = [];

      logEveryWhere({
        message: `[Agent] Fetching balance for ${wallets.length} wallets...`,
      });
      const startTime = new Date().getTime();

      for (let i = 0; i < wallets.length; i += BALANCE_BATCH_SIZE) {
        const batch = wallets.slice(i, i + BALANCE_BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (wallet) => {
            let balanceStr: string | null = null;
            let balanceErr: Error | null = null;

            if (isBuy) {
              // For BUY: fetch native token balance (ETH, BNB, etc.)
              const [balance, err] = await evmProvider.getWalletBalance(
                listNodeProvider,
                TOKEN_TYPE.NATIVE_TOKEN,
                wallet?.address || "",
                "",
                balanceTimeoutMs,
              );
              balanceStr = balance;
              balanceErr = err || null;
            } else {
              // For SELL: fetch ERC20 token balance
              const [balance, err] = await evmProvider.getWalletBalance(
                listNodeProvider,
                TOKEN_TYPE.EVM_ERC20_TOKEN,
                wallet?.address || "",
                tokenAddress,
                balanceTimeoutMs,
              );
              balanceStr = balance;
              balanceErr = err || null;
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
            // Store original balance string to preserve precision
            const availableStr = balanceStr || "0";
            return {
              balance: bal,
              balanceStr: balanceStr,
              available: bal,
              availableStr: availableStr,
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
        const assetName = isBuy
          ? "native token after gas buffer"
          : "token balance";
        throw new Error(`All wallets have zero available ${assetName}`);
      }

      // Prefer total split when a total amount is provided
      const effectiveTotalAmount = totalAmount;
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

        if (
          resolvedAmountStrategy === "EQUAL_PER_WALLET" ||
          !resolvedAmountStrategy
        ) {
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
          const randomAmounts = Array.from({ length: count }, () =>
            Math.random(),
          );
          const sum = randomAmounts.reduce((a, b) => a + b, 0);
          const normalized = randomAmounts.map(
            (r) => (r / sum) * effectiveTotalAmount,
          );
          return normalized;
        }

        throw new Error(`Unknown amount strategy: ${resolvedAmountStrategy}`);
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
        amount: number;
        txHash: string | null;
        error: string | null;
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
            amount: plannedAmount,
            txHash: null,
            error: balance.error,
          });
          continue;
        }

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
          const assetName = isBuy ? "native token" : "token";
          results.push({
            wallet: wallet?.address || "",
            amount: plannedAmount,
            txHash: null,
            error: `Insufficient ${assetName} balance`,
          });
          continue;
        }

        try {
          const NATIVE_TOKEN_ADDRESS =
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
          const swapInput: ISwapKyberswapInput = {
            chainKey,
            inputTokenAddress: isBuy ? NATIVE_TOKEN_ADDRESS : tokenAddress,
            isInputNativeToken: isBuy,
            inputTokenDecimal: 0, // Will be set by swap method
            outputTokenAddress: isBuy ? tokenAddress : NATIVE_TOKEN_ADDRESS,
            isOutputNativeToken: !isBuy,
            outputTokenDecimal: 0, // Will be set by swap method
            amount: effectiveAmountBig.toString(), // Use Big.js string to preserve full precision
            slippage,
            priceImpact,
            dealineInSecond: deadlineInSecond,
            gasLimit: gasLimit
              ? ethers.BigNumber.from(gasLimit)
              : ethers.BigNumber.from(0),
            isUseCustomGasLimit: Boolean(gasLimit),
            transactionType,
            maxFeePerGas: maxFeePerGas
              ? ethers.BigNumber.from(maxFeePerGas)
              : undefined,
            maxPriorityFeePerGas: maxPriorityFeePerGas
              ? ethers.BigNumber.from(maxPriorityFeePerGas)
              : undefined,
            gasPrice: gasPrice ? ethers.BigNumber.from(gasPrice) : undefined,
            isUseCustomGasPrice: Boolean(gasPrice),
            shouldWaitTransactionComfirmed,
            includedSources,
            excludedSources,
          };

          const logInfo = {
            campaignId: effectiveCampaignId,
            workflowId: 0, // Agent doesn't have workflowId
          };

          const [txHash, err] = await kyberswap.swapNormal(
            swapInput,
            wallet?.privateKey || "",
            balanceTimeoutMs,
            logInfo,
          );
          results.push({
            wallet: wallet?.address || "",
            amount: effectiveAmount,
            txHash: txHash || null,
            error: err ? extractErrorMessage(err) : null,
          });
        } catch (err: any) {
          // Catch any unexpected errors and continue with next wallet
          results.push({
            wallet: wallet?.address || "",
            amount: effectiveAmount,
            txHash: null,
            error: extractErrorMessage(err),
          });
        }

        // Small delay between swaps to avoid rate limiting
        if (i < wallets.length - 1) {
          await sleep(100);
        }
      }

      const successCount = results.filter((r) => r.txHash && !r.error).length;
      const failedEntries = results.filter((r) => r.error);
      const totalSwapped = actualPerWalletAmounts.reduce((a, b) => a + b, 0);

      if (successCount > 0) {
        toolContext?.resetPlanState();
      }

      const toolResult = safeStringify({
        chain: capitalizeFirstLetter(chainKey),
        swapDirection,
        inputToken: isBuy
          ? mapNativeTokenName[chainKey] || "native"
          : tokenAddress,
        outputToken: isBuy
          ? tokenAddress
          : mapNativeTokenName[chainKey] || "native",
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
            txHash: r.txHash,
            ...(r.error && { error: r.error }),
          })),
        }),
        ...(wallets.length > 5 &&
          failedEntries.length > 0 && {
            failures: failedEntries.map((r) => ({
              wallet: r.wallet,
              amount: r.amount,
              error: r.error,
            })),
          }),
      });

      const firstTxHash = results.find((r) => r.txHash)?.txHash;
      const txHashSummary = firstTxHash
        ? ` tx=${firstTxHash.slice(0, 8)}...`
        : "";
      logEveryWhere({
        message: `[swap_on_kyberswap] done chain=${capitalizeFirstLetter(chainKey)} dir=${swapDirection} total=${wallets.length} success=${successCount} failed=${failedEntries.length} amount=${totalSwapped}${txHashSummary}`,
      });
      return toolResult;
    },
  });
