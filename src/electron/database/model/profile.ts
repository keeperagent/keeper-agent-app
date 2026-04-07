import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "Profile",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: { type: DataTypes.STRING, allowNull: true },
      note: { type: DataTypes.STRING, allowNull: true },
      walletId: { type: DataTypes.INTEGER, allowNull: true },
      walletGroupId: { type: DataTypes.INTEGER, allowNull: true },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      indexes: [{ fields: ["walletGroupId"] }],
    },
  );
