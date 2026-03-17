import { walletGroupDB } from "@/electron/database/walletGroup";
import { walletDB } from "@/electron/database/wallet";
import { profileGroupDB } from "@/electron/database/profileGroup";
import { profileDB } from "@/electron/database/profile";
import { nodeEndpointGroupDB } from "@/electron/database/nodeEndpointGroup";
import type {
  IWalletGroup,
  IWallet,
  IProfileGroup,
  INodeEndpointGroup,
} from "@/electron/type";
import { SupportedChainType } from "./types";
import { preferenceDB } from "@/electron/database/preference";

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

// Helper function to capitalize first letter of chain name
export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getOpenAIKey = async (): Promise<
  [string | null, Error | null]
> => {
  const [preference, err] = await preferenceDB.getOnePreference();
  if (err) {
    return [null, err];
  }
  if (!preference) {
    return [null, new Error("Preference not found")];
  }
  return [preference?.openAIApiKey || null, null];
};

export const getAnthropicKey = async (): Promise<
  [string | null, Error | null]
> => {
  const [preference, err] = await preferenceDB.getOnePreference();
  if (err) {
    return [null, err];
  }
  if (!preference) {
    return [null, new Error("Preference not found")];
  }
  return [preference?.anthropicApiKey || null, null];
};

export const getGoogleGeminiKey = async (): Promise<
  [string | null, Error | null]
> => {
  const [preference, err] = await preferenceDB.getOnePreference();
  if (err) {
    return [null, err];
  }
  if (!preference) {
    return [null, new Error("Preference not found")];
  }
  return [preference?.googleGeminiApiKey || null, null];
};

export const getOpenAIModel = async (): Promise<string | null> => {
  const [preference] = await preferenceDB.getOnePreference();
  return preference?.openAIModel || null;
};

export const getAnthropicModel = async (): Promise<string | null> => {
  const [preference] = await preferenceDB.getOnePreference();
  return preference?.anthropicModel || null;
};

export const getGoogleGeminiModel = async (): Promise<string | null> => {
  const [preference] = await preferenceDB.getOnePreference();
  return preference?.googleGeminiModel || null;
};

export const getTavilyKey = async (): Promise<
  [string | null, Error | null]
> => {
  const [preference, err] = await preferenceDB.getOnePreference();
  if (err) {
    return [null, err];
  }
  if (!preference) {
    return [null, new Error("Preference not found")];
  }
  return [preference?.tavilyApiKey || null, null];
};

export const getExaKey = async (): Promise<[string | null, Error | null]> => {
  const [preference, err] = await preferenceDB.getOnePreference();
  if (err) {
    return [null, err];
  }
  if (!preference) {
    return [null, new Error("Preference not found")];
  }
  return [preference?.exaApiKey || null, null];
};

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

export const findProfileGroupByName = async (
  name: string,
): Promise<IProfileGroup | null> => {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  const [response, err] = await profileGroupDB.getListProfileGroup(
    1,
    50,
    trimmed,
  );
  if (err) {
    throw err;
  }

  const list = response?.data || [];
  const exact = list.find(
    (group: IProfileGroup) =>
      group?.name?.toLowerCase() === trimmed.toLowerCase(),
  );
  return exact || null;
};

export const resolveProfileGroup = async (input: {
  profileGroupName?: string;
}): Promise<IProfileGroup> => {
  if (input.profileGroupName) {
    const group = await findProfileGroupByName(input.profileGroupName);
    if (group) {
      return group;
    }

    throw new Error(`Profile group "${input.profileGroupName}" does not exist`);
  }

  throw new Error("profileGroupId or profileGroupName is required");
};

export const findNodeEndpointGroupByName = async (
  name: string,
): Promise<INodeEndpointGroup | null> => {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  const [response, err] = await nodeEndpointGroupDB.getListNodeEndpointGroup(
    1,
    50,
    trimmed,
  );
  if (err) {
    throw err;
  }

  const list = response?.data || [];
  const exact = list.find(
    (group: INodeEndpointGroup) =>
      group?.name?.toLowerCase() === trimmed.toLowerCase(),
  );
  return exact || null;
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

export const getProfileCount = async (
  profileGroupId: number,
): Promise<number> => {
  const [countList, err] = await profileDB.countTotalProfile([profileGroupId]);
  if (err) {
    throw err;
  }

  const record = (countList || []).find(
    (item: any) => Number(item?.groupId) === Number(profileGroupId),
  );
  return Number(record?.count || 0);
};

// no need to expose sensitive information when working with agent
type IMinimalWalletInfo = {
  id: number;
  groupId: number;
};
export const fetchWalletsForGroup = async (
  walletGroupId: number,
  limit?: number,
): Promise<IMinimalWalletInfo[]> => {
  const wallets: IMinimalWalletInfo[] = [];
  let page = 1;
  const pageSize = 200;

  while (true) {
    const [response, err] = await walletDB.getListWallet({
      page,
      pageSize,
      groupId: walletGroupId,
    });
    if (err) {
      throw err;
    }

    const data = response?.data || [];
    if (!data.length) {
      break;
    }
    wallets.push(
      ...data.map((item: IWallet) => ({
        id: item?.id!,
        groupId: item?.groupId!,
      })),
    );

    if (limit && wallets.length >= limit) {
      return wallets.slice(0, limit);
    }

    if (data.length < pageSize) {
      break;
    }
    page += 1;
  }

  return limit ? wallets.slice(0, limit) : wallets;
};
