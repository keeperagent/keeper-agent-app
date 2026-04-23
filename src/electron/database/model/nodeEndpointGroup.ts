import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "NodeEndpointGroup",
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
      chainType: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      chainId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
    },
  );
