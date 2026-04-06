import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "AgentRegistry",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      llmProvider: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      llmModel: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      systemPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      allowedBaseTools: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "[]",
      },
      allowedMcpServerIds: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "[]",
      },
      allowedSkillIds: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "[]",
      },
      allowedSubAgentIds: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "[]",
      },
      isAgentInteractionEnabled: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      chainKey: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nodeEndpointGroupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      campaignId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      profileIds: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "[]",
      },
      isAllWallet: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      maxConcurrentTasks: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      encryptKey: {
        type: DataTypes.STRING,
        allowNull: true,
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
    },
  );
