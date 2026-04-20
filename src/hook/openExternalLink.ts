import { useCallback } from "react";
import { MESSAGE } from "@/electron/constant";

export const isAllowedOpenExternalUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const sendOpenExternalLink = (url?: string): void => {
  if (!url) {
    return;
  }

  if (!isAllowedOpenExternalUrl(url)) {
    return;
  }
  window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, { url });
};

export const useOpenExternalLink = () => {
  const openExternalLink = useCallback((url: string) => {
    sendOpenExternalLink(url);
  }, []);

  return { openExternalLink };
};
