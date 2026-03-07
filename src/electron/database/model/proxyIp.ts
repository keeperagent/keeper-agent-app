import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "ProxyIp",
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
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["ip", "port", "protocol", "groupId"],
        },
      ],
    }
  );
