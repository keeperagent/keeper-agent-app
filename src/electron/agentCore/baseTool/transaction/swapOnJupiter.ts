import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod/v3";
import Big from "big.js";
import _ from "lodash";
import { SwapOnJupiterManager } from "@/electron/simulator/category/onchain/jupiter";
import {
  SOL_MINT_ADDRESS,
  SwapDirection,
  TOKEN_TYPE,
  USDC_MINT_ADDRESS_ON_SOLANA,
  USDT_MINT_ADDRESS_ON_SOLANA,
  USD1_MINT_ADDRESS_ON_SOLANA,
  PRICE_DATA_SOURCE,
} from "@/electron/constant";
import { Pricing } from "@/electron/simulator/category/pricing";
import { IJupiterSwapInput, IWallet } from "@/electron/type";
import { safeStringify } from "@/electron/agentCore/utils";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import { logEveryWhere } from "@/electron/service/util";
import { ToolContext, PlanState } from "@/electron/agentCore/toolContext";
import { TOOL_KEYS } from "@/electron/constant";
import {
  redistributeToCapacity,
  extractErrorMessage,
  isValidSolanaAddress,
  AmountStrategy,
} from "../utils";
import {
  FundingOption,
  FundingOptions,
  WalletBalanceInfo,
  makeBalanceError,
  getMaxAvailableFundingAmountUsd,
  selectFundingOptionForAmount,
  countByKey,
  computePlannedAmounts,
  resolveSellPercentage,
  resolveAmountStrategy,
  resolveNodeProviders,
  resolveWalletsFromCampaign,
  BALANCE_SKIP_REASONS,
  SwapFailureReason,
} from "./utils";

const MIN_SOL_REQUIRED_FOR_SWAP_GAS = 0.0001;
const SOL_SPENDABLE_GAS_RESERVE = MIN_SOL_REQUIRED_FOR_SWAP_GAS;
const BALANCE_BATCH_SIZE = 5;
const SOLANA_AUTO_BUY_FUNDING_PRIORITY = [
  SOL_MINT_ADDRESS,
  USDC_MINT_ADDRESS_ON_SOLANA,
  USDT_MINT_ADDRESS_ON_SOLANA,
  USD1_MINT_ADDRESS_ON_SOLANA,
];
const SUPPORTED_SOLANA_BUY_INPUT_MINTS = new Set([
  SOL_MINT_ADDRESS,
  USDC_MINT_ADDRESS_ON_SOLANA,
  USDT_MINT_ADDRESS_ON_SOLANA,
  USD1_MINT_ADDRESS_ON_SOLANA,
]);
const SOLANA_BUY_INPUT_TOKEN_LABEL: Record<string, string> = {
  [SOL_MINT_ADDRESS]: "SOL",
  [USDC_MINT_ADDRESS_ON_SOLANA]: "USDC",
  [USDT_MINT_ADDRESS_ON_SOLANA]: "USDT",
  [USD1_MINT_ADDRESS_ON_SOLANA]: "USD1",
};

// Reverse map: token symbol → mint address, for resolving LLM-provided labels
const SOLANA_TOKEN_LABEL_TO_ADDRESS: Record<string, string> =
  Object.fromEntries(
    Object.entries(SOLANA_BUY_INPUT_TOKEN_LABEL).map(([address, label]) => [
      label.toUpperCase(),
      address,
    ]),
  );

const swapOnJupiterSchema = z
  .object({
    swapDirection: z.nativeEnum(SwapDirection).describe("BUY or SELL"),
    inputTokenSymbol: z
      .string()
      .nullish()
      .describe(
        "Token symbol for BUY funding — use this when specifying a named token (e.g. 'SOL', 'USDC', 'USDT', 'USD1'). The tool resolves the symbol to the correct mint address. Do NOT put a symbol in inputTokenAddress.",
      ),
    inputTokenAddress: z
      .string()
      .refine(
        (val) => {
          if (!val || val.trim() === "") {
            return true;
          }
          return isValidSolanaAddress(val) && val.length >= 32;
        },
        {
          message:
            "Must be a valid SPL mint address (base58, 32–44 chars). For named tokens use inputTokenSymbol instead. Leave empty to auto-resolve funding.",
        },
      )
      .describe(
        "Raw SPL mint address only — no symbols. BUY: optional explicit funding mint (leave empty to auto-resolve SOL/USDC/USDT/USD1 per wallet; amounts in USD). SELL: token mint to sell. Use inputTokenSymbol for named tokens.",
      ),
    outputTokenAddress: z
      .string()
      .describe("SPL mint address. BUY only — pass empty string for SELL."),
    amountStrategy: z
      .nativeEnum(AmountStrategy)
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
    slippagePercentage: z
      .number()
      .min(0)
      .max(50)
      .describe("Slippage %, 0 mean dynamic slippage (default 0)"),
    maxPriceImpactPercentage: z
      .number()
      .min(0.1)
      .max(50)
      .describe("Max price impact % (default 5)"),
  })
  .refine(
    (data) => {
      if (
        data.amountStrategy === AmountStrategy.RANDOM_PER_WALLET &&
        !data.sellPercentage
      ) {
        const effectiveMax = data.maxAmount || data.amount;
        return Boolean(effectiveMax);
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
    description:
      "Swap tokens on Solana via Jupiter. BUY = swap one funding token per wallet to target token. If the user specifies a funding token by name (SOL/USDC/USDT/USD1), pass the symbol in inputTokenSymbol and the amount in that token's native quantity (e.g. 'buy with 5 SOL' → inputTokenSymbol='SOL', amount=5). If the user does not specify, leave both inputTokenSymbol and inputTokenAddress empty to auto-resolve by priority (SOL→USDC→USDT→USD1) with amount in USD. SELL = swap token to SOL. Strategies: EQUAL_PER_WALLET, RANDOM_PER_WALLET, TOTAL_SPLIT_RANDOM. Solana only — use swap_on_kyberswap for EVM.",
    schema: swapOnJupiterSchema,
    func: async ({
      swapDirection,
      inputTokenSymbol,
      inputTokenAddress,
      outputTokenAddress,
      amountStrategy,
      amount,
      totalAmount,
      minAmount,
      maxAmount,
      sellPercentage,
      slippagePercentage = 0,
      maxPriceImpactPercentage = 5,
    }) => {
      if (inputTokenSymbol) {
        const resolved =
          SOLANA_TOKEN_LABEL_TO_ADDRESS[inputTokenSymbol.toUpperCase()];
        if (resolved) {
          inputTokenAddress = resolved;
        }
      }
      inputTokenAddress = inputTokenAddress?.trim();
      const isBuy = swapDirection === SwapDirection.BUY;
      console.log(
        `[${TOOL_KEYS.SWAP_ON_JUPITER}] planState="${toolContext?.planState}" expected="${PlanState.APPROVED}"`,
      );
      if (toolContext?.planState !== PlanState.APPROVED) {
        return safeStringify({
          error:
            "Cannot execute swap in planning mode. Call confirm_approval with your execution plan first to get user approval.",
          status: "blocked_planning_mode",
        });
      }
      if (toolContext?.chainKey?.toLowerCase() !== "solana") {
        throw new Error(
          `swap_on_jupiter only supports Solana. Current chain: ${toolContext?.chainKey || "unknown"}. Use swap_on_kyberswap for EVM chains.`,
        );
      }
      if (isBuy && sellPercentage) {
        throw new Error(
          "Percentages are not supported for BUY operations. Please specify an absolute funding-token amount (e.g., 'buy 0.1 SOL' or 'buy 0.5 USDC'). Percentages are only available for SELL operations.",
        );
      }

      const effectiveOutputTokenAddress = resolveEffectiveTokenAddress(
        swapDirection,
        SwapDirection.BUY,
        outputTokenAddress,
        toolContext?.tokenAddress,
      );
      const effectiveInputTokenAddress = resolveEffectiveTokenAddress(
        swapDirection,
        SwapDirection.SELL,
        inputTokenAddress,
        toolContext?.tokenAddress,
      );

      const fundingTokenAddress = isBuy
        ? inputTokenAddress || SOL_MINT_ADDRESS
        : null;
      const shouldAutoResolveBuyInputToken = isBuy && !inputTokenAddress;

      if (
        isBuy &&
        fundingTokenAddress &&
        !SUPPORTED_SOLANA_BUY_INPUT_MINTS.has(fundingTokenAddress)
      ) {
        throw new Error(
          "BUY on Solana only supports SOL, USDC, USDT, or USD1 as the funding token.",
        );
      }
      if (isBuy && !isValidSolanaAddress(effectiveOutputTokenAddress)) {
        throw new Error(
          `outputTokenAddress is required and must be a valid Solana token address (base58 format, typically 32-44 characters). Got: "${effectiveOutputTokenAddress}"`,
        );
      }
      if (!isBuy && !isValidSolanaAddress(effectiveInputTokenAddress)) {
        throw new Error(
          `inputTokenAddress is required and must be a valid Solana token address (base58 format, typically 32-44 characters). Got: "${effectiveInputTokenAddress}"`,
        );
      }

      const listNodeProvider = await resolveNodeProviders(
        toolContext?.nodeEndpointGroupId,
      );

      const wallets: IWallet[] = await resolveWalletsFromCampaign({
        campaignId: toolContext?.campaignId,
        isAllWallet: toolContext?.isAllWallet || false,
        listProfileIds: toolContext?.listCampaignProfileId || [],
        encryptKey: toolContext?.encryptKey || "",
      });
      if (!wallets.length) {
        throw new Error("No wallets found for the selected campaign profiles");
      }

      // Validate wallet addresses are valid Solana addresses to prevent user choose wrong EVM wallet
      const invalidWallets = wallets.filter(
        (wallet) => !isValidSolanaAddress(wallet.address || ""),
      );
      if (invalidWallets.length > 0) {
        const invalidAddresses = invalidWallets
          .map((wallet) => wallet?.address || "unknown")
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

      // For BUY operations, outputTokenAddress is the asset being bought and
      // inputTokenAddress selects the funding token (defaults to SOL).
      const sellTokenAddress = isBuy
        ? effectiveOutputTokenAddress
        : effectiveInputTokenAddress;

      const jupiterManager = new SwapOnJupiterManager();
      const swapper = await jupiterManager.getSwapOnJupiter(listNodeProvider);
      const solanaProvider = new SolanaProvider();

      const balanceInfo: WalletBalanceInfo[] = [];
      let solPrice = 0;
      if (shouldAutoResolveBuyInputToken) {
        const pricing = new Pricing(1000);
        const [price] = await pricing.getTokenPrice({
          name: "sol_price_for_swap",
          sleep: 0,
          dataSource: PRICE_DATA_SOURCE.COINGECKO,
          coingeckoId: "solana",
          timeout: 10,
        });
        solPrice = price || 0;
      }

      const startTime = new Date().getTime();
      const buyInputTokenLabel =
        SOLANA_BUY_INPUT_TOKEN_LABEL[fundingTokenAddress] || "token";
      let fetchLabel = "token";
      if (isBuy) {
        fetchLabel = shouldAutoResolveBuyInputToken
          ? "auto funding balances"
          : buyInputTokenLabel;
      }
      logEveryWhere({
        message: `[Agent] Fetching ${fetchLabel} for ${wallets.length} wallets`,
      });
      for (const batchWallet of _.chunk(wallets, BALANCE_BATCH_SIZE)) {
        const batchResults = await Promise.all(
          batchWallet.map((wallet) =>
            fetchWalletBalanceInfo({
              walletAddress: wallet?.address || "",
              isBuy,
              shouldAutoResolveBuyInputToken,
              fundingTokenAddress,
              sellTokenAddress,
              buyInputTokenLabel,
              listNodeProvider,
              solanaProvider,
              solPrice,
            }),
          ),
        );
        balanceInfo.push(...batchResults);
      }
      const endTime = new Date().getTime();
      logEveryWhere({
        message: `[Agent] Fetching balance for ${wallets.length} wallets done, take: ${(endTime - startTime) / 1000} seconds`,
      });

      // Per-wallet capacity in USD for auto-resolve BUY (SOL converted via solPrice,
      // stablecoins 1:1). Explicit funding token uses native token amount as before.
      const availableArr = balanceInfo.map(
        (balanceItem) => balanceItem.available || 0,
      );
      const availableTotal = availableArr.reduce(
        (sum, available) => sum + available,
        0,
      );
      if (availableTotal <= 0) {
        let assetName: string;

        if (!isBuy) {
          assetName = "token balance";
        } else if (shouldAutoResolveBuyInputToken) {
          assetName = "funding balance across SOL/USDC/USDT/USD1";
        } else if (fundingTokenAddress === SOL_MINT_ADDRESS) {
          assetName = "SOL after gas buffer";
        } else {
          assetName = `${buyInputTokenLabel} balance`;
        }
        throw new Error(`All wallets have zero available ${assetName}`);
      }

      const resolvedAmountStrategy = resolveAmountStrategy({
        amountStrategy,
        totalAmount,
        amount,
        maxAmount,
      });

      const sellPercentageValue =
        !isBuy && sellPercentage ? resolveSellPercentage(sellPercentage) : null;

      const plannedPerWalletAmounts = computePlannedAmounts({
        count: wallets.length,
        isBuy,
        sellPercentageValue,
        balanceInfo,
        resolvedAmountStrategy,
        amount,
        maxAmount,
        minAmount,
        totalAmount,
      });

      // Clamp planned amounts to per-wallet capacity (USD for auto-resolve BUY, token amount otherwise).
      // TOTAL_SPLIT_RANDOM redistributes leftover capacity; all other strategies clamp only.
      let plannedAdjusted = plannedPerWalletAmounts;
      if (resolvedAmountStrategy === AmountStrategy.TOTAL_SPLIT_RANDOM) {
        const targetTotal = _.sum(plannedPerWalletAmounts);
        plannedAdjusted = redistributeToCapacity(
          plannedPerWalletAmounts,
          availableArr,
          targetTotal,
        );
      } else {
        plannedAdjusted = plannedPerWalletAmounts.map((amount, index) =>
          Math.min(amount, availableArr[index] || 0),
        );
      }

      const results: Array<{
        wallet: string;
        balanceInSol?: number;
        amount: number;
        fundingToken?: string;
        signature: string | null;
        error?: string;
        failureReason?: SwapFailureReason;
      }> = [];

      const actualPerWalletAmounts: number[] = [];
      const usedFundingTokenLabels: string[] = [];
      const amountByFundingToken: Record<string, number> = {};
      let totalAmountUsd = 0;

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
            failureReason: balance.failureReason,
          });
          continue;
        }

        const balanceNum = balance.balance || 0;
        const plannedAmountBig = new Big(plannedAmount.toString());
        let selectedFundingTokenAddress = balance.fundingTokenAddress;
        let selectedFundingTokenLabel = balance.fundingTokenLabel;
        let selectedFundingOption = null as FundingOption | null;

        if (isBuy && shouldAutoResolveBuyInputToken) {
          const fundingResolution = selectFundingOptionForAmount(
            balance.fundingOptions,
            plannedAmountBig,
            SOLANA_AUTO_BUY_FUNDING_PRIORITY,
          );

          if (!fundingResolution) {
            actualPerWalletAmounts.push(0);
            results.push({
              wallet: wallet?.address || "",
              balanceInSol: balanceNum,
              amount: plannedAmount,
              fundingToken: undefined,
              signature: null,
              error:
                "No single funding token can fully cover the requested BUY amount. Supported auto funding order: SOL, USDC, USDT, USD1.",
              failureReason:
                SwapFailureReason.NO_SINGLE_FUNDING_TOKEN_COVERS_AMOUNT,
            });
            continue;
          }

          selectedFundingTokenAddress = fundingResolution.fundingTokenAddress;
          selectedFundingTokenLabel =
            SOLANA_BUY_INPUT_TOKEN_LABEL[selectedFundingTokenAddress] ||
            "token";
          selectedFundingOption = fundingResolution.fundingOption;
        }

        // Use original balance string with Big.js to preserve full precision
        const availableStr = selectedFundingOption
          ? selectedFundingOption.availableStr
          : balance.availableStr || balance.available?.toString() || "0";
        const availableBig = new Big(availableStr);

        // For auto-resolve BUY: plannedAmountBig is in USD — convert to token amount.
        // SOL: divide by price; stablecoins: 1:1. Cap to actual available token amount.
        // For explicit funding or SELL: compare token amount directly.
        let swapAmountBig: Big;
        if (isBuy && shouldAutoResolveBuyInputToken) {
          if (
            selectedFundingTokenAddress === SOL_MINT_ADDRESS &&
            solPrice > 0
          ) {
            swapAmountBig = plannedAmountBig.div(new Big(solPrice.toString()));
          } else {
            swapAmountBig = plannedAmountBig;
          }

          if (swapAmountBig.gt(availableBig)) {
            swapAmountBig = availableBig;
          }
        } else {
          swapAmountBig = plannedAmountBig.lt(availableBig)
            ? plannedAmountBig
            : availableBig;
        }
        const effectiveAmount = swapAmountBig.toNumber();
        actualPerWalletAmounts.push(effectiveAmount > 0 ? effectiveAmount : 0);

        if (!effectiveAmount || effectiveAmount <= 0) {
          const assetName = isBuy
            ? selectedFundingTokenLabel || buyInputTokenLabel
            : "token";
          results.push({
            wallet: wallet?.address || "",
            balanceInSol: balanceNum,
            amount: plannedAmount,
            fundingToken: selectedFundingTokenLabel || undefined,
            signature: null,
            error: `Insufficient ${assetName} balance`,
            failureReason: SwapFailureReason.INSUFFICIENT_BALANCE,
          });
          continue;
        }
        if (selectedFundingTokenLabel) {
          usedFundingTokenLabels.push(selectedFundingTokenLabel);
        }

        const swapInput: IJupiterSwapInput = {
          inputTokenAddress: isBuy
            ? selectedFundingTokenAddress!.trim()
            : sellTokenAddress.trim(),
          inputTokenDecimals: 0,
          outputTokenAddress: isBuy
            ? effectiveOutputTokenAddress!.trim()
            : SOL_MINT_ADDRESS,
          amount: swapAmountBig.toString(), // Use Big.js string to preserve full precision
          slippagePercentage,
          maxPriceImpactPercentage,
          dynamicSlippage: !slippagePercentage,
          pritorityFeeMicroLamport: 0,
          shouldWaitTransactionComfirmed: true,
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

          if (txHash && !err) {
            if (selectedFundingTokenLabel) {
              amountByFundingToken[selectedFundingTokenLabel] =
                (amountByFundingToken[selectedFundingTokenLabel] || 0) +
                effectiveAmount;
            }
            if (shouldAutoResolveBuyInputToken) {
              const usdSpent =
                selectedFundingTokenAddress === SOL_MINT_ADDRESS && solPrice > 0
                  ? swapAmountBig.times(new Big(solPrice.toString())).toNumber()
                  : effectiveAmount;
              totalAmountUsd += usdSpent;
            }
          }

          results.push({
            wallet: wallet?.address || "",
            balanceInSol: balanceNum,
            amount: effectiveAmount,
            fundingToken: selectedFundingTokenLabel || undefined,
            signature: txHash,
            error: err ? extractErrorMessage(err) : undefined,
          });
        } catch (err: any) {
          results.push({
            wallet: wallet?.address || "",
            balanceInSol: balanceNum,
            amount: effectiveAmount,
            fundingToken: selectedFundingTokenLabel || undefined,
            signature: null,
            error: extractErrorMessage(err),
            failureReason: SwapFailureReason.SWAP_EXECUTION_FAILED,
          });
        }
      }

      const successCount = results.filter(
        (result) => result.signature && !result.error,
      ).length;
      const skippedEntries = results.filter(
        (result) =>
          result.error &&
          Boolean(result.failureReason) &&
          BALANCE_SKIP_REASONS.has(result.failureReason as SwapFailureReason),
      );
      const failedEntries = results.filter(
        (result) =>
          result.error &&
          (!result.failureReason ||
            !BALANCE_SKIP_REASONS.has(result.failureReason)),
      );
      const totalSwapped = actualPerWalletAmounts.reduce((a, b) => a + b, 0);
      const fundingTokenSummary = countByKey(
        usedFundingTokenLabels,
        (label) => label,
      );
      const failureReasonSummary = countByKey(
        failedEntries,
        (entry) => entry.failureReason,
      );

      // Consume the approval after execution — any retry attempt will be blocked
      // at the planState check, preventing double-spend without re-approval
      if (successCount > 0) {
        toolContext?.resetPlanState();
      }

      let inputToken: string | undefined;
      if (!isBuy) {
        inputToken = effectiveInputTokenAddress?.trim();
      } else if (shouldAutoResolveBuyInputToken) {
        inputToken = "AUTO";
      } else {
        inputToken =
          SOLANA_BUY_INPUT_TOKEN_LABEL[fundingTokenAddress] ||
          fundingTokenAddress?.trim();
      }

      const output = {
        chain: "Solana",
        swapDirection,
        inputToken,
        outputToken: isBuy ? effectiveOutputTokenAddress?.trim() : "SOL",
        strategy:
          sellPercentageValue !== null
            ? `SELL_${sellPercentageValue}%`
            : resolvedAmountStrategy,
        summary: {
          total: wallets.length,
          successCount,
          skippedCount: skippedEntries.length,
          failedCount: failedEntries.length,
          ...(shouldAutoResolveBuyInputToken
            ? { totalAmountUsd, totalByFundingToken: amountByFundingToken }
            : { totalAmount: totalSwapped }),
          ...(isBuy &&
            shouldAutoResolveBuyInputToken && {
              fundingTokens: fundingTokenSummary,
              failureReasons: failureReasonSummary,
            }),
        },
        ...(wallets.length <= 5 && {
          results: results.map((result) => ({
            wallet: result.wallet,
            amount: result.amount,
            ...(result.fundingToken && { fundingToken: result.fundingToken }),
            txHash: result.signature,
            ...(result.error && { error: result.error }),
            ...(result.failureReason && {
              failureReason: result.failureReason,
            }),
          })),
        }),
        ...(wallets.length > 5 &&
          failedEntries.length > 0 && { failures: failedEntries }),
      };

      logEveryWhere({
        message: `[swap_on_jupiter] tool result: ${safeStringify(output)}`,
      });
      return safeStringify(output);
    },
  });

const resolveAutoBuyFundingForWallet = async ({
  walletAddress,
  listNodeProvider,
  solanaProvider,
  solPrice,
  outputTokenAddress,
}: {
  walletAddress: string;
  listNodeProvider: string[];
  solanaProvider: SolanaProvider;
  solPrice: number;
  outputTokenAddress: string;
}): Promise<WalletBalanceInfo> => {
  const stablecoinFundingMints = SOLANA_AUTO_BUY_FUNDING_PRIORITY.filter(
    (mint) => mint !== SOL_MINT_ADDRESS && mint !== outputTokenAddress,
  );

  const [[gasBalanceStr, gasBalanceErr], [stablecoinBalances, stablecoinErr]] =
    await Promise.all([
      solanaProvider.getNativeBalance(walletAddress, listNodeProvider, 15000),
      solanaProvider.getTokenBalancesByOwner(
        walletAddress,
        listNodeProvider,
        stablecoinFundingMints,
        15000,
      ),
    ]);

  if (gasBalanceErr) {
    return makeBalanceError(
      extractErrorMessage(gasBalanceErr),
      SwapFailureReason.BALANCE_FETCH_FAILED,
    );
  }

  const gasBalanceBig = new Big(gasBalanceStr || "0");
  if (gasBalanceBig.lte(MIN_SOL_REQUIRED_FOR_SWAP_GAS)) {
    return makeBalanceError(
      `Insufficient SOL for gas. Requires more than ${MIN_SOL_REQUIRED_FOR_SWAP_GAS} SOL.`,
      SwapFailureReason.INSUFFICIENT_GAS_SOL,
      {
        balance: Number(gasBalanceStr || "0"),
        balanceStr: gasBalanceStr,
        availableStr: "0",
        gasBalanceStr,
      },
    );
  }

  if (stablecoinErr) {
    return makeBalanceError(
      extractErrorMessage(stablecoinErr),
      SwapFailureReason.BALANCE_FETCH_FAILED,
      { gasBalanceStr },
    );
  }

  const fundingOptions: FundingOptions = {};

  const solAvailableBig = gasBalanceBig.minus(SOL_SPENDABLE_GAS_RESERVE).gt(0)
    ? gasBalanceBig.minus(SOL_SPENDABLE_GAS_RESERVE)
    : new Big(0);
  const solAvailableUsd =
    solPrice > 0
      ? solAvailableBig.times(new Big(solPrice.toString())).toNumber()
      : 0;
  if (outputTokenAddress !== SOL_MINT_ADDRESS) {
    fundingOptions[SOL_MINT_ADDRESS] = {
      balance: gasBalanceBig.toNumber(),
      balanceStr: gasBalanceBig.toString(),
      available: solAvailableBig.toNumber(),
      availableStr: solAvailableBig.toString(),
      availableUsd: solAvailableUsd,
    };
  }

  stablecoinFundingMints.forEach((mint) => {
    const stableBalanceStr = stablecoinBalances?.[mint] || "0";
    const stableBalanceBig = new Big(stableBalanceStr);
    fundingOptions[mint] = {
      balance: stableBalanceBig.toNumber(),
      balanceStr: stableBalanceStr,
      available: stableBalanceBig.toNumber(),
      availableStr: stableBalanceBig.toString(),
      availableUsd: stableBalanceBig.toNumber(), // stablecoins are 1:1 USD
    };
  });

  const maxAvailableUsdBig = getMaxAvailableFundingAmountUsd(fundingOptions);

  return {
    balance: maxAvailableUsdBig.toNumber(),
    balanceStr: maxAvailableUsdBig.toString(),
    available: maxAvailableUsdBig.toNumber(),
    availableStr: maxAvailableUsdBig.toString(),
    gasBalanceStr,
    fundingTokenAddress: null,
    fundingTokenLabel: null,
    fundingOptions,
    error: null,
  };
};

const resolveEffectiveTokenAddress = (
  swapDirection: SwapDirection,
  resolveFor: SwapDirection,
  tokenAddress: string,
  contextTokenAddress: string | undefined,
): string => {
  // this function is called twice — once for BUY (output token) and once for SELL (input token).
  // if the actual swapDirection doesn't match the one this call is responsible for, skip and return as-is.
  if (swapDirection !== resolveFor) {
    return tokenAddress;
  }
  if (tokenAddress && isValidSolanaAddress(tokenAddress)) {
    return tokenAddress;
  }
  if (contextTokenAddress && isValidSolanaAddress(contextTokenAddress)) {
    return contextTokenAddress;
  }

  return tokenAddress;
};

const fetchWalletBalanceInfo = async ({
  walletAddress,
  isBuy,
  shouldAutoResolveBuyInputToken,
  fundingTokenAddress,
  sellTokenAddress,
  buyInputTokenLabel,
  listNodeProvider,
  solanaProvider,
  solPrice,
}: {
  walletAddress: string;
  isBuy: boolean;
  shouldAutoResolveBuyInputToken: boolean;
  fundingTokenAddress: string | null;
  sellTokenAddress: string;
  buyInputTokenLabel: string;
  listNodeProvider: string[];
  solanaProvider: SolanaProvider;
  solPrice: number;
}): Promise<WalletBalanceInfo> => {
  if (isBuy && shouldAutoResolveBuyInputToken) {
    return resolveAutoBuyFundingForWallet({
      walletAddress,
      listNodeProvider,
      solanaProvider,
      solPrice,
      outputTokenAddress: sellTokenAddress,
    });
  }

  let balanceStr: string | null = null;
  let balanceErr: Error | null | undefined = null;
  let gasBalanceStr: string | null = null;
  let gasBalanceErr: Error | null | undefined = null;

  if (isBuy) {
    if (fundingTokenAddress === SOL_MINT_ADDRESS) {
      [balanceStr, balanceErr] = await solanaProvider.getNativeBalance(
        walletAddress,
        listNodeProvider,
        15000,
      );
    } else {
      [balanceStr, balanceErr] = await solanaProvider.getWalletBalance(
        listNodeProvider,
        TOKEN_TYPE.SOLANA_TOKEN,
        walletAddress,
        fundingTokenAddress!,
        15000,
      );
      [gasBalanceStr, gasBalanceErr] = await solanaProvider.getNativeBalance(
        walletAddress,
        listNodeProvider,
        15000,
      );
    }
  } else {
    [balanceStr, balanceErr] = await solanaProvider.getWalletBalance(
      listNodeProvider,
      TOKEN_TYPE.SOLANA_TOKEN,
      walletAddress,
      sellTokenAddress,
      15000,
    );
  }

  if (balanceErr) {
    return makeBalanceError(
      extractErrorMessage(balanceErr),
      SwapFailureReason.BALANCE_FETCH_FAILED,
    );
  }

  if (isBuy && fundingTokenAddress !== SOL_MINT_ADDRESS) {
    if (gasBalanceErr) {
      return makeBalanceError(
        extractErrorMessage(gasBalanceErr),
        SwapFailureReason.BALANCE_FETCH_FAILED,
        { balanceStr, gasBalanceStr },
      );
    }
    const gasBalanceBig = new Big(gasBalanceStr || "0");
    if (gasBalanceBig.lte(MIN_SOL_REQUIRED_FOR_SWAP_GAS)) {
      return makeBalanceError(
        `Insufficient SOL for gas. Requires more than ${MIN_SOL_REQUIRED_FOR_SWAP_GAS} SOL.`,
        SwapFailureReason.INSUFFICIENT_GAS_SOL,
        {
          balance: Number(balanceStr || "0"),
          balanceStr,
          availableStr: "0",
          gasBalanceStr,
        },
      );
    }
  }

  const balanceBig = new Big(balanceStr || "0");
  let availableBig: Big;
  if (!isBuy || fundingTokenAddress !== SOL_MINT_ADDRESS) {
    availableBig = balanceBig;
  } else {
    availableBig = balanceBig.minus(SOL_SPENDABLE_GAS_RESERVE).gt(0)
      ? balanceBig.minus(SOL_SPENDABLE_GAS_RESERVE)
      : new Big(0);
  }

  return {
    balance: balanceBig.toNumber(),
    balanceStr,
    available: availableBig.toNumber(),
    availableStr: availableBig.toString(),
    gasBalanceStr,
    fundingTokenAddress: isBuy ? fundingTokenAddress : sellTokenAddress,
    fundingTokenLabel: isBuy ? buyInputTokenLabel : "token",
    error: null,
  };
};
