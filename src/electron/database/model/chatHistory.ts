import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "ChatHistory",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      // 'human' | 'ai' | 'summary'
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      // When true this row is a compacted summary of older messages
      isSummary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // The id of the last non-summary message included in this summary.
      // Used to know which messages are "already summarised" vs still verbatim.
      summaryUpTo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      timestamp: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: false,
    },
  );
