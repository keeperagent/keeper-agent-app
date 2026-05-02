import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { ethers } from "ethers";
import Big from "big.js";
import _ from "lodash";
import { KyberswapManager } from "@/electron/simulator/category/onchain/kyberswap";
import {
  TOKEN_TYPE,
  KYBERSWAP_CHAIN_KEY,
  EVM_TRANSACTION_TYPE,
  SwapDirection,
  mapEvmStableCoinAddress,
  EvmStableCoinSymbol,
  PRICE_DATA_SOURCE,
} from "@/electron/constant";
import { ISwapKyberswapInput, IWallet } from "@/electron/type";
import { EVMProvider } from "@/electron/simulator/category/onchain/evm";
import { logEveryWhere, sleep } from "@/electron/service/util";
import { ToolContext, PlanState } from "@/electron/agentCore/toolContext";
import { safeStringify } from "@/electron/agentCore/utils";
import { Pricing } from "@/electron/simulator/category/pricing";
import {
  redistributeToCapacity,
  capitalizeFirstLetter,
  extractErrorMessage,
  AmountStrategy,
} from "../utils";
import { TOOL_KEYS } from "@/electron/constant";
import {
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

const BALANCE_BATCH_SIZE = 10;
const NATIVE_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const EVM_BUY_FUNDING_PRIORITY: EvmStableCoinSymbol[] = [
  EvmStableCoinSymbol.USDC,
  EvmStableCoinSymbol.USDT,
  EvmStableCoinSymbol.DAI,
  EvmStableCoinSymbol.USDB,
];

const swapOnKyberswapSchema = z
  .object({
    swapDirection: z.nativeEnum(SwapDirection).describe("BUY or SELL"),
    inputTokenSymbol: z
      .string()
      .nullish()
      .describe(
        "Token symbol for BUY funding — use this when specifying a named token (e.g. 'ETH', 'BNB', 'USDT', 'USDC', 'DAI'). The tool resolves the symbol to the correct chain address. Do NOT put a symbol in inputTokenAddress.",
      ),
    inputTokenAddress: z
      .string()
      .nullish()
      .refine(
        (val) => {
          if (!val || val.trim() === "") {
            return true;
          }
          return ethers.utils.isAddress(val);
        },
        {
          message:
            "Must be a valid EVM address (0x + 40 hex chars). For named tokens use inputTokenSymbol instead. Pass empty string to auto-resolve for BUY.",
        },
      )
      .describe(
        "Raw ERC20 address only — no symbols. BUY: optional explicit funding token (leave empty to auto-resolve native→USDC→USDT→DAI→USDB per wallet; amounts in USD). SELL: token to sell. Use inputTokenSymbol for named tokens.",
      ),
    outputTokenAddress: z
      .string()
      .describe("ERC20 address. BUY only — pass empty string for SELL."),
    amountStrategy: z
      .nativeEnum(AmountStrategy)
      .nullish()
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

const mapChainKeyToNativeTokenCoingeckoId: Partial<
  Record<KYBERSWAP_CHAIN_KEY, string>
> = {
  [KYBERSWAP_CHAIN_KEY.ETHEREUM]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.ARBITRUM]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.BASE]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.OPTIMISM]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.ZKSYNC]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.LINEA]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.SCROLL]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.BLAST]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.UNICHAIN]: "ethereum",
  [KYBERSWAP_CHAIN_KEY.BSC]: "binancecoin",
  [KYBERSWAP_CHAIN_KEY.POLYGON]: "polygon-ecosystem-token",
  [KYBERSWAP_CHAIN_KEY.AVALANCHE]: "avalanche-2",
  [KYBERSWAP_CHAIN_KEY.MANTLE]: "mantle",
  [KYBERSWAP_CHAIN_KEY.SONIC]: "sonic-3",
  [KYBERSWAP_CHAIN_KEY.BERACHAIN]: "berachain-bera",
  [KYBERSWAP_CHAIN_KEY.RONIN]: "ronin",
  [KYBERSWAP_CHAIN_KEY.MONAD]: "monad",
  [KYBERSWAP_CHAIN_KEY.PLASMA]: "plasma",
  [KYBERSWAP_CHAIN_KEY.HYPEREVM]: "hyperliquid",
};

const resolveFundingLabel = (
  address: string,
  nativeTokenLabel: string,
  stablecoinEntries: Array<{ address: string; label: string }>,
): string => {
  if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS) {
    return nativeTokenLabel;
  }
  return (
    stablecoinEntries.find(
      (entry) => entry.address.toLowerCase() === address.toLowerCase(),
    )?.label || address
  );
};

export const swapOnKyberswapTool = (
  toolContext?: ToolContext,
): DynamicStructuredTool =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.SWAP_ON_KYBERSWAP,
    description:
      "Swap tokens on EVM chains via Kyberswap. BUY = swap one funding token per wallet into the target ERC20. If the user names a funding token (e.g. 'USDC', 'USDT', 'ETH', 'BNB'), pass the symbol in inputTokenSymbol and the amount in that token's native quantity (e.g. 'buy with 10 USDT' means inputTokenSymbol='USDT', amount=10). If the user does not specify a funding token, leave both inputTokenSymbol and inputTokenAddress empty to auto-resolve by priority (native coin, then USDC, then USDT, then DAI, then USDB) with amount in USD. SELL = swap the target ERC20 back to the native coin. Strategies: EQUAL_PER_WALLET, RANDOM_PER_WALLET, TOTAL_SPLIT_RANDOM. EVM only — use swap_on_jupiter for Solana.",
    schema: swapOnKyberswapSchema,
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
      slippage = 2,
      priceImpact = 5,
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
      const isBuy = swapDirection === SwapDirection.BUY;

      if (inputTokenSymbol) {
        const symbolUpper = inputTokenSymbol.toUpperCase();
        const nativeLabel = (mapNativeTokenName[chainKey] || "").toUpperCase();
        if (symbolUpper === nativeLabel) {
          inputTokenAddress = NATIVE_TOKEN_ADDRESS;
        } else {
          const chainStablecoins = mapEvmStableCoinAddress[chainKey] || {};
          const resolved = chainStablecoins[symbolUpper as EvmStableCoinSymbol];
          if (resolved) {
            inputTokenAddress = resolved;
          }
        }
      }

      if (isBuy && sellPercentage) {
        throw new Error("sellPercentage can only be used for SELL operations");
      }

      const isValidEVMAddress = (address: string): boolean =>
        ethers.utils.isAddress(address);

      const isEvmChain =
        !toolContext?.chainKey ||
        toolContext.chainKey.toLowerCase() !== "solana";

      const effectiveOutputTokenAddress = (() => {
        if (swapDirection !== SwapDirection.BUY) {
          return outputTokenAddress;
        }
        if (outputTokenAddress && isValidEVMAddress(outputTokenAddress)) {
          return outputTokenAddress;
        }
        const ctxAddr = toolContext?.tokenAddress;
        if (isEvmChain && ctxAddr && isValidEVMAddress(ctxAddr)) {
          return ctxAddr;
        }
        return outputTokenAddress;
      })();

      const effectiveInputTokenAddress = (() => {
        if (swapDirection !== SwapDirection.SELL) {
          return inputTokenAddress;
        }
        if (inputTokenAddress && isValidEVMAddress(inputTokenAddress)) {
          return inputTokenAddress;
        }
        const ctxAddr = toolContext?.tokenAddress;
        if (isEvmChain && ctxAddr && isValidEVMAddress(ctxAddr)) {
          return ctxAddr;
        }
        return inputTokenAddress;
      })();

      if (isBuy && effectiveOutputTokenAddress) {
        if (!isValidEVMAddress(effectiveOutputTokenAddress)) {
          throw new Error(
            `Invalid EVM token address: ${effectiveOutputTokenAddress}. Please provide a valid EVM token address (0x followed by 40 hex characters).`,
          );
        }
      }

      if (!isBuy && effectiveInputTokenAddress) {
        if (!isValidEVMAddress(effectiveInputTokenAddress)) {
          throw new Error(
            `Invalid EVM token address: ${effectiveInputTokenAddress}. Please provide a valid EVM token address (0x followed by 40 hex characters).`,
          );
        }
      }

      // For BUY: fundingTokenAddress is the explicit ERC20 input token (stablecoin).
      // Empty means auto-resolve native→stablecoins per wallet.
      const fundingTokenAddress =
        isBuy && effectiveInputTokenAddress ? effectiveInputTokenAddress : null;
      const shouldAutoResolveBuyInputToken = isBuy && !fundingTokenAddress;

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
        throw new Error(
          "No valid wallets found in the selected campaign profiles",
        );
      }

      const invalidWallets = wallets.filter((wallet) => {
        if (!wallet?.address) {
          return true;
        }
        return !ethers.utils.isAddress(wallet.address);
      });

      if (invalidWallets.length > 0) {
        const invalidAddresses = invalidWallets
          .map((wallet) => wallet?.address || "unknown")
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

      const evmProvider = new EVMProvider();
      const kyberswapManager = new KyberswapManager();
      const kyberswap = await kyberswapManager.getKyberswap(listNodeProvider);

      const nativeTokenLabel = mapNativeTokenName[chainKey] || "native";

      // Build the list of stablecoins available on this chain in priority order
      const chainStablecoins = mapEvmStableCoinAddress[chainKey] || {};
      const stablecoinEntries = EVM_BUY_FUNDING_PRIORITY.filter(
        (symbol) => chainStablecoins[symbol],
      )
        .map((symbol) => ({
          symbol,
          address: chainStablecoins[symbol]!,
          label: symbol as string,
        }))
        .filter(
          (entry) =>
            entry.address.toLowerCase() !==
            effectiveOutputTokenAddress?.toLowerCase(),
        );
      const fundingPriorityAddresses = [
        NATIVE_TOKEN_ADDRESS,
        ...stablecoinEntries.map((entry) => entry.address),
      ].filter(
        (address) =>
          address.toLowerCase() !== effectiveOutputTokenAddress?.toLowerCase(),
      );

      const explicitBuyFundingLabel = fundingTokenAddress
        ? resolveFundingLabel(
            fundingTokenAddress,
            nativeTokenLabel,
            stablecoinEntries,
          )
        : "AUTO";

      const balanceInfo: WalletBalanceInfo[] = [];
      let nativePrice = 0;

      if (shouldAutoResolveBuyInputToken) {
        const nativeCoingeckoId = mapChainKeyToNativeTokenCoingeckoId[chainKey];
        if (nativeCoingeckoId) {
          const pricing = new Pricing(1000);
          const [price] = await pricing.getTokenPrice({
            name: "native_price_for_swap",
            sleep: 0,
            dataSource: PRICE_DATA_SOURCE.COINGECKO,
            coingeckoId: nativeCoingeckoId,
            timeout: 10,
          });
          nativePrice = price || 0;
        }
      }

      logEveryWhere({
        message: `[Agent] Fetching balance for ${wallets.length} wallets...`,
      });
      const startTime = new Date().getTime();

      for (const batch of _.chunk(wallets, BALANCE_BATCH_SIZE)) {
        const batchResults = await Promise.all(
          batch.map(async (wallet) => {
            if (shouldAutoResolveBuyInputToken) {
              return resolveAutoEvmBuyFundingForWallet({
                walletAddress: wallet?.address || "",
                listNodeProvider,
                evmProvider,
                nativePrice,
                stablecoinEntries,
                outputTokenAddress: effectiveOutputTokenAddress || "",
              });
            }

            if (isBuy && fundingTokenAddress) {
              const isNativeFunding =
                fundingTokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS;
              const [balanceStr, balanceErr] =
                await evmProvider.getWalletBalance(
                  listNodeProvider,
                  isNativeFunding
                    ? TOKEN_TYPE.NATIVE_TOKEN
                    : TOKEN_TYPE.EVM_ERC20_TOKEN,
                  wallet?.address || "",
                  fundingTokenAddress,
                  15000,
                );
              if (balanceErr) {
                return makeBalanceError(
                  extractErrorMessage(balanceErr),
                  SwapFailureReason.BALANCE_FETCH_FAILED,
                );
              }
              const balanceNum = Number(balanceStr || "0");
              return {
                balance: balanceNum,
                balanceStr,
                available: balanceNum,
                availableStr: balanceStr || "0",
                fundingTokenAddress,
                fundingTokenLabel: explicitBuyFundingLabel,
                error: null,
              } as WalletBalanceInfo;
            }

            // SELL: fetch ERC20 token balance
            const [balanceStr, balanceErr] = await evmProvider.getWalletBalance(
              listNodeProvider,
              TOKEN_TYPE.EVM_ERC20_TOKEN,
              wallet?.address || "",
              tokenAddress,
              15000,
            );
            if (balanceErr) {
              return makeBalanceError(
                extractErrorMessage(balanceErr),
                SwapFailureReason.BALANCE_FETCH_FAILED,
              );
            }
            const balanceNum = Number(balanceStr || "0");
            return {
              balance: balanceNum,
              balanceStr,
              available: balanceNum,
              availableStr: balanceStr || "0",
              fundingTokenAddress: null,
              fundingTokenLabel: null,
              error: null,
            } as WalletBalanceInfo;
          }),
        );
        balanceInfo.push(...batchResults);
      }

      const endTime = new Date().getTime();
      logEveryWhere({
        message: `[Agent] Fetching balance for ${wallets.length} wallets done, take: ${(endTime - startTime) / 1000} seconds`,
      });

      const availableArr = balanceInfo.map(
        (balanceItem) => balanceItem.available || 0,
      );
      const availableTotal = _.sum(availableArr);
      if (availableTotal <= 0) {
        let assetName: string;
        if (!isBuy) {
          assetName = "token balance";
        } else if (shouldAutoResolveBuyInputToken) {
          assetName = `funding balance across ${nativeTokenLabel}/USDC/USDT/DAI/USDB`;
        } else {
          assetName = explicitBuyFundingLabel;
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
        plannedAdjusted = plannedPerWalletAmounts.map((amt, idx) =>
          Math.min(amt, availableArr[idx] || 0),
        );
      }

      const results: Array<{
        wallet: string;
        amount: number;
        fundingToken?: string;
        txHash: string | null;
        error: string | null;
        failureReason?: SwapFailureReason;
      }> = [];

      const actualPerWalletAmounts: number[] = [];
      const usedFundingTokenLabels: string[] = [];

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
            failureReason: balance.failureReason,
          });
          continue;
        }

        let selectedFundingTokenAddress: string;
        let selectedFundingTokenLabel: string;

        if (shouldAutoResolveBuyInputToken) {
          const plannedAmountBig = new Big(plannedAmount.toString());
          const fundingResolution = selectFundingOptionForAmount(
            balance.fundingOptions,
            plannedAmountBig,
            fundingPriorityAddresses,
          );

          if (!fundingResolution) {
            actualPerWalletAmounts.push(0);
            results.push({
              wallet: wallet?.address || "",
              amount: plannedAmount,
              txHash: null,
              error:
                "No single funding token can fully cover the requested BUY amount. Supported auto funding order: native, USDC, USDT, DAI, USDB.",
              failureReason:
                SwapFailureReason.NO_SINGLE_FUNDING_TOKEN_COVERS_AMOUNT,
            });
            continue;
          }

          selectedFundingTokenAddress = fundingResolution.fundingTokenAddress;
          selectedFundingTokenLabel = resolveFundingLabel(
            selectedFundingTokenAddress,
            nativeTokenLabel,
            stablecoinEntries,
          );
        } else {
          selectedFundingTokenAddress = isBuy
            ? fundingTokenAddress || NATIVE_TOKEN_ADDRESS
            : tokenAddress;
          selectedFundingTokenLabel = isBuy
            ? explicitBuyFundingLabel
            : nativeTokenLabel;
        }

        // For auto-resolve BUY: get the selected funding option's available balance.
        // For explicit funding or SELL: use the wallet-level available balance.
        const availableStr =
          shouldAutoResolveBuyInputToken && balance.fundingOptions
            ? balance.fundingOptions[selectedFundingTokenAddress]
                ?.availableStr || "0"
            : balance.availableStr || balance.available?.toString() || "0";
        const availableBig = new Big(availableStr);
        const plannedAmountBig = new Big(plannedAmount.toString());

        // For auto-resolve BUY: plannedAmountBig is in USD — convert to token amount.
        // Native token: divide by price; stablecoins: 1:1.
        // For explicit funding or SELL: compare token amount directly.
        let swapAmountBig: Big;
        if (isBuy && shouldAutoResolveBuyInputToken) {
          if (
            selectedFundingTokenAddress.toLowerCase() ===
              NATIVE_TOKEN_ADDRESS &&
            nativePrice > 0
          ) {
            swapAmountBig = plannedAmountBig.div(
              new Big(nativePrice.toString()),
            );
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
          const assetName = isBuy ? selectedFundingTokenLabel : "token";
          results.push({
            wallet: wallet?.address || "",
            amount: plannedAmount,
            fundingToken: isBuy ? selectedFundingTokenLabel : undefined,
            txHash: null,
            error: `Insufficient ${assetName} balance`,
            failureReason: SwapFailureReason.INSUFFICIENT_BALANCE,
          });
          continue;
        }

        if (isBuy) {
          usedFundingTokenLabels.push(selectedFundingTokenLabel);
        }

        try {
          const isInputNative =
            !isBuy ||
            selectedFundingTokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS;
          const swapInput: ISwapKyberswapInput = {
            chainKey,
            inputTokenAddress: isInputNative
              ? NATIVE_TOKEN_ADDRESS
              : selectedFundingTokenAddress,
            isInputNativeToken: isInputNative,
            inputTokenDecimal: 0,
            outputTokenAddress: isBuy ? tokenAddress : NATIVE_TOKEN_ADDRESS,
            isOutputNativeToken: !isBuy,
            outputTokenDecimal: 0,
            amount: swapAmountBig.toString(),
            slippage,
            priceImpact,
            dealineInSecond: 15,
            gasLimit: ethers.BigNumber.from(0),
            isUseCustomGasLimit: false,
            transactionType: EVM_TRANSACTION_TYPE.LEGACY,
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            gasPrice: undefined,
            isUseCustomGasPrice: false,
            shouldWaitTransactionComfirmed: true,
            includedSources: "",
            excludedSources: "",
          };

          const logInfo = {
            campaignId: toolContext?.campaignId,
            workflowId: 0,
          };

          const [txHash, err] = await kyberswap.swapNormal(
            swapInput,
            wallet?.privateKey || "",
            15000,
            logInfo,
          );
          results.push({
            wallet: wallet?.address || "",
            amount: effectiveAmount,
            fundingToken: isBuy ? selectedFundingTokenLabel : undefined,
            txHash: txHash || null,
            error: err ? extractErrorMessage(err) : null,
          });
        } catch (err: any) {
          results.push({
            wallet: wallet?.address || "",
            amount: effectiveAmount,
            fundingToken: isBuy ? selectedFundingTokenLabel : undefined,
            txHash: null,
            error: extractErrorMessage(err),
            failureReason: SwapFailureReason.SWAP_EXECUTION_FAILED,
          });
        }

        if (i < wallets.length - 1) {
          await sleep(100);
        }
      }

      const successCount = results.filter(
        (result) => result.txHash && !result.error,
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
      const totalSwapped = _.sum(actualPerWalletAmounts);
      const failureReasonSummary = countByKey(
        failedEntries,
        (entry) => entry.failureReason,
      );

      if (successCount > 0) {
        toolContext?.resetPlanState();
      }

      let inputTokenDisplay: string;
      if (!isBuy) {
        inputTokenDisplay = tokenAddress;
      } else if (shouldAutoResolveBuyInputToken) {
        inputTokenDisplay = "AUTO";
      } else {
        inputTokenDisplay = explicitBuyFundingLabel;
      }

      const toolResult = safeStringify({
        chain: capitalizeFirstLetter(chainKey),
        swapDirection,
        inputToken: inputTokenDisplay,
        outputToken: isBuy
          ? tokenAddress
          : mapNativeTokenName[chainKey] || "native",
        strategy:
          sellPercentageValue !== null
            ? `SELL_${sellPercentageValue}%`
            : resolvedAmountStrategy,
        summary: {
          total: wallets.length,
          successCount,
          skippedCount: skippedEntries.length,
          failedCount: failedEntries.length,
          totalAmount: totalSwapped,
          ...(isBuy &&
            shouldAutoResolveBuyInputToken &&
            usedFundingTokenLabels.length > 0 && {
              fundingTokens: countByKey(
                usedFundingTokenLabels,
                (label) => label,
              ),
            }),
          ...(failedEntries.length > 0 && {
            failureReasons: failureReasonSummary,
          }),
        },
        ...(wallets.length <= 5 && {
          results: results.map((result) => ({
            wallet: result.wallet,
            amount: result.amount,
            ...(result.fundingToken && { fundingToken: result.fundingToken }),
            txHash: result.txHash,
            ...(result.error && { error: result.error }),
            ...(result.failureReason && {
              failureReason: result.failureReason,
            }),
          })),
        }),
        ...(wallets.length > 5 &&
          failedEntries.length > 0 && { failures: failedEntries }),
      });

      const firstTxHash = results.find((result) => result.txHash)?.txHash;
      const txHashSummary = firstTxHash
        ? ` tx=${firstTxHash.slice(0, 8)}...`
        : "";
      logEveryWhere({
        message: `[swap_on_kyberswap] done chain=${capitalizeFirstLetter(chainKey)} dir=${swapDirection} total=${wallets.length} success=${successCount} failed=${failedEntries.length} amount=${totalSwapped}${txHashSummary}`,
      });
      return toolResult;
    },
  });

const resolveAutoEvmBuyFundingForWallet = async ({
  walletAddress,
  listNodeProvider,
  evmProvider,
  nativePrice,
  stablecoinEntries,
  outputTokenAddress,
}: {
  walletAddress: string;
  listNodeProvider: string[];
  evmProvider: EVMProvider;
  nativePrice: number;
  stablecoinEntries: Array<{
    symbol: EvmStableCoinSymbol;
    address: string;
    label: string;
  }>;
  outputTokenAddress: string;
}): Promise<WalletBalanceInfo> => {
  const [nativeResult, ...stableResults] = await Promise.all([
    evmProvider.getWalletBalance(
      listNodeProvider,
      TOKEN_TYPE.NATIVE_TOKEN,
      walletAddress,
      "",
      15000,
    ),
    ...stablecoinEntries.map((entry) =>
      evmProvider.getWalletBalance(
        listNodeProvider,
        TOKEN_TYPE.EVM_ERC20_TOKEN,
        walletAddress,
        entry.address,
        15000,
      ),
    ),
  ]);

  const [nativeBalanceStr, nativeErr] = nativeResult;
  if (nativeErr) {
    return makeBalanceError(
      extractErrorMessage(nativeErr),
      SwapFailureReason.BALANCE_FETCH_FAILED,
    );
  }

  const fundingOptions: FundingOptions = {};

  const nativeBalanceBig = new Big(nativeBalanceStr || "0");
  const nativeAvailableUsd =
    nativePrice > 0
      ? nativeBalanceBig.times(new Big(nativePrice.toString())).toNumber()
      : 0;
  if (outputTokenAddress.toLowerCase() !== NATIVE_TOKEN_ADDRESS) {
    fundingOptions[NATIVE_TOKEN_ADDRESS] = {
      balance: nativeBalanceBig.toNumber(),
      balanceStr: nativeBalanceBig.toString(),
      available: nativeBalanceBig.toNumber(),
      availableStr: nativeBalanceBig.toString(),
      availableUsd: nativeAvailableUsd,
    };
  }

  let firstStableError: string | null = null;
  stablecoinEntries.forEach((entry, idx) => {
    const [stableBalanceStr, stableErr] = stableResults[idx];
    if (stableErr) {
      if (!firstStableError) {
        firstStableError = extractErrorMessage(stableErr);
      }
      fundingOptions[entry.address] = {
        balance: 0,
        balanceStr: "0",
        available: 0,
        availableStr: "0",
        availableUsd: 0,
        fetchFailed: true,
      };
      return;
    }
    const stableBalanceBig = new Big(stableBalanceStr || "0");
    fundingOptions[entry.address] = {
      balance: stableBalanceBig.toNumber(),
      balanceStr: stableBalanceBig.toString(),
      available: stableBalanceBig.toNumber(),
      availableStr: stableBalanceBig.toString(),
      availableUsd: stableBalanceBig.toNumber(), // stablecoins are 1:1 USD
    };
  });

  const maxAvailableUsdBig = getMaxAvailableFundingAmountUsd(fundingOptions);

  if (firstStableError && maxAvailableUsdBig.eq(0)) {
    return makeBalanceError(
      firstStableError,
      SwapFailureReason.BALANCE_FETCH_FAILED,
    );
  }

  return {
    balance: maxAvailableUsdBig.toNumber(),
    balanceStr: maxAvailableUsdBig.toString(),
    available: maxAvailableUsdBig.toNumber(),
    availableStr: maxAvailableUsdBig.toString(),
    fundingTokenAddress: null,
    fundingTokenLabel: null,
    fundingOptions,
    error: null,
  };
};
