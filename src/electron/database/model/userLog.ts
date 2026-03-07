import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "UserLog",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      content: {
        type: DataTypes.STRING,
        defaultValue: "",
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
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    { timestamps: false }
  );
