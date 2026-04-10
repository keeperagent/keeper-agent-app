import { DataTypes, Sequelize } from "sequelize";
import { ResourceGroupSource } from "@/electron/type";

export default (db: Sequelize) =>
  db.define(
    "ResourceGroup",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        defaultValue: "",
        allowNull: false,
      },
      note: {
        type: DataTypes.STRING,
      },
      source: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ResourceGroupSource.USER,
      },
      createAt: { type: DataTypes.INTEGER, allowNull: false },
      updateAt: { type: DataTypes.INTEGER, allowNull: false },
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
      col1IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col2IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col3IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col4IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col5IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col6IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col7IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col8IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col9IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col10IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col11IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col12IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col13IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col14IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col15IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col16IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col17IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col18IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col19IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col20IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col21IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col22IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col23IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col24IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col25IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col26IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col27IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col28IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col29IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      col30IsEncrypt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      timestamps: false,
    },
  );
