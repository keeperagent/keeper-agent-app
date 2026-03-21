import { DataTypes, Sequelize } from "sequelize";
import { ScheduleType } from "@/electron/type";

export default (db: Sequelize) =>
  db.define(
    "Schedule",
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
      repeat: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      repeatPerDay: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      durationBetweenRun: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      startTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      alertTelegram: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
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
      isRunning: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: 0,
      },
      note: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ScheduleType.WORKFLOW,
      },
      cronExpr: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isPaused: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      memoryFileKey: {
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
