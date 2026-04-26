import { proto, initAuthCreds, BufferJSON } from "@whiskeysockets/baileys";
import type { AuthenticationState } from "@whiskeysockets/baileys";
import { IPreference, ILlmSetting, SETTING_TYPE } from "@/electron/type";
import { settingDB } from "@/electron/database/setting";
import { logEveryWhere } from "@/electron/service/util";
import { encryptionService } from "@/electron/service/encrypt";

class PreferenceService {
  private readPreference = async (type: string): Promise<any> => {
    const [setting] = await settingDB.getSettingByType(type);
    try {
      return JSON.parse(setting?.data || "{}");
    } catch {
      return {};
    }
  };

  private writePreference = async (
    type: string,
    blobData: any,
  ): Promise<void> => {
    await settingDB.upsertSettingByType(type, JSON.stringify(blobData));
  };

  private patchSetting = async (type: string, patch: object): Promise<void> => {
    const current = await this.readPreference(type);
    await this.writePreference(type, { ...current, ...patch });
  };

  getOnePreference = async (): Promise<[IPreference | null, Error | null]> => {
    try {
      const [
        [generalResult],
        [llmResult],
        [telegramResult],
        [whatsappResult],
        [dexResult],
        [masterPwResult],
      ] = await Promise.all([
        settingDB.getSettingByType(SETTING_TYPE.GENERAL_SETTING),
        settingDB.getSettingByType(SETTING_TYPE.LLM_SETTING),
        settingDB.getSettingByType(SETTING_TYPE.TELEGRAM_SETTING),
        settingDB.getSettingByType(SETTING_TYPE.WHATSAPP_SETTING),
        settingDB.getSettingByType(SETTING_TYPE.DEX_SETTING),
        settingDB.getSettingByType(SETTING_TYPE.MASTER_PASSWORD_SETTING),
      ]);
      if (!generalResult) {
        return [null, null];
      }

      const general = generalResult?.generalSetting || {};
      const llm = llmResult?.llmSetting || {};
      const dex = dexResult?.dexSetting || {};
      const telegram = telegramResult?.telegramSetting || {};
      const whatsapp = whatsappResult?.whatsappSetting || {};
      const masterPw = masterPwResult?.masterPasswordSetting || {};

      const preference: IPreference = {
        id: generalResult?.id,
        ...general,
        ...llm,
        ...dex,
        ...telegram,
        isWhatsAppOn: whatsapp.isWhatsAppOn,
        masterPasswordVerifier: masterPw.masterPasswordVerifier,
      };

      return [preference, null];
    } catch (err: any) {
      logEveryWhere({ message: `getOnePreference() error: ${err?.message}` });
      return [null, err];
    }
  };

  getLlmSetting = async (): Promise<[ILlmSetting | null, Error | null]> => {
    try {
      const [setting] = await settingDB.getSettingByType(
        SETTING_TYPE.LLM_SETTING,
      );
      return [setting?.llmSetting || null, null];
    } catch (err: any) {
      logEveryWhere({ message: `getLlmSetting() error: ${err?.message}` });
      return [null, err];
    }
  };

  getMasterPasswordVerifier = async (): Promise<[string, Error | null]> => {
    try {
      const parsed = await this.readPreference(
        SETTING_TYPE.MASTER_PASSWORD_SETTING,
      );
      return [parsed.masterPasswordVerifier || "", null];
    } catch (err: any) {
      logEveryWhere({
        message: `getMasterPasswordVerifier() error: ${err?.message}`,
      });
      return ["", err];
    }
  };

  updatePreference = async (
    preference: IPreference,
  ): Promise<[IPreference | null, Error | null]> => {
    try {
      const updates: Promise<void>[] = [];

      const patchPlain = (keys: (keyof IPreference)[]) =>
        Object.fromEntries(
          keys
            .filter((key) => preference[key] !== undefined)
            .map((key) => [key, preference[key]]),
        );

      const patchEncrypted = (keys: (keyof IPreference)[]) =>
        Object.fromEntries(
          keys
            .filter((key) => preference[key] !== undefined)
            .map((key) => [
              key,
              preference[key]
                ? encryptionService.encryptData(preference[key] as string)
                : "",
            ]),
        );

      // General setting
      const generalKeys: (keyof IPreference)[] = [
        "nodeBlackList",
        "hideMinimap",
        "deviceId",
        "isStopAllSchedule",
        "dayResetJobStatus",
        "maxLogAge",
        "maxHistoryLogAge",
        "customChromePath",
        "maxConcurrentJob",
        "isScreenCaptureProtectionOn",
      ];
      if (generalKeys.some((key) => preference[key] !== undefined)) {
        updates.push(
          this.patchSetting(
            SETTING_TYPE.GENERAL_SETTING,
            patchPlain(generalKeys),
          ),
        );
      }

      // LLM setting (API keys encrypted)
      const llmPlainKeys: (keyof IPreference)[] = [
        "openAIModel",
        "anthropicModel",
        "googleGeminiModel",
        "openAIBackgroundModel",
        "anthropicBackgroundModel",
        "googleGeminiBackgroundModel",
        "disabledTools",
        "isMcpServerOn",
        "mcpServerPort",
        "openRouterModel",
        "ollamaBaseUrl",
        "ollamaModel",
        "useClaudeCLI",
        "useCodexCLI",
      ];
      const llmEncryptedKeys: (keyof IPreference)[] = [
        "openAIApiKey",
        "anthropicApiKey",
        "googleGeminiApiKey",
        "tavilyApiKey",
        "exaApiKey",
        "openRouterApiKey",
      ];
      const llmKeys = [...llmPlainKeys, ...llmEncryptedKeys];
      if (llmKeys.some((key) => preference[key] !== undefined)) {
        updates.push(
          this.patchSetting(SETTING_TYPE.LLM_SETTING, {
            ...patchPlain(llmPlainKeys),
            ...patchEncrypted(llmEncryptedKeys),
          }),
        );
      }

      // DEX setting (jupiterApiKeys encrypted)
      if (preference.jupiterApiKeys !== undefined) {
        updates.push(
          this.patchSetting(SETTING_TYPE.DEX_SETTING, {
            jupiterApiKeys: encryptionService.encryptData(
              JSON.stringify(preference.jupiterApiKeys || []),
            ),
          }),
        );
      }

      // Telegram setting (botTokenTelegram encrypted)
      const telegramPlainKeys: (keyof IPreference)[] = [
        "chatIdTelegram",
        "isTelegramOn",
      ];
      const telegramEncryptedKeys: (keyof IPreference)[] = ["botTokenTelegram"];
      const telegramKeys = [...telegramPlainKeys, ...telegramEncryptedKeys];
      if (telegramKeys.some((key) => preference[key] !== undefined)) {
        updates.push(
          this.patchSetting(SETTING_TYPE.TELEGRAM_SETTING, {
            ...patchPlain(telegramPlainKeys),
            ...patchEncrypted(telegramEncryptedKeys),
          }),
        );
      }

      // WhatsApp setting
      if (preference.isWhatsAppOn !== undefined) {
        updates.push(
          this.patchSetting(SETTING_TYPE.WHATSAPP_SETTING, {
            isWhatsAppOn: preference.isWhatsAppOn,
          }),
        );
      }

      // Master password setting
      if (preference.masterPasswordVerifier !== undefined) {
        updates.push(
          this.patchSetting(SETTING_TYPE.MASTER_PASSWORD_SETTING, {
            masterPasswordVerifier: preference.masterPasswordVerifier,
          }),
        );
      }

      await Promise.all(updates);
      return await this.getOnePreference();
    } catch (err: any) {
      logEveryWhere({ message: `updatePreference() error: ${err?.message}` });
      return [null, err];
    }
  };

  getWhatsAppAuthState = async (): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
  }> => {
    let store: Record<string, any> = {};
    try {
      const [setting] = await settingDB.getSettingByType(
        SETTING_TYPE.WHATSAPP_SETTING,
      );
      const raw = setting?.whatsappSetting?.whatsappAuthState || "{}";
      store = JSON.parse(raw, BufferJSON.reviver);
    } catch {}
    const creds = store.creds || initAuthCreds();

    const saveStore = async () => {
      await this.patchSetting(SETTING_TYPE.WHATSAPP_SETTING, {
        whatsappAuthState: JSON.stringify(store, BufferJSON.replacer),
      });
    };

    return {
      state: {
        creds,
        keys: {
          get: async (type, ids) => {
            const data: Record<string, any> = {};
            for (const id of ids) {
              const entryKey = `${type}-${id}`;
              let value = store[entryKey] || null;
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            }
            return data;
          },
          set: async (data) => {
            const entries = data as Record<string, Record<string, any>>;
            for (const category in entries) {
              for (const id in entries[category]) {
                const entryKey = `${category}-${id}`;
                const value = entries[category][id];
                if (value) {
                  store[entryKey] = value;
                } else {
                  delete store[entryKey];
                }
              }
            }
            await saveStore();
          },
        },
      },
      saveCreds: async () => {
        store.creds = creds;
        await saveStore();
      },
    };
  };

  clearWhatsAppAuthState = async (): Promise<void> => {
    try {
      await this.patchSetting(SETTING_TYPE.WHATSAPP_SETTING, {
        whatsappAuthState: "{}",
      });
    } catch (err: any) {
      logEveryWhere({
        message: `clearWhatsAppAuthState() error: ${err?.message}`,
      });
    }
  };

  updateMasterPasswordVerifier = async (
    verifier: string,
  ): Promise<[boolean, Error | null]> => {
    try {
      await this.patchSetting(SETTING_TYPE.MASTER_PASSWORD_SETTING, {
        masterPasswordVerifier: verifier,
      });
      return [true, null];
    } catch (err: any) {
      logEveryWhere({
        message: `updateMasterPasswordVerifier() error: ${err?.message}`,
      });
      return [false, err];
    }
  };
}

const preferenceService = new PreferenceService();
export { preferenceService };
