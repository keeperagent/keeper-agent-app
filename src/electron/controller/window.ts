import { ipcMain, BrowserWindow, shell, screen } from "electron";
import os from "os";
import { MESSAGE } from "@/electron/constant";
import { mainWindow } from "@/electron/main";
import { onIpc } from "./helpers";
import type { IpcOpenExternalLinkPayload } from "@/electron/ipcTypes";

export const windowController = () => {
  ipcMain.on(MESSAGE.CLOSE_CHILD_WINDOW, async (_event, _payload) => {
    const listWindow = BrowserWindow.getAllWindows();
    listWindow.forEach((win: BrowserWindow) => {
      if (win.id !== mainWindow.id) {
        win.close();
      }
    });
  });

  ipcMain.on(MESSAGE.ENTER_FULL_SCREEN, async (_event, _payload) => {
    mainWindow.setFullScreen(true);
  });

  ipcMain.on(MESSAGE.EXIT_FULL_SCREEN, async (_event, _payload) => {
    mainWindow.setFullScreen(false);
  });

  ipcMain.on(
    MESSAGE.OPEN_EXTERNAL_LINK,
    async (event, payload: IpcOpenExternalLinkPayload) => {
      const { url } = payload;
      shell.openExternal(url);
    },
  );

  onIpc(
    MESSAGE.GET_SCREEN_SIZE,
    MESSAGE.GET_SCREEN_SIZE_RES,
    async (event, _payload) => {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;

      event.reply(MESSAGE.GET_SCREEN_SIZE_RES, {
        data: { width, height },
      });
    },
  );

  onIpc(
    MESSAGE.CHECK_DEVICE_TYPE,
    MESSAGE.CHECK_DEVICE_TYPE_RES,
    async (event, _payload) => {
      const platform = os?.platform();
      const arch = process?.arch;

      const machine = os?.machine() || arch;
      const isMac = platform === "darwin";
      const isArmCpu = arch === "arm64" || machine === "arm64";

      event.reply(MESSAGE.CHECK_DEVICE_TYPE_RES, {
        data: {
          isMacOSArm: isMac && isArmCpu,
          isMacOSIntel: isMac && !isArmCpu,
          isWindow: platform === "win32",
        },
      });
    },
  );
};
