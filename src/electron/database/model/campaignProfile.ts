import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "CampaignProfile",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: true },
      note: { type: DataTypes.STRING, allowNull: true },
      color: { type: DataTypes.STRING, allowNull: true },
      walletId: { type: DataTypes.INTEGER, allowNull: true },
      walletGroupId: { type: DataTypes.INTEGER, allowNull: true },
      campaignId: { type: DataTypes.INTEGER, allowNull: false },
      round: { type: DataTypes.INTEGER, defaultValue: 0 },
      isRunning: { type: DataTypes.BOOLEAN, defaultValue: false },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
      profileFolder: { type: DataTypes.STRING, allowNull: false },

      col1Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col2Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col3Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col4Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col5Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col6Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col7Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col8Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col9Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col10Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col11Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col12Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col13Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col14Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col15Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col16Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col17Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col18Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col19Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col20Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col21Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col22Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col23Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col24Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col25Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col26Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col27Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col28Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col29Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      col30Value: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      indexes: [
        { fields: ["campaignId", "isActive"] },
        { fields: ["campaignId", "isRunning"] },
      ],
    },
  );
