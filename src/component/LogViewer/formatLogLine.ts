import { ILogMessage } from "@/redux/systemLog";
import { LOG_TYPE } from "@/electron/constant";

/** ANSI escape codes for xterm terminal text styling (colors, weight). 256-color: \\x1b[38;5;N m */
const ANSI = {
  reset: "\x1b[0m", // SGR reset
  bold: "\x1b[1m", // SGR bold
  dim: "\x1b[2m", // SGR dim
  orange: "\x1b[38;5;208m", // #ff8700
  amber: "\x1b[38;5;172m", // #d78700
  cyan: "\x1b[38;5;87m", // #5fffff
  softCyan: "\x1b[38;5;80m", // #5fd7d7
  green: "\x1b[38;5;114m", // #87d787
  yellow: "\x1b[38;5;220m", // #ffd700
  red: "\x1b[38;5;203m", // #ff5f5f
  gray: "\x1b[38;5;245m", // #8a8a8a
  darkGray: "\x1b[38;5;239m", // #4e4e4e
  dimGray: "\x1b[38;5;242m", // #6c6c6c
  white: "\x1b[38;5;253m", // #dadada
};

const formatTimestamp = (time: string) =>
  `${ANSI.darkGray}[${ANSI.reset}${ANSI.dimGray}${time}${ANSI.reset}${ANSI.darkGray}]${ANSI.reset}`;

const colorizeByType = (type: LOG_TYPE | undefined, msg: string): string => {
  switch (type) {
    case LOG_TYPE.ERROR:
      return `${ANSI.red}${ANSI.bold}${msg}${ANSI.reset}`;
    case LOG_TYPE.SUCCESS:
      return `${ANSI.green}${ANSI.bold}${msg}${ANSI.reset}`;
    case LOG_TYPE.WARNING:
      return `${ANSI.amber}${msg}${ANSI.reset}`;
    case LOG_TYPE.DIM:
      return `${ANSI.dim}${ANSI.gray}${msg}${ANSI.reset}`;
    case LOG_TYPE.INFO:
    default: {
      return `${ANSI.white}${msg}${ANSI.reset}`;
    }
  }
};

const dot = `${ANSI.dim}${ANSI.gray} · ${ANSI.reset}`;
const arrow = `  ${ANSI.dim}›${ANSI.reset}  `;

/** Build the context block: "campaign: X · workflow: Y · #thread  ›  " (only non-empty parts) */
const formatLogContext = (
  campaign?: string,
  workflow?: string,
  thread?: string,
) => {
  const parts: string[] = [];
  if (campaign != null && campaign !== "") {
    parts.push(
      `${ANSI.orange}campaign:${ANSI.reset} ${ANSI.bold}${ANSI.white}${campaign}${ANSI.reset}`,
    );
  }
  if (workflow != null && workflow !== "") {
    parts.push(
      `${ANSI.cyan}workflow:${ANSI.reset} ${ANSI.bold}${ANSI.white}${workflow}${ANSI.reset}`,
    );
  }
  if (thread != null && thread !== "") {
    parts.push(
      `${ANSI.darkGray}thread:${ANSI.reset} ${ANSI.yellow}${thread}${ANSI.reset}`,
    );
  }
  if (parts.length === 0) {
    return "";
  }
  return `${parts.join(dot)}${arrow}`;
};

const hasStructuredContext = (log: ILogMessage) => {
  return log.campaignName || log.workflowName || log.threadId;
};

export const formatLogLine = (log: ILogMessage): string => {
  const ts = formatTimestamp(log?.time || "");
  const body = log?.message || "";

  if (hasStructuredContext(log)) {
    const context = formatLogContext(
      log?.campaignName,
      log?.workflowName,
      log?.threadId,
    );
    return `  ${ts}  ${context}${colorizeByType(log?.type, body)}`;
  }

  return `  ${ts}  ${colorizeByType(log?.type, body)}`;
};
