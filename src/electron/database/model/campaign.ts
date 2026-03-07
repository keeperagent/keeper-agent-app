import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "Campaign",
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
      numberOfThread: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      numberOfRound: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isSaveProfile: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      isUseProxy: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      maxProfilePerProxy: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        allowNull: true,
      },
      proxyService: { type: DataTypes.STRING, allowNull: true },
      proxyType: { type: DataTypes.STRING, allowNull: true },
      profileType: { type: DataTypes.STRING, allowNull: true },
      isUseRandomUserAgent: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: 0,
      },
      userAgentCategory: { type: DataTypes.STRING, allowNull: true },
      reloadDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      defaultOpenUrl: {
        type: DataTypes.STRING,
        defaultValue: "",
        allowNull: true,
      },
      windowWidth: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      windowHeight: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      isFullScreen: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: 0,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      isUseBrowser: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: 0,
      },

      col1Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col2Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col3Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col4Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col5Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col6Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col7Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col8Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col9Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col10Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },

      col1Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col2Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col3Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col4Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col5Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col6Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col7Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col8Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col9Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col10Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      sortField: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      sortOrder: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      listColumnForCalculate: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      unitForCalculate: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      note: {
        type: DataTypes.STRING,
      },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
    }
  );
