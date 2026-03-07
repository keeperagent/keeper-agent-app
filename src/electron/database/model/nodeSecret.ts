import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "NodeSecret",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      workflowId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: "node_secret_unique",
      },
      nodeId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: "node_secret_unique",
      },
      secretKey: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
    },
  );
