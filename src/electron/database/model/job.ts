import { DataTypes, Sequelize } from "sequelize";

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
      campaignId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      workflowId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
    }
  );
