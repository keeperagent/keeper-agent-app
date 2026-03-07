import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "Extension",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      extensionId: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      name: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      description: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      version: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      storedAtPath: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      iconPath: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    { timestamps: false }
  );
