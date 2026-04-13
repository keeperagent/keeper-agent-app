import type { Migration } from "@/electron/database/migration/umzug";

// Migrate data from the old Preferences table (single-row, flat columns)
// into the new Settings table (one row per setting type, JSON blob).
// This is idempotent — if a Settings row already exists for a type, it is skipped.

const SETTING_TYPE = {
  GENERAL_SETTING: "GENERAL_SETTING",
  LLM_SETTING: "LLM_SETTING",
  DEX_SETTING: "DEX_SETTING",
  TELEGRAM_SETTING: "TELEGRAM_SETTING",
  WHATSAPP_SETTING: "WHATSAPP_SETTING",
  MASTER_PASSWORD_SETTING: "MASTER_PASSWORD_SETTING",
};

export const up: Migration = async ({ context: sequelize }) => {
  const transaction = await sequelize.transaction();
  try {
    const tables = await sequelize.getQueryInterface().showAllTables();
    if (!tables.includes("Preferences")) {
      await transaction.commit();
      return;
    }

    const [rows] = await sequelize.query("SELECT * FROM Preferences LIMIT 1", {
      transaction,
    }) as [any[], any];

    if (!rows || rows.length === 0) {
      await transaction.commit();
      return;
    }

    const pref = rows[0];
    const now = new Date().getTime();

    const settingsToInsert: { type: string; data: string }[] = [
      {
        type: SETTING_TYPE.GENERAL_SETTING,
        data: JSON.stringify({
          nodeBlackList: pref.nodeBlackList || "[]",
          hideMinimap: pref.hideMinimap || false,
          deviceId: pref.deviceId || null,
          isStopAllSchedule: pref.isStopAllSchedule || false,
          dayResetJobStatus: pref.dayResetJobStatus || 0,
          maxLogAge: pref.maxLogAge || 0,
          maxHistoryLogAge: pref.maxHistoryLogAge || 0,
          customChromePath: pref.customChromePath || "",
          maxConcurrentJob: pref.maxConcurrentJob || 30,
          isScreenCaptureProtectionOn: pref.isScreenCaptureProtectionOn !== undefined
            ? pref.isScreenCaptureProtectionOn
            : true,
        }),
      },
      {
        type: SETTING_TYPE.LLM_SETTING,
        // API key fields are already encrypted in the old Preferences table — copy as-is
        data: JSON.stringify({
          openAIApiKey: pref.openAIApiKey || "",
          anthropicApiKey: pref.anthropicApiKey || "",
          googleGeminiApiKey: pref.googleGeminiApiKey || "",
          tavilyApiKey: pref.tavilyApiKey || "",
          exaApiKey: pref.exaApiKey || "",
          openAIModel: pref.openAIModel || "",
          anthropicModel: pref.anthropicModel || "",
          googleGeminiModel: pref.googleGeminiModel || "",
          openAIBackgroundModel: pref.openAIBackgroundModel || "",
          anthropicBackgroundModel: pref.anthropicBackgroundModel || "",
          googleGeminiBackgroundModel: pref.googleGeminiBackgroundModel || "",
          llmProvider: pref.llmProvider || null,
          disabledTools: pref.disabledTools || "[]",
          isMcpServerOn: pref.isMcpServerOn || false,
          mcpServerPort: pref.mcpServerPort || 3888,
        }),
      },
      {
        type: SETTING_TYPE.DEX_SETTING,
        // jupiterApiKeys is already encrypted in the old Preferences table — copy as-is
        data: JSON.stringify({
          jupiterApiKeys: pref.jupiterApiKeys || "",
        }),
      },
      {
        type: SETTING_TYPE.TELEGRAM_SETTING,
        // botTokenTelegram is already encrypted in the old Preferences table — copy as-is
        data: JSON.stringify({
          chatIdTelegram: pref.chatIdTelegram || "",
          isTelegramOn: pref.isTelegramOn || false,
          botTokenTelegram: pref.botTokenTelegram || "",
        }),
      },
      {
        type: SETTING_TYPE.WHATSAPP_SETTING,
        data: JSON.stringify({
          isWhatsAppOn: pref.isWhatsAppOn || false,
          whatsappAuthState: pref.whatsappAuthState || "{}",
        }),
      },
      {
        type: SETTING_TYPE.MASTER_PASSWORD_SETTING,
        data: JSON.stringify({
          masterPasswordVerifier: pref.masterPasswordVerifier || "",
        }),
      },
    ];

    for (const setting of settingsToInsert) {
      const [existing] = await sequelize.query(
        "SELECT id FROM Settings WHERE type = ? AND name = ''",
        { replacements: [setting.type], transaction },
      ) as [any[], any];

      if (!existing || existing.length === 0) {
        await sequelize.query(
          "INSERT INTO Settings (name, type, data, createAt, updateAt) VALUES ('', ?, ?, ?, ?)",
          { replacements: [setting.type, setting.data, now, now], transaction },
        );
      }
    }

    await transaction.commit();
  } catch (err) {
    console.log("transaction rollback(), version: 2, up(), error: ", err);
    await transaction.rollback();
  }
};

export const down: Migration = async ({ context: _sequelize }) => {};
