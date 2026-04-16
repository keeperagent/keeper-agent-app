import { ipcMain, IpcMainEvent } from "electron";
import { MESSAGE } from "@/electron/constant";
import {
  saveAuth,
  loadAuth,
  clearAuth,
} from "@/electron/service/authSafeStorage";
import { masterPasswordManager } from "@/electron/service/masterPassword";
import { preferenceService } from "@/electron/service/preference";
import { licenseService } from "@/electron/service/licenseService";

export const authStorageController = () => {
  // Renderer requests current auth state on startup
  ipcMain.on(MESSAGE.GET_AUTH_STATE, (event: IpcMainEvent) => {
    const auth = loadAuth();
    event.reply(MESSAGE.GET_AUTH_STATE_RES, {
      token: auth?.token || null,
      user: auth?.user || null,
    });
  });

  // Renderer saves token + user after login or token refresh
  ipcMain.on(
    MESSAGE.SAVE_AUTH_TOKEN,
    (_event: IpcMainEvent, payload: { token: string; user: any }) => {
      if (payload?.token) {
        saveAuth(payload.token, payload.user);
        licenseService.onAuthChange();
      }
    },
  );

  // Renderer clears token on logout
  ipcMain.on(MESSAGE.CLEAR_AUTH_TOKEN, async () => {
    clearAuth();
    masterPasswordManager.clearMasterPassword();
    licenseService.onAuthChange();

    await preferenceService.updateMasterPasswordVerifier("");
  });
};
