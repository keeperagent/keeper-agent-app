import { DataTypes, Sequelize } from "sequelize";

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
    },
    {
      timestamps: false,
    }
  );
