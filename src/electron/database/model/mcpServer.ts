import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "McpServer",
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
        defaultValue: "",
      },
      config: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      lastError: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
      },
      toolsCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
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
