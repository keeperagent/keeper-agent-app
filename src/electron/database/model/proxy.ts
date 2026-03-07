import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "Proxy",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      apiKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["apiKey", "type"],
        },
      ],
    }
  );
