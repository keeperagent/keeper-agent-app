/**
 * LangChain / multimodal models may return `content` as a string, an array of
 * blocks like `{ type: "text", text: "..." }`, or nested shapes. Scheduled
 * runs previously stored `JSON.stringify(content)`, which is unreadable in UI.
 */
export function normalizeAgentMessageContent(content: unknown): string {
  if (content == null) {
    return "";
  }

  if (typeof content === "string") {
    const trimmed = content.trim();
    if (trimmed.startsWith("[") && trimmed.includes('"type"')) {
      try {
        return normalizeAgentMessageContent(JSON.parse(trimmed));
      } catch {
        return content;
      }
    }
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") {
          return block;
        }
        const blockRecord = block as Record<string, unknown>;
        return typeof blockRecord.text === "string"
          ? blockRecord.text
          : typeof blockRecord.content === "string"
            ? blockRecord.content
            : "";
      })
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }
  if (typeof content === "object" && content !== null && "text" in content) {
    const text = (content as { text?: unknown }).text;
    if (typeof text === "string") {
      return text;
    }
  }
  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}

// One line for table cell
export function collapseResultToOneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
