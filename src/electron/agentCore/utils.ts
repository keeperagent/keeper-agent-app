import { walletGroupDB } from "@/electron/database/walletGroup";
import { walletDB } from "@/electron/database/wallet";
import type { IWalletGroup, TurnUsage } from "@/electron/type";
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

export const extractUsageFromMeta = (usageMeta: any): TurnUsage => {
  if (!usageMeta) {
    return null;
  }
  const inputTokens = usageMeta.input_tokens || 0;
  const cacheRead = usageMeta.input_token_details?.cache_read || 0;

  return {
    inputTokens,
    outputTokens: usageMeta.output_tokens || 0,
    cacheRead,
    cacheCreation: usageMeta.input_token_details?.cache_creation || 0,
    cacheHitPercent:
      inputTokens > 0 ? Math.round((cacheRead / inputTokens) * 100) : 0,
  };
};

export const extractUsageFromMessages = (messages: any[]): TurnUsage => {
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheRead = 0;
  let cacheCreation = 0;

  for (const message of messages || []) {
    const extracted = extractUsageFromMeta(message?.usage_metadata);
    if (extracted) {
      inputTokens += extracted.inputTokens;
      outputTokens += extracted.outputTokens;
      cacheRead += extracted.cacheRead;
      cacheCreation += extracted.cacheCreation;
    }
  }

  if (inputTokens === 0) {
    return null;
  }

  return {
    inputTokens,
    outputTokens,
    cacheRead,
    cacheCreation,
    cacheHitPercent: Math.round((cacheRead / inputTokens) * 100),
  };
};

const tryParseJson = (raw: string): Record<string, unknown> => {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const extractToolOutput = (rawOutput: any): string => {
  if (typeof rawOutput === "string") {
    return rawOutput;
  }
  const content = rawOutput?.kwargs?.content || rawOutput?.content;
  if (typeof content === "string") {
    return content;
  }
  return JSON.stringify(rawOutput || "");
};

export type AgentStreamCallbacks = {
  onText?: (text: string, runId: string) => void;
  onToolStart?: (
    toolName: string,
    runId: string,
    input: Record<string, unknown>,
    subagentType?: string,
  ) => void;
  onToolEnd?: (
    toolName: string,
    runId: string,
    result: string,
    input: Record<string, unknown>,
  ) => void;
  onModelEnd?: (
    runId: string,
    hasToolCalls: boolean,
    usageMeta: any,
    isTopLevel: boolean,
  ) => void;
};

export const consumeAgentStream = async (
  eventStream: AsyncIterable<any>,
  signal: AbortSignal,
  callbacks: AgentStreamCallbacks,
): Promise<void> => {
  for await (const evt of eventStream) {
    if (signal.aborted) {
      const abortErr = new Error("Task execution was aborted");
      abortErr.name = "AbortError";
      throw abortErr;
    }

    const isTopLevel = !String(
      evt.metadata?.langgraph_checkpoint_ns || "",
    ).includes("|");

    if (evt.event === "on_chat_model_stream" && isTopLevel) {
      const content = evt.data?.chunk?.content;
      let text = "";
      if (typeof content === "string") {
        text = content;
      } else if (Array.isArray(content)) {
        text = content
          .filter(
            (chunk: any) => chunk?.type === "text" || typeof chunk === "string",
          )
          .map((chunk: any) =>
            typeof chunk === "string" ? chunk : chunk.text || "",
          )
          .join("");
      }
      if (text) {
        callbacks.onText?.(text, evt.run_id || "default");
      }
    }

    if (evt.event === "on_tool_start") {
      const toolName = evt.name || "unknown";
      const input = (evt.data?.input || {}) as Record<string, unknown>;
      let subagentType: string | undefined;
      if (toolName === "task") {
        const raw = (input as any)?.input || input;
        const parsedInput = typeof raw === "string" ? tryParseJson(raw) : raw;
        subagentType = (parsedInput as any)?.subagent_type;
      }
      callbacks.onToolStart?.(toolName, evt.run_id || "", input, subagentType);
    }

    if (evt.event === "on_tool_end") {
      const toolName = evt.name || "unknown";
      const result = extractToolOutput(evt.data?.output);
      const input = (evt.data?.input || {}) as Record<string, unknown>;
      callbacks.onToolEnd?.(toolName, evt.run_id || "", result, input);
    }

    if (evt.event === "on_chat_model_end") {
      const hasToolCalls =
        Array.isArray(evt.data?.output?.tool_calls) &&
        evt.data.output.tool_calls.length > 0;
      callbacks.onModelEnd?.(
        evt.run_id || "default",
        hasToolCalls,
        evt.data?.output?.usage_metadata,
        isTopLevel,
      );
    }
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
