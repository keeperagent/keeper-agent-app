import Big from "big.js";
import _ from "lodash";
import { ICampaignProfile, IWallet } from "@/electron/type";
import { decryptWallet } from "@/electron/service/wallet";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { AmountStrategy } from "../utils";

export type FundingOption = {
  balance: number; // raw total held in wallet
  balanceStr: string;
  available: number; // spendable amount — may be less than balance if a gas reserve is deducted
  availableStr: string;
  availableUsd: number;
  fetchFailed?: boolean;
};

export type FundingOptions = Partial<Record<string, FundingOption>>;

export type WalletBalanceInfo = {
  balance: number | null;
  balanceStr: string | null;
  available: number;
  availableStr: string | null;
  gasBalanceStr?: string | null;
  fundingTokenAddress: string | null;
  fundingTokenLabel: string | null;
  fundingOptions?: FundingOptions;
  error: string | null;
  failureReason?: SwapFailureReason;
};

export enum SwapFailureReason {
  INSUFFICIENT_BALANCE = "insufficient_balance",
  INSUFFICIENT_GAS_SOL = "insufficient_gas_sol",
  NO_SINGLE_FUNDING_TOKEN_COVERS_AMOUNT = "no_single_funding_token_covers_amount",
  BALANCE_FETCH_FAILED = "balance_fetch_failed",
  SWAP_EXECUTION_FAILED = "swap_execution_failed",
}

// Failure reasons that mean the wallet simply had no funds — treat as a skip, not an execution failure.
export const BALANCE_SKIP_REASONS = new Set<SwapFailureReason>([
  SwapFailureReason.INSUFFICIENT_BALANCE,
  SwapFailureReason.INSUFFICIENT_GAS_SOL,
  SwapFailureReason.NO_SINGLE_FUNDING_TOKEN_COVERS_AMOUNT,
]);

export const makeBalanceError = (
  error: string,
  failureReason: SwapFailureReason,
  overrides: Partial<WalletBalanceInfo> = {},
): WalletBalanceInfo => ({
  balance: null,
  balanceStr: null,
  available: 0,
  availableStr: null,
  fundingTokenAddress: null,
  fundingTokenLabel: null,
  error,
  failureReason,
  ...overrides,
});

export const getDefinedFundingOptions = (
  fundingOptions: FundingOptions,
): FundingOption[] =>
  Object.values(fundingOptions).filter(
    (option): option is FundingOption =>
      Boolean(option) && !option?.fetchFailed,
  );

export const getMaxAvailableFundingAmountUsd = (
  fundingOptions: FundingOptions,
): Big =>
  getDefinedFundingOptions(fundingOptions).reduce((currentMax, option) => {
    const optionAvailableUsdBig = new Big(option.availableUsd.toString());
    return optionAvailableUsdBig.gt(currentMax)
      ? optionAvailableUsdBig
      : currentMax;
  }, new Big(0));

export const selectFundingOptionForAmount = (
  fundingOptions: FundingOptions | undefined,
  plannedAmountUsd: Big,
  priorityAddresses: string[],
): { fundingTokenAddress: string; fundingOption: FundingOption } | null => {
  if (!fundingOptions) {
    return null;
  }

  const matchedAddress = priorityAddresses.find((address) => {
    const option = fundingOptions[address];
    if (!option) {
      return false;
    }
    return new Big(option.availableUsd.toString()).gte(plannedAmountUsd);
  });

  if (!matchedAddress) {
    return null;
  }

  return {
    fundingTokenAddress: matchedAddress,
    fundingOption: fundingOptions[matchedAddress]!,
  };
};

export const countByKey = <T>(
  items: T[],
  getKey: (item: T) => string | undefined,
): Record<string, number> =>
  items.reduce(
    (counts, item) => {
      const key = getKey(item);
      if (!key) {
        return counts;
      }
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );

export const computePlannedAmounts = ({
  count,
  isBuy,
  sellPercentageValue,
  balanceInfo,
  resolvedAmountStrategy,
  amount,
  maxAmount,
  minAmount,
  totalAmount,
}: {
  count: number;
  isBuy: boolean;
  sellPercentageValue: number | null;
  balanceInfo: Array<{ balance: number | null }>;
  resolvedAmountStrategy: AmountStrategy;
  amount: number;
  maxAmount: number;
  minAmount: number;
  totalAmount: number;
}): number[] => {
  if (!isBuy && sellPercentageValue !== null) {
    return balanceInfo.map(
      (balanceItem) =>
        ((balanceItem.balance || 0) * sellPercentageValue!) / 100,
    );
  }

  if (
    resolvedAmountStrategy === AmountStrategy.EQUAL_PER_WALLET ||
    !resolvedAmountStrategy
  ) {
    if (!amount || amount <= 0) {
      throw new Error("amount must be > 0 for EQUAL_PER_WALLET");
    }
    return Array(count).fill(amount);
  }

  if (resolvedAmountStrategy === AmountStrategy.RANDOM_PER_WALLET) {
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
    return Array.from({ length: count }, () => _.random(min, max, true));
  }

  if (resolvedAmountStrategy === AmountStrategy.TOTAL_SPLIT_RANDOM) {
    if (!totalAmount || totalAmount <= 0) {
      throw new Error("totalAmount must be > 0 for TOTAL_SPLIT_RANDOM");
    }
    const randomWeights = Array.from(
      { length: count },
      () => Math.random() || 0.0001,
    );
    const weightSum = _.sum(randomWeights);
    return randomWeights.map((weight) => (weight / weightSum) * totalAmount);
  }

  throw new Error(`Unknown amount strategy: ${resolvedAmountStrategy}`);
};

export const resolveSellPercentage = (
  sellPercentage: "all" | "half" | number,
): number => {
  if (sellPercentage === "all") {
    return 100;
  }
  if (sellPercentage === "half") {
    return 50;
  }
  return sellPercentage as number;
};

export const resolveAmountStrategy = ({
  amountStrategy,
  totalAmount,
  amount,
  maxAmount,
}: {
  amountStrategy: AmountStrategy | null | undefined;
  totalAmount: number;
  amount: number;
  maxAmount: number;
}): AmountStrategy => {
  if (totalAmount) {
    return AmountStrategy.TOTAL_SPLIT_RANDOM;
  }
  if (!amountStrategy) {
    if (amount) {
      return AmountStrategy.EQUAL_PER_WALLET;
    }
    if (maxAmount) {
      return AmountStrategy.RANDOM_PER_WALLET;
    }
  }
  return amountStrategy || AmountStrategy.EQUAL_PER_WALLET;
};

export const resolveNodeProviders = async (
  nodeEndpointGroupId: number | undefined,
): Promise<string[]> => {
  if (!nodeEndpointGroupId) {
    throw new Error(
      "nodeEndpointGroupId is required. Please provide it from context or specify it explicitly.",
    );
  }

  const [listNodeEndpoint, errList] =
    await nodeEndpointDB.getListNodeEndpointByGroupId(nodeEndpointGroupId);
  if (errList) {
    throw errList;
  }

  const listNodeProvider =
    listNodeEndpoint?.map((node) => node?.endpoint || "").filter(Boolean) || [];
  if (!listNodeProvider.length) {
    throw new Error(
      "The configured node endpoint group has no active endpoints.",
    );
  }

  return listNodeProvider;
};

const decryptWallets = (
  profiles: ICampaignProfile[],
  encryptKey: string,
): IWallet[] =>
  profiles
    .map((profile) =>
      profile?.wallet ? decryptWallet(profile.wallet, encryptKey) : undefined,
    )
    .filter((wallet): wallet is IWallet => Boolean(wallet));

export const resolveWalletsFromCampaign = async ({
  campaignId,
  isAllWallet,
  listProfileIds,
  encryptKey,
}: {
  campaignId: number | undefined;
  isAllWallet: boolean;
  listProfileIds: number[];
  encryptKey: string;
}): Promise<IWallet[]> => {
  if (!campaignId) {
    throw new Error(
      "campaignId is required. Please provide it from context or specify it explicitly.",
    );
  }

  let profiles: ICampaignProfile[] = [];
  if (isAllWallet) {
    const [allProfiles, errAll] =
      await campaignProfileDB.getAllProfileOfCampaign(campaignId, true);
    if (errAll) {
      throw errAll;
    }
    profiles = allProfiles || [];
  } else {
    if (!listProfileIds.length) {
      throw new Error(
        "listCampaignProfileId is required when isAllWallet is false",
      );
    }

    const [resProfiles, errListProfiles] =
      await campaignProfileDB.getListCampaignProfile({
        page: 1,
        pageSize: listProfileIds.length,
        campaignId,
        listId: listProfileIds,
      });

    if (errListProfiles) {
      throw errListProfiles;
    }
    profiles = resProfiles?.data || [];
  }

  return decryptWallets(profiles, encryptKey);
};
