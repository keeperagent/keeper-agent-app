import { redact } from "@keeperagent/crypto-key-guard";
import { ChatRole } from "@/electron/chatGateway/types";
import type { AttachedFile } from "./AttachedFiles";

/** Absolute path for backend. Uses Electron getPathForFile when available (pick/drop). */
export const getFilePath = (file: File): string => {
  try {
    if (typeof window !== "undefined" && window.electron?.getPathForFile) {
      const p = window.electron.getPathForFile(file);
      if (p) {
        return p;
      }
    }
  } catch {}
  return (file as File & { path?: string }).path || file.name;
};

export const getExtensionFromName = (name: string): string => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
};

/** From Electron dialog result: already absolute path from main process. No file:// preview (blocked by browser/security). */
export const fileInfoToAttached = (info: {
  path: string;
  name: string;
  extension: string;
}): AttachedFile => {
  const isImage = /^(jpg|jpeg|png|gif|webp|bmp|svg|ico)$/i.test(
    info.extension || "",
  );
  return {
    path: info.path,
    name: info.name,
    extension: (info.extension || "").toLowerCase(),
    type: isImage ? "image" : "other",
    previewUrl: undefined, // avoid file:// in img src (not allowed to load local resource)
  };
};

export const fileToAttached = (file: File): AttachedFile => {
  const path = getFilePath(file);
  const name = file.name;
  const extension =
    getExtensionFromName(name) || (file.type || "").split("/")[1] || "";
  const isImage = (file.type || "").startsWith("image/");
  return {
    path,
    name,
    extension,
    type: isImage ? "image" : "other",
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
  };
};

export enum ToolCallStateStatus {
  RUNNING = "running",
  DONE = "done",
  ERROR = "error",
}

export type ToolCallState = {
  runId: string;
  toolName: string;
  input: Record<string, unknown>;
  result?: string;
  state: ToolCallStateStatus;
};

export type DisplayMessage = {
  role: string;
  label: string;
  content: string;
  className: string;
  isLoading?: boolean;
  isAgentProcessing?: boolean;
  timestamp?: Date;
  executingToolText?: string;
  toolCalls?: ToolCallState[];
  planReview?: { sessionId: string; plan: string };
};

export const deriveLabel = (role: string, t: (key: string) => string) => {
  const normalized = role?.toLowerCase() || "";
  if (
    normalized === ChatRole.HUMAN ||
    normalized.includes("human") ||
    normalized.includes("user")
  ) {
    return t("agent.messageLabelYou");
  }
  if (normalized === ChatRole.TOOL || normalized.includes("tool")) {
    return t("agent.messageLabelToolOutput");
  }
  if (normalized.includes("system")) {
    return t("agent.messageLabelKeeperSystem");
  }
  return t("agent.messageLabelKeeper");
};

export const deriveClassName = (role: string) => {
  const normalized = role?.toLowerCase() || "";
  if (
    normalized === ChatRole.HUMAN ||
    normalized.includes("human") ||
    normalized.includes("user")
  ) {
    return "message user";
  }
  if (normalized === ChatRole.TOOL || normalized.includes("tool")) {
    return "message tool";
  }
  return "message assistant";
};

export const stripContext = (text: string) => {
  // Dynamically detect and strip any context blocks
  // Look for pattern: \n\n followed by text ending with ":" followed by JSON object
  // This catches any context header format like "CONTEXT: {...}" or "SOME HEADER: {...}"

  // First, try to find context markers explicitly (case-insensitive)
  const lowerText = text.toLowerCase();
  const markers = [
    "\n\ncontext:\n",
    "\n\ncontext (for agent use only",
    "\n\ncurrent context",
  ];
  for (const marker of markers) {
    const idx = lowerText.indexOf(marker);
    if (idx !== -1) {
      return text.slice(0, idx).trim();
    }
  }

  // Then, dynamically detect JSON context blocks
  // Pattern: \n\n followed by text ending with ":" followed by whitespace and "{"
  const contextHeaderPattern = /\n\n[^\n{]*:\s*\{/;
  const headerMatch = text.match(contextHeaderPattern);
  if (headerMatch && headerMatch.index !== undefined) {
    const headerStart = headerMatch.index;
    // Find the matching closing brace for the JSON object to verify it's complete
    let braceCount = 0;
    const jsonStart = headerMatch.index + headerMatch[0].length - 1; // Position of opening {

    for (let i = jsonStart; i < text.length; i++) {
      if (text[i] === "{") {
        braceCount++;
      }
      if (text[i] === "}") {
        braceCount--;
      }
      if (braceCount === 0) {
        // Found complete JSON object, strip everything from the header start
        return text.slice(0, headerStart).trim();
      }
    }
  }

  return text;
};

/**
 * Sanitizes content for display. Pass `shouldSanitize: true` for persisted
 * conversation messages to strip the context block and redact secrets.
 * Live streaming content should pass `false` so it is returned as-is.
 */
export const sanitizeForDisplay = (
  content: string,
  shouldSanitize: boolean,
): { text: string } => {
  if (!shouldSanitize) {
    return { text: content };
  }
  const stripped = stripContext(content);
  const { text } = redact(stripped);
  return { text };
};
