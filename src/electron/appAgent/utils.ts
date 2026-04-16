import { walletGroupDB } from "@/electron/database/walletGroup";
import { walletDB } from "@/electron/database/wallet";
import type { IWalletGroup } from "@/electron/type";
import { ILlmSetting } from "@/electron/type";
import { preferenceService } from "@/electron/service/preference";
import { SupportedChainType } from "./types";

export const SUPPORTED_CHAIN_TYPES: SupportedChainType[] = [
  "EVM",
  "APTOS",
  "SUI",
  "SOLANA",
];

export const CHAIN_ALIAS_MAP: Record<string, SupportedChainType> = {
  evm: "EVM",
  ethereum: "EVM",
  eth: "EVM",
  aptos: "APTOS",
  sui: "SUI",
  sol: "SOLANA",
  solana: "SOLANA",
};

export const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getLlmSetting = async (): Promise<
  [ILlmSetting | null, Error | null]
> => preferenceService.getLlmSetting();

export const normalizeChainType = (
  value?: string | null,
): SupportedChainType | undefined => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const upper = trimmed.toUpperCase();
  if (SUPPORTED_CHAIN_TYPES.includes(upper as SupportedChainType)) {
    return upper as SupportedChainType;
  }

  const alias = CHAIN_ALIAS_MAP[trimmed.toLowerCase()];
  if (alias) {
    return alias;
  }

  throw new Error(
    `Unsupported chain type "${value}". Supported values: ${SUPPORTED_CHAIN_TYPES.join(
      ", ",
    )}`,
  );
};

export const resolveChainTypeForGroup = (
  chainType: string | undefined,
  walletGroup: IWalletGroup,
): SupportedChainType => {
  if (chainType) {
    const normalized = normalizeChainType(chainType);
    if (!normalized) {
      throw new Error(`Unsupported chain type "${chainType}"`);
    }
    return normalized;
  }

  const inferred = normalizeChainType(walletGroup?.typeName);
  if (!inferred) {
    throw new Error(
      `Unable to infer chain type for wallet group "${walletGroup?.name}". Please provide chainType explicitly or set the group's typeName.`,
    );
  }
  return inferred;
};

export const findWalletGroupByName = async (
  name: string,
): Promise<IWalletGroup | null> => {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  const [response, err] = await walletGroupDB.getListWalletGroup(
    1,
    50,
    trimmed,
  );
  if (err) {
    throw err;
  }

  const list = response?.data || [];
  const exact = list.find(
    (group: IWalletGroup) =>
      group?.name?.toLowerCase() === trimmed.toLowerCase(),
  );
  return exact || null;
};

export const resolveWalletGroup = async (input: {
  walletGroupId?: number;
  walletGroupName?: string;
}): Promise<IWalletGroup> => {
  if (input.walletGroupId) {
    const [group, err] = await walletGroupDB.getOneWalletGroup(
      input.walletGroupId,
    );
    if (err) {
      throw err;
    }
    if (!group) {
      throw new Error(
        `Wallet group with id ${input.walletGroupId} does not exist`,
      );
    }
    return group;
  }

  if (input.walletGroupName) {
    const group = await findWalletGroupByName(input.walletGroupName);
    if (group) {
      return group;
    }

    throw new Error(`Wallet group "${input.walletGroupName}" does not exist`);
  }

  throw new Error("walletGroupId or walletGroupName is required");
};

export const getWalletCount = async (
  walletGroupId: number,
): Promise<number> => {
  const [countList, err] = await walletDB.countTotalWallet([walletGroupId]);
  if (err) {
    throw err;
  }

  const record = (countList || []).find(
    (item: any) => Number(item?.groupId) === Number(walletGroupId),
  );
  return Number(record?.count || 0);
};

export const isErrorResult = (result: unknown): boolean => {
  if (typeof result !== "string") {
    return false;
  }
  if (result.startsWith("Error")) {
    return true;
  }
  try {
    const parsed = JSON.parse(result);
    return (
      parsed?.success === false ||
      parsed?.status === "error" ||
      (typeof parsed?.status === "string" &&
        parsed.status.startsWith("blocked_"))
    );
  } catch {
    return false;
  }
};

export const looksLikeEncryptKey = (text: string): boolean => {
  if (text.length > 128) {
    return false;
  }
  if (text.includes("?")) {
    return false;
  }
  // Multiple sentences suggest conversational text
  if (/[.!]\s+[A-Z]/.test(text)) {
    return false;
  }
  // Real keys are compact — more than 5 words is almost certainly conversational
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 5) {
    return false;
  }
  return true;
};
