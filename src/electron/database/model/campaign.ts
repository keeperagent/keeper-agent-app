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
      col11Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col12Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col13Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col14Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col15Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col16Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col17Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col18Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col19Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col20Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col21Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col22Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col23Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col24Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col25Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col26Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col27Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col28Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col29Variable: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col30Variable: {
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
      col11Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col12Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col13Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col14Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col15Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col16Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col17Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col18Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col19Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col20Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col21Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col22Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col23Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col24Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col25Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col26Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col27Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col28Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col29Label: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col30Label: {
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
      columnOrder: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "[]",
      },
      note: {
        type: DataTypes.STRING,
      },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
    },
  );
