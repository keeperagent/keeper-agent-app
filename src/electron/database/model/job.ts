import { DataTypes, Sequelize } from "sequelize";
import { JobType } from "@/electron/type";

export default (db: Sequelize) =>
  db.define(
    "Job",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: JobType.WORKFLOW,
      },
      campaignId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      workflowId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isRunWithSchedule: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      secretKey: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      timeout: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      isRunning: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      lastRunTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      lastEndTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      onlyRunOnce: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: 0,
      },
      prompt: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notifyPlatform: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notifyOnlyIfAgentSays: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      toolContextJson: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      useOutputFromPrev: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      conditionType: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "none",
      },
      conditionPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      maxRetries: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      retryDelayMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 5,
      },
      llmProvider: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
    },
  );
