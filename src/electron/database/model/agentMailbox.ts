import { DataTypes, Sequelize } from "sequelize";
import { AgentMailboxStatus } from "@/electron/type";

export default (db: Sequelize) =>
  db.define(
    "AgentMailbox",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      fromAgentId: {
        type: DataTypes.INTEGER,
        allowNull: true, // null = sent by main agent
      },
      toAgentId: {
        type: DataTypes.INTEGER,
        allowNull: true, // null when isBroadcast = true
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: AgentMailboxStatus.UNREAD,
      },
      isBroadcast: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createAt: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: false,
    },
  );
