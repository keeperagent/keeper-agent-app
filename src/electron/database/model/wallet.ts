import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "Wallet",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      index: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
      address: {
        type: DataTypes.STRING,
      },
      phrase: {
        type: DataTypes.STRING,
      },
      privateKey: {
        type: DataTypes.STRING,
      },
      note: { type: DataTypes.STRING, defaultValue: null },
      color: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
      isEncrypted: { type: DataTypes.BOOLEAN, defaultValue: false },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["address", "phrase", "privateKey", "groupId"],
        },
      ],
    }
  );
