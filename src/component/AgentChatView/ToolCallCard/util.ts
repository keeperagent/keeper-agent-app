import { getToolDisplayName, TOOL_KEYS } from "@/electron/constant";
import { type ToolCallState, ToolCallStateStatus } from "../util";

export type ToolRendererConfig = {
  icon: string;
  label?: string;
  summaryFields?: string[];
  skipFields?: string[];
};

const toolRenderers: Record<string, ToolRendererConfig> = {
  [TOOL_KEYS.TRANSACTION_AGENT]: { icon: "⚡", summaryFields: [] },
  [TOOL_KEYS.CODE_EXECUTION_AGENT]: { icon: "💻", summaryFields: [] },
  [TOOL_KEYS.RESEARCH_AGENT]: { icon: "🧭", summaryFields: [] },
  [TOOL_KEYS.WORKFLOW_AGENT]: { icon: "⚙️", summaryFields: [] },
  [TOOL_KEYS.DATA_MANAGEMENT_AGENT]: { icon: "🗄️", summaryFields: [] },
  [TOOL_KEYS.SCHEDULER_AGENT]: { icon: "⏱️", summaryFields: [] },
  [TOOL_KEYS.TASK_MANAGEMENT_AGENT]: { icon: "📌", summaryFields: [] },
  [TOOL_KEYS.TEAM_MAILBOX_AGENT]: { icon: "💬", summaryFields: [] },
  [TOOL_KEYS.VISUALIZATION_AGENT]: { icon: "📊", summaryFields: [] },

  [TOOL_KEYS.WRITE_TODOS]: {
    icon: "📋",
    label: "Todo list",
    summaryFields: [],
    skipFields: ["todos"],
  },
  [TOOL_KEYS.LS]: { icon: "📁", summaryFields: ["path"] },
  [TOOL_KEYS.READ_FILE]: { icon: "📄", summaryFields: ["path"] },
  [TOOL_KEYS.WRITE_FILE]: { icon: "✏️", summaryFields: ["path"] },
  [TOOL_KEYS.GREP]: { icon: "🔎", summaryFields: ["pattern", "path"] },
  [TOOL_KEYS.FIND]: { icon: "🔎", summaryFields: ["pattern", "path"] },
  [TOOL_KEYS.EXECUTE]: { icon: "▶️", summaryFields: ["command"] },
  [TOOL_KEYS.TASK]: {
    icon: "🤖",
    summaryFields: ["subagent_type", "description"],
  },

  [TOOL_KEYS.SWAP_ON_JUPITER]: {
    icon: "🪐",
    summaryFields: [
      "inputMint",
      "outputMint",
      "amount",
      "totalAmount",
      "maxAmount",
    ],
  },
  [TOOL_KEYS.SWAP_ON_KYBERSWAP]: {
    icon: "💱",
    summaryFields: [
      "tokenIn",
      "tokenOut",
      "amount",
      "totalAmount",
      "maxAmount",
    ],
  },
  [TOOL_KEYS.TRANSFER_SOLANA_TOKEN]: {
    icon: "💸",
    summaryFields: ["to", "amount", "mint"],
  },
  [TOOL_KEYS.GET_SOLANA_TOKEN_BALANCE]: {
    icon: "🔷",
    summaryFields: ["walletAddress", "mint"],
  },
  [TOOL_KEYS.GET_EVM_TOKEN_BALANCE]: {
    icon: "🔷",
    summaryFields: ["walletAddress", "tokenAddress"],
  },
  [TOOL_KEYS.GET_TOKEN_PRICE]: {
    icon: "📈",
    summaryFields: ["symbol", "mint"],
  },
  [TOOL_KEYS.LAUNCH_PUMPFUN_TOKEN]: {
    icon: "🚀",
    summaryFields: ["name", "symbol"],
  },
  [TOOL_KEYS.LAUNCH_BONKFUN_TOKEN]: {
    icon: "🚀",
    summaryFields: ["name", "symbol"],
  },
  [TOOL_KEYS.BROADCAST_TRANSACTION_EVM]: {
    icon: "⚡",
    summaryFields: ["to", "value"],
  },
  [TOOL_KEYS.BROADCAST_TRANSACTION_SOLANA]: {
    icon: "⚡",
    summaryFields: ["to", "amount"],
  },

  [TOOL_KEYS.CREATE_WALLET_GROUP]: { icon: "🏦", summaryFields: ["name"] },
  [TOOL_KEYS.GENERATE_WALLETS_FOR_GROUP]: {
    icon: "🔑",
    summaryFields: ["groupId", "count"],
  },
  [TOOL_KEYS.CREATE_RESOURCE_GROUP]: { icon: "📦", summaryFields: ["name"] },
  [TOOL_KEYS.LIST_RESOURCE_GROUPS]: { icon: "🗂️", summaryFields: [] },
  [TOOL_KEYS.BULK_ADD_RESOURCES]: { icon: "📥", summaryFields: ["groupId"] },
  [TOOL_KEYS.BULK_UPDATE_RESOURCES]: { icon: "🔃", summaryFields: ["groupId"] },
  [TOOL_KEYS.QUERY_RESOURCES]: { icon: "🔍", summaryFields: ["query"] },

  [TOOL_KEYS.WRITE_JAVASCRIPT]: { icon: "📜", summaryFields: [] },
  [TOOL_KEYS.EXECUTE_JAVASCRIPT]: { icon: "▶️", summaryFields: [] },

  [TOOL_KEYS.SEARCH_CAMPAIGNS]: { icon: "📂", summaryFields: ["query"] },
  [TOOL_KEYS.SEARCH_WORKFLOWS]: { icon: "⚙️", summaryFields: ["query"] },
  [TOOL_KEYS.RUN_WORKFLOW]: {
    icon: "🔁",
    summaryFields: ["workflowId", "campaignId"],
  },
  [TOOL_KEYS.STOP_WORKFLOW]: { icon: "⏹️", summaryFields: ["workflowId"] },
  [TOOL_KEYS.CHECK_WORKFLOW_STATUS]: {
    icon: "🔍",
    summaryFields: ["workflowId"],
  },

  [TOOL_KEYS.WEB_SEARCH_TAVILY]: { icon: "🌐", summaryFields: ["query"] },
  [TOOL_KEYS.WEB_SEARCH_EXA]: { icon: "🌐", summaryFields: ["query"] },
  [TOOL_KEYS.WEB_EXTRACT_TAVILY]: {
    icon: "🌐",
    summaryFields: ["urls", "url"],
  },
  [TOOL_KEYS.FIND_SIMILAR_EXA]: { icon: "🌐", summaryFields: ["url", "query"] },

  [TOOL_KEYS.CREATE_AGENT_SCHEDULE]: {
    icon: "📅",
    summaryFields: ["name", "cronExpression"],
  },
  [TOOL_KEYS.LIST_AGENT_SCHEDULES]: { icon: "🗓️", summaryFields: [] },
  [TOOL_KEYS.UPDATE_AGENT_SCHEDULE]: {
    icon: "🖊️",
    summaryFields: ["scheduleId"],
  },
  [TOOL_KEYS.DELETE_AGENT_SCHEDULE]: {
    icon: "🗑️",
    summaryFields: ["scheduleId"],
  },
  [TOOL_KEYS.PAUSE_AGENT_SCHEDULE]: {
    icon: "⏸️",
    summaryFields: ["scheduleId"],
  },
  [TOOL_KEYS.RESUME_AGENT_SCHEDULE]: {
    icon: "▶️",
    summaryFields: ["scheduleId"],
  },
  [TOOL_KEYS.RUN_AGENT_SCHEDULE_NOW]: {
    icon: "⚡",
    summaryFields: ["scheduleId"],
  },

  [TOOL_KEYS.LIST_AGENT_TASKS]: { icon: "📌", summaryFields: [] },
  [TOOL_KEYS.GET_AGENT_TASK]: { icon: "🔖", summaryFields: ["taskId"] },
  [TOOL_KEYS.CREATE_AGENT_TASK]: { icon: "➕", summaryFields: ["title"] },
  [TOOL_KEYS.UPDATE_AGENT_TASK]: {
    icon: "🖊️",
    summaryFields: ["taskId", "status"],
  },
  [TOOL_KEYS.DELETE_AGENT_TASK]: { icon: "🗑️", summaryFields: ["taskId"] },

  [TOOL_KEYS.SEND_MESSAGE]: { icon: "📤", summaryFields: ["to", "subject"] },
  [TOOL_KEYS.READ_MESSAGES]: { icon: "📥", summaryFields: [] },
  [TOOL_KEYS.ACKNOWLEDGE_MESSAGE]: { icon: "✅", summaryFields: ["messageId"] },

  [TOOL_KEYS.CALCULATE]: { icon: "🔢", summaryFields: ["expression"] },
  [TOOL_KEYS.REQUEST_APPROVAL]: { icon: "🔐", summaryFields: [] },
  [TOOL_KEYS.CONFIRM_APPROVAL]: { icon: "✅", summaryFields: ["plan"] },

  [TOOL_KEYS.CREATE_AGENT_TEAM]: { icon: "👥", summaryFields: ["name"] },
  [TOOL_KEYS.GET_TEAM_PROGRESS]: { icon: "📊", summaryFields: ["teamId"] },
  [TOOL_KEYS.DELEGATE_TASK]: {
    icon: "➡️",
    summaryFields: ["taskId", "agentId"],
  },

  [TOOL_KEYS.RENDER_CHART]: {
    icon: "📈",
    summaryFields: [],
    skipFields: ["option"],
  },
};

export const getToolIcon = (toolName: string): string => {
  return toolRenderers[toolName]?.icon || "🔧";
};

export const getToolLabel = (toolName: string): string => {
  return toolRenderers[toolName]?.label || getToolDisplayName(toolName);
};

const truncateValue = (value: unknown, maxLength = 300): string => {
  if (value === null || value === undefined) {
    return "";
  }
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  return str.length > maxLength ? str.slice(0, maxLength) + "…" : str;
};

/**
 * LangChain sometimes wraps structured tool inputs as { input: '{"field":"value"}' }.
 * Unwrap this one level so field lookups work correctly.
 */
const unwrapInput = (
  input: Record<string, unknown>,
): Record<string, unknown> => {
  const keys = Object.keys(input);
  if (
    keys.length === 1 &&
    keys[0] === "input" &&
    typeof input["input"] === "string"
  ) {
    try {
      const parsed = JSON.parse(input["input"] as string);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {}
  }
  return input;
};

const formatFieldValue = (field: string, value: unknown): string => {
  // For url arrays (web_extract urls field), show domain + path of first URL
  if (field === "urls" && Array.isArray(value)) {
    const firstUrl = value[0];
    if (typeof firstUrl === "string") {
      try {
        const parsed = new URL(firstUrl);
        const path = parsed.pathname.replace(/\/$/, "");
        const label = path ? `${parsed.hostname}${path}` : parsed.hostname;
        return label.replace(/^www\./, "");
      } catch {}
    }
  }
  return truncateValue(value, 1000);
};

// Returns up to 4 key/value pairs from the input for summary display in the card header
export const getSummaryPairs = (
  toolName: string,
  rawInput: Record<string, unknown>,
): Array<{ key: string; value: string }> => {
  const input = unwrapInput(rawInput);
  const config = toolRenderers[toolName];
  const priorityFields = config?.summaryFields || [];
  const pairs: Array<{ key: string; value: string }> = [];

  // Priority fields first
  for (const field of priorityFields) {
    if (field in input && pairs.length < 4) {
      const rawVal = input[field];
      if (typeof rawVal === "number" && rawVal === 0) {
        continue;
      }
      const value = formatFieldValue(field, rawVal);
      if (value) {
        pairs.push({ key: field, value });
      }
    }
  }

  // Fill remaining from other fields (skip large/internal ones)
  const skipKeys = new Set([
    ...priorityFields,
    ...(config?.skipFields || []),
    "context",
    "metadata",
    "sessionId",
    "offset",
    "limit",
    "start",
    "end",
    "input", // always skip the LangChain wrapper key
    ...(CODE_TOOL_NAMES.has(toolName) ? ["code"] : []),
  ]);
  for (const [key, value] of Object.entries(input)) {
    if (pairs.length >= 4) {
      break;
    }
    if (skipKeys.has(key)) {
      continue;
    }
    if (typeof value === "boolean" || typeof value === "number") {
      continue;
    }
    const str = truncateValue(value, 3000);
    if (str) {
      pairs.push({ key, value: str });
    }
  }

  return pairs;
};

export const SEARCH_TOOL_NAMES = new Set<string>([
  TOOL_KEYS.WEB_SEARCH_TAVILY,
  TOOL_KEYS.WEB_SEARCH_EXA,
  TOOL_KEYS.WEB_EXTRACT_TAVILY,
  TOOL_KEYS.FIND_SIMILAR_EXA,
]);

// Internal LangChain auxiliary tools that duplicate visible tool calls — hide from UI
export const HIDDEN_TOOL_NAMES = new Set<string>([
  "ExaSearchResults",
  "TavilySearchResults",
]);

export type ResultItem = { title: string; url: string };
export const parseResultItems = (
  toolName: string,
  result?: string,
  input?: Record<string, unknown>,
): ResultItem[] => {
  if (!SEARCH_TOOL_NAMES.has(toolName as any)) {
    return [];
  }

  if (result) {
    try {
      const parsed = JSON.parse(result);
      // Tavily format: { results: [{ title, url }] }
      if (parsed?.results && Array.isArray(parsed.results)) {
        const items = parsed.results
          .filter((item: any) => item?.url)
          .slice(0, 6)
          .map((item: any) => ({
            title: item.title || extractDomain(item.url),
            url: item.url,
          }));
        if (items.length > 0) {
          return items;
        }
      }
      // Exa format: bare array [{ url, title, ... }]
      if (Array.isArray(parsed)) {
        const items = parsed
          .filter((item: any) => item?.url)
          .slice(0, 6)
          .map((item: any) => ({
            title: item.title || extractDomain(item.url),
            url: item.url,
          }));
        if (items.length > 0) {
          return items;
        }
      }
    } catch {}
  }

  // web_extract returns plain text — fall back to the input URLs so they render as clickable items
  if (toolName === TOOL_KEYS.WEB_EXTRACT_TAVILY && input) {
    const unwrapped = unwrapInput(input);
    const raw = unwrapped.urls ?? (unwrapped.url ? [unwrapped.url] : []);
    const urlArray = (Array.isArray(raw) ? raw : [raw]) as string[];
    return urlArray
      .filter((url) => typeof url === "string" && url)
      .slice(0, 6)
      .map((url) => {
        try {
          const parsed = new URL(url);
          const path = parsed.pathname.replace(/\/$/, "");
          const title = path
            ? `${parsed.hostname.replace(/^www\./, "")}${path}`
            : parsed.hostname.replace(/^www\./, "");
          return { title, url };
        } catch {
          return { title: url, url };
        }
      });
  }

  return [];
};

const CODE_TOOL_NAMES = new Set<string>([
  TOOL_KEYS.WRITE_JAVASCRIPT,
  TOOL_KEYS.EXECUTE_JAVASCRIPT,
]);

export const getCodeContent = (
  toolName: string,
  input: Record<string, unknown>,
  result?: string,
): string | null => {
  if (!CODE_TOOL_NAMES.has(toolName)) {
    return null;
  }
  // For execute tools, prefer executedCode from result (actual code that ran)
  if (toolName === TOOL_KEYS.EXECUTE_JAVASCRIPT && result) {
    try {
      const parsed = JSON.parse(result);
      if (parsed?.executedCode && typeof parsed.executedCode === "string") {
        return parsed.executedCode;
      }
    } catch {}
  }

  // For write tools, read from input
  let raw = input?.input ?? input?.code ?? null;
  if (typeof raw !== "string") {
    return null;
  }
  // LangChain may double-wrap: { input: '{"input":"<code>"}' }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.input === "string") {
      raw = parsed.input;
    }
  } catch {}
  return typeof raw === "string" && raw ? raw : null;
};

export const looksLikeMarkdown = (text: string): boolean => {
  return /(?:^|\n)#{1,6}\s|\*\*[^*]+\*\*|(?:^|\n)\s*[-*]\s|\[.+\]\(.+\)|(?:^|\n)\s*\|.+\|/.test(
    text,
  );
};

export const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return (parsed.origin + parsed.pathname)
      .replace(/\/$/, "")
      .toLowerCase()
      .replace(/^(https?:\/\/)www\./, "$1");
  } catch {
    return url
      .replace(/\/$/, "")
      .toLowerCase()
      .replace(/^(https?:\/\/)www\./, "$1");
  }
};

export const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export const getFaviconUrl = (url: string): string => {
  const domain = extractDomain(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};

export type TodoItem = { content: string; status: string; type?: string };

export const parseTodos = (
  input: Record<string, unknown>,
): TodoItem[] | null => {
  const unwrapped = unwrapInput(input);
  const todos = unwrapped?.todos;
  if (!Array.isArray(todos) || todos.length === 0) {
    return null;
  }
  return todos
    .filter((item: any) => typeof item?.content === "string" && item.content)
    .map((item: any) => ({
      content: item.content as string,
      status: (item.status as string) || "pending",
      type: item.type as string | undefined,
    }));
};

export const getGroupSummary = (toolCalls: ToolCallState[]): string => {
  const anyRunning = toolCalls.some(
    (toolCall) => toolCall.state === ToolCallStateStatus.RUNNING,
  );

  if (anyRunning) {
    const runningTool = toolCalls.find(
      (toolCall) => toolCall.state === ToolCallStateStatus.RUNNING,
    );
    return runningTool ? `${getToolLabel(runningTool.toolName)}` : "Working";
  }

  const searchCount = toolCalls.filter((toolCall) =>
    SEARCH_TOOL_NAMES.has(toolCall.toolName as any),
  ).length;
  const totalResults = toolCalls.reduce(
    (sum, toolCall) =>
      sum + parseResultItems(toolCall.toolName, toolCall.result).length,
    0,
  );

  if (searchCount > 0) {
    const firstSearchTool = toolCalls.find((toolCall) =>
      SEARCH_TOOL_NAMES.has(toolCall.toolName as any),
    );
    const query = firstSearchTool
      ? getSummaryPairs(firstSearchTool.toolName, firstSearchTool.input)[0]
          ?.value || ""
      : "";
    const truncated = query.length > 60 ? query.slice(0, 60) + "…" : query;
    return truncated ? `Searched · ${truncated}` : "Searched";
  }
  return `Used ${toolCalls.length} tool${toolCalls.length !== 1 ? "s" : ""}`;
};
