import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import { preferenceDB } from "@/electron/database/preference";
import { masterPasswordManager } from "@/electron/service/masterPassword";
import { telegramBotService } from "@/electron/chatGateway/adapters/telegram";
import { agentTaskScheduler } from "@/electron/service/agentTaskScheduler";
import {
  IpcSetupMasterPasswordPayload,
  IpcVerifyMasterPasswordPayload,
  IpcResetMasterPasswordPayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

const onMasterPasswordUnlock = () => {
  telegramBotService.start();
  agentTaskScheduler.onUnlock();
};

export const masterPasswordController = () => {
  // Check if master password has been set up (verifier exists in DB)
  onIpc(
    MESSAGE.CHECK_MASTER_PASSWORD_EXISTS,
    MESSAGE.CHECK_MASTER_PASSWORD_EXISTS_RES,
    async (event) => {
      const [preference] = await preferenceDB.getOnePreferenceRaw();
      const exists = Boolean(preference?.masterPasswordVerifier);
      event.reply(MESSAGE.CHECK_MASTER_PASSWORD_EXISTS_RES, {
        code: RESPONSE_CODE.SUCCESS,
        data: { exists },
      });
    },
  );

  // First-time setup: create master password
  onIpc<IpcSetupMasterPasswordPayload>(
    MESSAGE.SETUP_MASTER_PASSWORD,
    MESSAGE.SETUP_MASTER_PASSWORD_RES,
    async (event, payload) => {
      const { password, email } = payload;
      if (!email) {
        event.reply(MESSAGE.SETUP_MASTER_PASSWORD_RES, {
          code: RESPONSE_CODE.ERROR,
          message: "Email is required",
        });
        return;
      }
      if (!password) {
        event.reply(MESSAGE.SETUP_MASTER_PASSWORD_RES, {
          code: RESPONSE_CODE.ERROR,
          message: "Password is required",
        });
        return;
      }

      masterPasswordManager.setSalt(email);
      const passwordBuffer = masterPasswordManager.derivePassword(password);
      const verifier = masterPasswordManager.createVerifier(passwordBuffer);

      const [preference] = await preferenceDB.getOnePreferenceRaw();
      await preferenceDB.updatePreference({
        id: preference?.id,
        masterPasswordVerifier: verifier,
      });

      masterPasswordManager.setMasterPassword(passwordBuffer);
      onMasterPasswordUnlock();

      event.reply(MESSAGE.SETUP_MASTER_PASSWORD_RES, {
        code: RESPONSE_CODE.SUCCESS,
        success: true,
      });
    },
  );

  onIpc<IpcVerifyMasterPasswordPayload>(
    MESSAGE.VERIFY_MASTER_PASSWORD,
    MESSAGE.VERIFY_MASTER_PASSWORD_RES,
    async (event, payload) => {
      const { password, email } = payload;
      if (!email) {
        event.reply(MESSAGE.VERIFY_MASTER_PASSWORD_RES, {
          code: RESPONSE_CODE.ERROR,
          message: "Email is required",
        });
        return;
      }
      if (!password) {
        event.reply(MESSAGE.VERIFY_MASTER_PASSWORD_RES, {
          code: RESPONSE_CODE.ERROR,
          message: "Password is required",
        });
        return;
      }

      const [preference] = await preferenceDB.getOnePreferenceRaw();
      const verifier = preference?.masterPasswordVerifier;
      if (!verifier) {
        event.reply(MESSAGE.VERIFY_MASTER_PASSWORD_RES, {
          code: RESPONSE_CODE.ERROR,
          message: "Master password not set up",
        });
        return;
      }

      masterPasswordManager.setSalt(email);
      const isValid = masterPasswordManager.verifyPassword(password, verifier);
      if (!isValid) {
        event.reply(MESSAGE.VERIFY_MASTER_PASSWORD_RES, {
          code: RESPONSE_CODE.ERROR,
          message: "Incorrect master password",
        });
        return;
      }

      const passwordBuffer = masterPasswordManager.derivePassword(password);
      masterPasswordManager.setMasterPassword(passwordBuffer);
      onMasterPasswordUnlock();

      event.reply(MESSAGE.VERIFY_MASTER_PASSWORD_RES, {
        code: RESPONSE_CODE.SUCCESS,
        success: true,
      });
    },
  );

  onIpc<IpcResetMasterPasswordPayload>(
    MESSAGE.RESET_MASTER_PASSWORD,
    MESSAGE.RESET_MASTER_PASSWORD_RES,
    async (event, payload) => {
      const { newPassword, email } = payload;

      if (!email) {
        event.reply(MESSAGE.RESET_MASTER_PASSWORD_RES, {
          code: RESPONSE_CODE.ERROR,
          error: "Email is required",
        });
        return;
      }
      if (!newPassword) {
        event.reply(MESSAGE.RESET_MASTER_PASSWORD_RES, {
          code: RESPONSE_CODE.ERROR,
          error: "New password is required",
        });
        return;
      }

      const [preference] = await preferenceDB.getOnePreferenceRaw();
      if (!preference?.id) {
        event.reply(MESSAGE.RESET_MASTER_PASSWORD_RES, {
          code: RESPONSE_CODE.ERROR,
          error: "Preference not found",
        });
        return;
      }

      masterPasswordManager.setSalt(email);
      const passwordBuffer = masterPasswordManager.derivePassword(newPassword);
      const verifierToSet =
        masterPasswordManager.createVerifier(passwordBuffer);

      const [updated] = await preferenceDB.updateMasterPasswordVerifier(
        preference.id,
        verifierToSet,
      );
      if (!updated) {
        event.reply(MESSAGE.RESET_MASTER_PASSWORD_RES, {
          code: RESPONSE_CODE.ERROR,
          error: "Failed to set new master password",
        });
        return;
      }

      masterPasswordManager.setMasterPassword(passwordBuffer);
      onMasterPasswordUnlock();

      event.reply(MESSAGE.RESET_MASTER_PASSWORD_RES, {
        code: RESPONSE_CODE.SUCCESS,
        success: true,
        hasNewPassword: true,
      });
    },
  );
};
