import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "NodeEndpoint",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      endpoint: { type: DataTypes.STRING, allowNull: false },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["endpoint", "groupId"],
        },
      ],
    }
  );
