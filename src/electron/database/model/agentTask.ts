import { DataTypes, Sequelize } from "sequelize";
import { AgentTaskCreatorType } from "@/electron/type";

export default (db: Sequelize) =>
  db.define(
    "AgentTask",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "INIT",
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "MEDIUM",
      },
      source: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "INTERNAL",
      },
      assignedAgentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      creatorType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: AgentTaskCreatorType.USER,
      },
      creatorAgentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      scheduledAt: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      dueAt: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ttlSeconds: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      timeout: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "{}",
      },
      result: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      retryCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      maxRetries: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      claimedAt: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      startedAt: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cancelledAt: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isPinned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createAt: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      updateAt: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      indexes: [
        { fields: ["status"] },
        { fields: ["status", "assignedAgentId"] },
        { fields: ["createAt"] },
      ],
    },
  );
