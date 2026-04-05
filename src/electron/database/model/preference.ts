import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "Preference",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      nodeBlackList: {
        type: DataTypes.STRING,
        defaultValue: "[]",
      },
      isTelegramOn: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      chatIdTelegram: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      botTokenTelegram: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      isWhatsAppOn: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      whatsappAuthState: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "{}",
      },
      deviceId: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      hideMinimap: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      key: { type: DataTypes.STRING, allowNull: false },
      dayResetJobStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      maxLogAge: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      maxHistoryLogAge: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      isStopAllSchedule: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: 0,
      },
      customChromePath: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      maxConcurrentJob: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 100,
      },
      openAIApiKey: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      anthropicApiKey: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      googleGeminiApiKey: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      openAIModel: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      anthropicModel: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      googleGeminiModel: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      openAIBackgroundModel: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      anthropicBackgroundModel: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      googleGeminiBackgroundModel: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      jupiterApiKeys: {
        type: DataTypes.STRING,
        defaultValue: "[]",
      },
      masterPasswordVerifier: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      tavilyApiKey: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      exaApiKey: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      disabledTools: {
        type: DataTypes.STRING,
        defaultValue: "[]",
      },
      isMcpServerOn: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      mcpServerPort: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 55555,
      },
      isScreenCaptureProtectionOn: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      llmProvider: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["key"],
        },
      ],
    },
  );
