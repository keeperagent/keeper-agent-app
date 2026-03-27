import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "AppLog",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      logType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      campaignId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      workflowId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      scheduleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      jobId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      taskId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      actorType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      actorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      actorName: {
        type: DataTypes.STRING,
        allowNull: true,
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
      nextRetryAt: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      startedAt: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      finishedAt: {
        type: DataTypes.INTEGER,
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
