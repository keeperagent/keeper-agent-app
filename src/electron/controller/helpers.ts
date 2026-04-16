import { ipcMain, IpcMainEvent } from "electron";
import { RESPONSE_CODE } from "@/electron/constant";
import { mainWindow } from "@/electron/main";

const isTrustedSender = (event: IpcMainEvent): boolean => {
  return (
    mainWindow != null &&
    !mainWindow.isDestroyed() &&
    event.sender === mainWindow.webContents
  );
};

export const replyOk = (
  event: IpcMainEvent,
  channel: string,
  data: any,
  extra?: Record<string, any>,
) => {
  event.reply(channel, { data, ...extra });
};

export const replyErr = (
  event: IpcMainEvent,
  channel: string,
  error: any,
  extra?: Record<string, any>,
) => {
  const message =
    typeof error === "string" ? error : error?.message || "Unexpected error";
  event.reply(channel, { error: message, code: RESPONSE_CODE.ERROR, ...extra });
};

export const onIpc = <T = any>(
  channel: string,
  resChannel: string,
  fn: (event: IpcMainEvent, payload: T) => Promise<void>,
): void => {
  ipcMain.on(channel, async (event: IpcMainEvent, payload: T) => {
    const requestId = (payload as any)?.requestId;

    if (!isTrustedSender(event)) {
      event.reply(resChannel, {
        requestId,
        data: null,
        error: "Permission denied",
        code: RESPONSE_CODE.ERROR,
      });
      return;
    }

    try {
      await fn(event, payload);
    } catch (err: any) {
      event.reply(resChannel, {
        requestId,
        data: null,
        error: err?.message || "Unexpected error",
        code: RESPONSE_CODE.ERROR,
      });
    }
  });
};
