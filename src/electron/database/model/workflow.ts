import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "Workflow",
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
      note: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      data: {
        type: DataTypes.TEXT,
        defaultValue: "",
      },
      numberOfThread: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      numberOfRound: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      windowWidth: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      windowHeight: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      isFullScreen: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: 0,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      listVariable: {
        type: DataTypes.TEXT,
        defaultValue: "[]",
      },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
    },
  );
