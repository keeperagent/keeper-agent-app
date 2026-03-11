import { TELEGRAM_BOT } from "@/electron/constant";

export type IMarkUpInline = {
  text: string;
  callback_data: string;
};

export type ITelegramRunSession = {
  workflowId: string;
  campaignId: string;
  variables: Record<string, string>;
  encryptKey?: string;
  awaitingInput?: string;
  createdAt: number;
};

export type ILastRunConfig = {
  variables: Record<string, string>;
  encryptKey?: string;
};

export type ICampaignSearchContext = {
  searchText?: string;
  forAction: "run" | "list";
};

export const SESSION_TTL_MS = 10 * 60 * 1000;
export const AWAITING_ENCRYPT_KEY = "__encrypt_key__";
export const AWAITING_BATCH_VARIABLES = "__batch_variables__";
export const CAMPAIGN_PAGE_SIZE = 15;
export const STATUS_REPORT_INTERVAL_MS = 15 * 1000;

export const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const toSingleLineButtons = (inputMarkup: IMarkUpInline[]) =>
  inputMarkup.map((item) => [item]);

export const parseIds = (callbackData: string) => {
  const parts = callbackData.split("_");
  return {
    workflowId: parts[parts.length - 2],
    campaignId: parts[parts.length - 1],
  };
};

export const buildAction = (
  action: string,
  workflowId: string,
  campaignId: string,
) => `${action}${workflowId}_${campaignId}`;

export const cancelButton = (workflowId: string, campaignId: string) => ({
  text: "❌ Cancel",
  callback_data: buildAction(
    TELEGRAM_BOT.ACTION_CANCEL_RUN,
    workflowId,
    campaignId,
  ),
});

export const backButton = (
  action: string,
  workflowId: string,
  campaignId: string,
) => ({
  text: "⬅️ Back",
  callback_data: buildAction(action, workflowId, campaignId),
});

export const getRegexAction = (action: string) => new RegExp(`^${action}\\d+$`);
