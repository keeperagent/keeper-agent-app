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
      allowedCampaignIds: {
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
