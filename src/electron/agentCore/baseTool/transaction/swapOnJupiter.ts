import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { PublicKey } from "@solana/web3.js";
import Big from "big.js";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { SwapOnJupiterManager } from "@/electron/simulator/category/onchain/jupiter";
import {
  SOL_MINT_ADDRESS,
  SwapDirection,
  TOKEN_TYPE,
  USDC_MINT_ADDRESS_ON_SOLANA,
  USDT_MINT_ADDRESS_ON_SOLANA,
  USD1_MINT_ADDRESS_ON_SOLANA,
} from "@/electron/constant";
import { IJupiterSwapInput, ICampaignProfile, IWallet } from "@/electron/type";
import { safeStringify } from "@/electron/agentCore/utils";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { decryptWallet } from "@/electron/service/wallet";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import { logEveryWhere } from "@/electron/service/util";
import { ToolContext, PlanState } from "@/electron/agentCore/toolContext";
import { redistributeToCapacity, extractErrorMessage } from "../utils";
import { TOOL_KEYS } from "@/electron/constant";

const MIN_SOL_REQUIRED_FOR_SWAP_GAS = 0.0005;
const SOL_SPENDABLE_GAS_RESERVE = MIN_SOL_REQUIRED_FOR_SWAP_GAS;
const BALANCE_BATCH_SIZE = 10;
const SOLANA_AUTO_BUY_FUNDING_PRIORITY = [
  USDC_MINT_ADDRESS_ON_SOLANA,
  USDT_MINT_ADDRESS_ON_SOLANA,
  USD1_MINT_ADDRESS_ON_SOLANA,
  SOL_MINT_ADDRESS,
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

type FundingOption = {
  balance: number;
  balanceStr: string;
  available: number;
  availableStr: string;
};

type FundingOptions = Partial<Record<string, FundingOption>>;

type WalletBalanceInfo = {
  balance: number | null;
  balanceStr: string | null;
  available: number;
  availableStr: string | null;
  gasBalanceStr: string | null;
  fundingTokenAddress: string | null;
  fundingTokenLabel: string | null;
  fundingOptions?: FundingOptions;
  error: string | null;
  failureReason?: string;
};

const getDefinedFundingOptions = (
  fundingOptions: FundingOptions,
): FundingOption[] =>
  Object.values(fundingOptions).filter((option): option is FundingOption =>
    Boolean(option),
  );

const selectFundingOptionForAmount = (
  fundingOptions: FundingOptions | undefined,
  plannedAmountBig: Big,
): { fundingTokenAddress: string; fundingOption: FundingOption } | null => {
  if (!fundingOptions) return null;

  const matchedMint = SOLANA_AUTO_BUY_FUNDING_PRIORITY.find((mint) => {
    const option = fundingOptions[mint];
    if (!option) return false;
    return new Big(option.availableStr || "0").gte(plannedAmountBig);
  });

  if (!matchedMint) return null;

  return {
    fundingTokenAddress: matchedMint,
    fundingOption: fundingOptions[matchedMint]!,
  };
};

const getMaxAvailableFundingAmount = (fundingOptions: FundingOptions): Big =>
  getDefinedFundingOptions(fundingOptions).reduce((currentMax, option) => {
    const optionAvailableBig = new Big(option.availableStr || "0");
    return optionAvailableBig.gt(currentMax) ? optionAvailableBig : currentMax;
  }, new Big(0));

const resolveAutoBuyFundingForWallet = async ({
  walletAddress,
  listNodeProvider,
  solanaProvider,
}: {
  walletAddress: string;
  listNodeProvider: string[];
  solanaProvider: SolanaProvider;
}): Promise<WalletBalanceInfo> => {
  const stablecoinFundingMints = SOLANA_AUTO_BUY_FUNDING_PRIORITY.filter(
    (mint) => mint !== SOL_MINT_ADDRESS,
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
    return {
      balance: null,
      balanceStr: null,
      available: 0,
      availableStr: null,
      gasBalanceStr: null,
      fundingTokenAddress: null,
      fundingTokenLabel: null,
      error: extractErrorMessage(gasBalanceErr),
      failureReason: "balance_fetch_failed",
    };
  }

  const gasBalanceBig = new Big(gasBalanceStr || "0");
  if (gasBalanceBig.lte(MIN_SOL_REQUIRED_FOR_SWAP_GAS)) {
    return {
      balance: Number(gasBalanceStr || "0"),
      balanceStr: gasBalanceStr,
      available: 0,
      availableStr: "0",
      gasBalanceStr,
      fundingTokenAddress: null,
      fundingTokenLabel: null,
      error: `Insufficient SOL for gas. Requires more than ${MIN_SOL_REQUIRED_FOR_SWAP_GAS} SOL.`,
      failureReason: "insufficient_gas_sol",
    };
  }

  if (stablecoinErr) {
    return {
      balance: null,
      balanceStr: null,
      available: 0,
      availableStr: null,
      gasBalanceStr,
      fundingTokenAddress: null,
      fundingTokenLabel: null,
      error: extractErrorMessage(stablecoinErr),
      failureReason: "balance_fetch_failed",
    };
  }

  const fundingOptions: FundingOptions = {};
  stablecoinFundingMints.forEach((mint) => {
    const stableBalanceStr = stablecoinBalances?.[mint] || "0";
    const stableBalanceBig = new Big(stableBalanceStr);
    fundingOptions[mint] = {
      balance: stableBalanceBig.toNumber(),
      balanceStr: stableBalanceStr,
      available: stableBalanceBig.toNumber(),
      availableStr: stableBalanceBig.toString(),
    };
  });

  const solAvailableBig = gasBalanceBig.minus(SOL_SPENDABLE_GAS_RESERVE).gt(0)
    ? gasBalanceBig.minus(SOL_SPENDABLE_GAS_RESERVE)
    : new Big(0);
  fundingOptions[SOL_MINT_ADDRESS] = {
    balance: gasBalanceBig.toNumber(),
    balanceStr: gasBalanceBig.toString(),
    available: solAvailableBig.toNumber(),
    availableStr: solAvailableBig.toString(),
  };

  const maxAvailableBig = getMaxAvailableFundingAmount(fundingOptions);

  return {
    balance: maxAvailableBig.toNumber(),
    balanceStr: maxAvailableBig.toString(),
    available: maxAvailableBig.toNumber(),
    availableStr: maxAvailableBig.toString(),
    gasBalanceStr,
    fundingTokenAddress: null,
    fundingTokenLabel: null,
    fundingOptions,
    error: null,
  };
};

const swapOnJupiterSchema = z
  .object({
    swapDirection: z
      .nativeEnum(SwapDirection)
      .default(SwapDirection.BUY)
      .describe("BUY or SELL (default BUY)"),
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
            "Must be a valid SPL mint address. For BUY, leave empty to auto-resolve one funding token per wallet (USDC/USDT/USD1/SOL) or pass a supported funding mint explicitly.",
        },
      )
      .describe(
        "SPL mint address. BUY: optional funding token mint (leave empty to auto-resolve USDC/USDT/USD1/SOL per wallet). SELL: token mint to sell.",
      ),
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
    slippagePercentage: z
      .number()
      .min(0)
      .max(50)
      .describe("Slippage % — 0 = dynamic (default 0)"),
    maxPriceImpactPercentage: z
      .number()
      .min(0.1)
      .max(50)
      .describe("Max price impact % (default 5)"),
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
    description:
      "Swap tokens on Solana via Jupiter. BUY = one funding token per wallet (auto priority USDC/USDT/USD1/SOL unless explicitly provided) → token. SELL = token→SOL. Strategies: EQUAL_PER_WALLET, RANDOM_PER_WALLET, TOTAL_SPLIT_RANDOM. Solana only — use swap_on_kyberswap for EVM.",
    schema: swapOnJupiterSchema,
    func: async ({
      swapDirection = SwapDirection.BUY,
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
        if (swapDirection !== SwapDirection.BUY) return outputTokenAddress;
        if (outputTokenAddress && isValidSolanaAddress(outputTokenAddress)) {
          return outputTokenAddress;
        }
        const ctxAddr = toolContext?.tokenAddress;
        if (isSolanaChain && ctxAddr && isValidSolanaAddress(ctxAddr))
          return ctxAddr;
        return outputTokenAddress; // let validation below surface the error
      })();

      const buyInputTokenAddress =
        swapDirection === SwapDirection.BUY
          ? inputTokenAddress?.trim() || SOL_MINT_ADDRESS
          : null;
      const shouldAutoResolveBuyInputToken =
        swapDirection === SwapDirection.BUY && !inputTokenAddress?.trim();

      const effectiveInputTokenAddress = (() => {
        if (swapDirection !== SwapDirection.SELL) return inputTokenAddress;
        if (inputTokenAddress && isValidSolanaAddress(inputTokenAddress)) {
          return inputTokenAddress;
        }
        const ctxAddr = toolContext?.tokenAddress;
        if (isSolanaChain && ctxAddr && isValidSolanaAddress(ctxAddr))
          return ctxAddr;
        return inputTokenAddress; // let validation below surface the error
      })();

      if (
        swapDirection === SwapDirection.BUY &&
        buyInputTokenAddress &&
        !SUPPORTED_SOLANA_BUY_INPUT_MINTS.has(buyInputTokenAddress)
      ) {
        throw new Error(
          "BUY on Solana only supports SOL, USDC, USDT, or USD1 as the funding token.",
        );
      }

      if (swapDirection === SwapDirection.BUY && effectiveOutputTokenAddress) {
        if (!isValidSolanaAddress(effectiveOutputTokenAddress)) {
          throw new Error(
            `Invalid Solana token address: ${effectiveOutputTokenAddress}. Please provide a valid Solana token address (base58 format, typically 32-44 characters).`,
          );
        }
      }

      if (swapDirection === SwapDirection.SELL && effectiveInputTokenAddress) {
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
      if (swapDirection === SwapDirection.BUY && !effectiveOutputTokenAddress) {
        throw new Error("outputTokenAddress is required for BUY direction");
      }
      if (swapDirection === SwapDirection.SELL && !effectiveInputTokenAddress) {
        throw new Error("inputTokenAddress is required for SELL direction");
      }

      // Validate that sellPercentage is not used for BUY operations
      if (swapDirection === SwapDirection.BUY && sellPercentage) {
        throw new Error(
          "Percentages are not supported for BUY operations. Please specify an absolute funding-token amount (e.g., 'buy 0.1 SOL' or 'buy 0.5 USDC'). Percentages are only available for SELL operations.",
        );
      }

      const isBuy = swapDirection === SwapDirection.BUY;
      // For BUY operations, outputTokenAddress is the asset being bought and
      // inputTokenAddress selects the funding token (defaults to SOL).
      const tokenAddress = isBuy
        ? effectiveOutputTokenAddress!
        : effectiveInputTokenAddress!;

      const jupiterManager = new SwapOnJupiterManager();
      const swapper = await jupiterManager.getSwapOnJupiter(listNodeProvider);
      const solanaProvider = new SolanaProvider();

      const balanceInfo: WalletBalanceInfo[] = [];

      const startTime = new Date().getTime();
      const buyInputTokenLabel =
        buyInputTokenAddress &&
        SOLANA_BUY_INPUT_TOKEN_LABEL[buyInputTokenAddress]
          ? SOLANA_BUY_INPUT_TOKEN_LABEL[buyInputTokenAddress]
          : "token";
      logEveryWhere({
        message: `[Agent] Fetching ${
          isBuy
            ? shouldAutoResolveBuyInputToken
              ? "auto funding balances"
              : buyInputTokenLabel
            : "token"
        } for ${wallets.length} wallets`,
      });
      for (let i = 0; i < wallets.length; i += BALANCE_BATCH_SIZE) {
        const batch = wallets.slice(i, i + BALANCE_BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (wallet) => {
            if (isBuy && shouldAutoResolveBuyInputToken) {
              return resolveAutoBuyFundingForWallet({
                walletAddress: wallet?.address || "",
                listNodeProvider,
                solanaProvider,
              });
            }

            let balanceStr: string | null = null;
            let balanceErr: Error | null | undefined = null;
            let gasBalanceStr: string | null = null;
            let gasBalanceErr: Error | null | undefined = null;

            if (isBuy) {
              if (buyInputTokenAddress === SOL_MINT_ADDRESS) {
                [balanceStr, balanceErr] =
                  await solanaProvider.getNativeBalance(
                    wallet?.address || "",
                    listNodeProvider,
                    15000,
                  );
              } else {
                [balanceStr, balanceErr] =
                  await solanaProvider.getWalletBalance(
                    listNodeProvider,
                    TOKEN_TYPE.SOLANA_TOKEN,
                    wallet?.address || "",
                    buyInputTokenAddress!,
                    15000,
                  );
                [gasBalanceStr, gasBalanceErr] =
                  await solanaProvider.getNativeBalance(
                    wallet?.address || "",
                    listNodeProvider,
                    15000,
                  );
              }
            } else {
              // For SELL: fetch token balance
              [balanceStr, balanceErr] = await solanaProvider.getWalletBalance(
                listNodeProvider,
                TOKEN_TYPE.SOLANA_TOKEN,
                wallet?.address || "",
                tokenAddress,
                15000,
              );
            }

            if (balanceErr) {
              return {
                balance: null,
                balanceStr: null,
                available: 0,
                availableStr: null,
                gasBalanceStr: null,
                fundingTokenAddress: null,
                fundingTokenLabel: null,
                error: extractErrorMessage(balanceErr),
                failureReason: "balance_fetch_failed",
              };
            }
            if (isBuy && buyInputTokenAddress !== SOL_MINT_ADDRESS) {
              if (gasBalanceErr) {
                return {
                  balance: null,
                  balanceStr: balanceStr,
                  available: 0,
                  availableStr: null,
                  gasBalanceStr: gasBalanceStr,
                  fundingTokenAddress: null,
                  fundingTokenLabel: null,
                  error: extractErrorMessage(gasBalanceErr),
                  failureReason: "balance_fetch_failed",
                };
              }
              const gasBalanceBig = new Big(gasBalanceStr || "0");
              if (gasBalanceBig.lte(MIN_SOL_REQUIRED_FOR_SWAP_GAS)) {
                return {
                  balance: Number(balanceStr || "0"),
                  balanceStr: balanceStr,
                  available: 0,
                  availableStr: "0",
                  gasBalanceStr: gasBalanceStr,
                  fundingTokenAddress: null,
                  fundingTokenLabel: null,
                  error: `Insufficient SOL for gas. Requires more than ${MIN_SOL_REQUIRED_FOR_SWAP_GAS} SOL.`,
                  failureReason: "insufficient_gas_sol",
                };
              }
            }
            const bal = Number(balanceStr || "0");
            // For SOL-funded BUY: reserve gas buffer from SOL.
            // For stablecoin BUY and SELL: spendable amount is the token balance itself.
            // Use Big.js to preserve precision when calculating available
            const balanceBig = new Big(balanceStr || "0");
            const availableBig = isBuy
              ? buyInputTokenAddress === SOL_MINT_ADDRESS
                ? balanceBig.minus(SOL_SPENDABLE_GAS_RESERVE).gt(0)
                  ? balanceBig.minus(SOL_SPENDABLE_GAS_RESERVE)
                  : new Big(0)
                : balanceBig
              : balanceBig;
            const available = availableBig.toNumber();
            return {
              balance: bal,
              balanceStr: balanceStr,
              available,
              availableStr: availableBig.toString(),
              gasBalanceStr,
              fundingTokenAddress: isBuy ? buyInputTokenAddress : tokenAddress,
              fundingTokenLabel: isBuy ? buyInputTokenLabel : "token",
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

      // For auto-resolve BUY, pick a single global common funding mint so all
      // wallets use the same denomination when summing and clamping amounts.
      // Highest-priority mint (USDC > USDT > USD1 > SOL) that any wallet holds.
      const globalCommonFundingMint = (() => {
        if (!shouldAutoResolveBuyInputToken) {
          return null;
        }
        for (const mint of SOLANA_AUTO_BUY_FUNDING_PRIORITY) {
          const anyWalletHasMint = balanceInfo.some((balanceItem) => {
            const option = balanceItem.fundingOptions?.[mint];
            return option && new Big(option.availableStr || "0").gt(0);
          });
          if (anyWalletHasMint) {
            return mint;
          }
        }
        return null;
      })();

      // Per-wallet capacity in a consistent unit:
      // - Auto-resolve: use each wallet's available in globalCommonFundingMint so sums
      //   are comparable. Wallets that lack the common mint get 0 and are skipped cleanly.
      // - Explicit funding token: use each wallet's own available as before.
      const availableArr = (() => {
        if (shouldAutoResolveBuyInputToken && globalCommonFundingMint) {
          return balanceInfo.map((balanceItem) => {
            const option =
              balanceItem.fundingOptions?.[globalCommonFundingMint];
            return option ? Number(option.availableStr || "0") : 0;
          });
        }
        return balanceInfo.map((balanceItem) => balanceItem.available || 0);
      })();

      const availableTotal = availableArr.reduce(
        (sum, available) => sum + available,
        0,
      );
      if (availableTotal <= 0) {
        const assetName = isBuy
          ? shouldAutoResolveBuyInputToken
            ? "funding balance across USDC/USDT/USD1/SOL"
            : buyInputTokenAddress === SOL_MINT_ADDRESS
              ? "SOL after gas buffer"
              : `${buyInputTokenLabel} balance`
          : "token balance";
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

      // Clamp planned amounts to per-wallet capacity (availableArr is in a consistent unit).
      // TOTAL_SPLIT_RANDOM redistributes leftover capacity; all other strategies clamp only.
      // For auto-resolve BUY, wallets that lack the globalCommonFundingMint have 0 capacity
      // and are skipped rather than silently spending in a different mint's unit.
      let plannedAdjusted = plannedPerWalletAmounts;

      if (resolvedAmountStrategy === "TOTAL_SPLIT_RANDOM") {
        const targetTotal = plannedPerWalletAmounts.reduce((a, b) => a + b, 0);
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
        balanceInSol?: number;
        amount: number;
        fundingToken?: string;
        signature: string | null;
        error?: string;
        failureReason?: string;
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
        let selectedFundingOption = null as {
          balance: number;
          balanceStr: string;
          available: number;
          availableStr: string;
        } | null;

        if (isBuy && shouldAutoResolveBuyInputToken) {
          const fundingResolution = selectFundingOptionForAmount(
            balance.fundingOptions,
            plannedAmountBig,
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
                "No single funding token can fully cover the requested BUY amount. Supported auto funding order: USDC, USDT, USD1, SOL.",
              failureReason: "no_single_funding_token_covers_amount",
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
        const effectiveAmountBig =
          isBuy && shouldAutoResolveBuyInputToken
            ? plannedAmountBig
            : plannedAmountBig.lt(availableBig)
              ? plannedAmountBig
              : availableBig;
        const effectiveAmount = effectiveAmountBig.toNumber();
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
            failureReason: "insufficient_balance",
          });
          continue;
        }

        if (selectedFundingTokenLabel) {
          usedFundingTokenLabels.push(selectedFundingTokenLabel);
        }

        const swapInput: IJupiterSwapInput = {
          inputTokenAddress: isBuy
            ? selectedFundingTokenAddress!.trim()
            : tokenAddress.trim(),
          inputTokenDecimals: 0,
          outputTokenAddress: isBuy
            ? effectiveOutputTokenAddress!.trim()
            : SOL_MINT_ADDRESS,
          amount: effectiveAmountBig.toString(), // Use Big.js string to preserve full precision
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
          results.push({
            wallet: wallet?.address || "",
            balanceInSol: balanceNum,
            amount: effectiveAmount,
            fundingToken: selectedFundingTokenLabel || undefined,
            signature: txHash,
            error: err ? extractErrorMessage(err) : undefined,
          });
        } catch (err: any) {
          // Catch any unexpected errors and continue with next wallet
          results.push({
            wallet: wallet?.address || "",
            balanceInSol: balanceNum,
            amount: effectiveAmount,
            fundingToken: selectedFundingTokenLabel || undefined,
            signature: null,
            error: extractErrorMessage(err),
            failureReason: "swap_execution_failed",
          });
        }
      }

      const successCount = results.filter(
        (result) => result.signature && !result.error,
      ).length;
      const failedEntries = results.filter((result) => result.error);
      const totalSwapped = actualPerWalletAmounts.reduce((a, b) => a + b, 0);
      const fundingTokenSummary = usedFundingTokenLabels.reduce(
        (summary, tokenLabel) => {
          summary[tokenLabel] = (summary[tokenLabel] || 0) + 1;
          return summary;
        },
        {} as Record<string, number>,
      );
      const failureReasonSummary = failedEntries.reduce(
        (summary, entry) => {
          if (!entry.failureReason) return summary;
          summary[entry.failureReason] =
            (summary[entry.failureReason] || 0) + 1;
          return summary;
        },
        {} as Record<string, number>,
      );

      // Consume the approval after execution — any retry attempt will be blocked
      // at the planState check, preventing double-spend without re-approval
      if (successCount > 0) {
        toolContext?.resetPlanState();
      }

      const toolResult = safeStringify({
        chain: "Solana",
        swapDirection,
        inputToken: isBuy
          ? shouldAutoResolveBuyInputToken
            ? "AUTO"
            : buyInputTokenAddress === SOL_MINT_ADDRESS
              ? "SOL"
              : buyInputTokenAddress?.trim()
          : effectiveInputTokenAddress?.trim(),
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
      });

      logEveryWhere({
        message: `[swap_on_jupiter] tool result: ${toolResult}`,
      });
      return toolResult;
    },
  });
