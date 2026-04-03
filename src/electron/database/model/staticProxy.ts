import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "StaticProxy",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      ip: { type: DataTypes.STRING, allowNull: false },
      port: { type: DataTypes.NUMBER, allowNull: false },
      protocol: { type: DataTypes.STRING, allowNull: false },
      username: { type: DataTypes.STRING, allowNull: true },
      password: { type: DataTypes.STRING, allowNull: true },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "StaticProxies",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["ip", "port", "protocol", "groupId"],
        },
      ],
    },
  );
