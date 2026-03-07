import { DataTypes, Sequelize } from "sequelize";

export default (db: Sequelize) =>
  db.define(
    "Resource",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      col1: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col2: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col3: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col4: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col5: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col6: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col7: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col8: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col9: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col10: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      isEncrypted: { type: DataTypes.BOOLEAN, defaultValue: false },

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
      createAt: { type: DataTypes.INTEGER, defaultValue: DataTypes.NOW },
      updateAt: { type: DataTypes.INTEGER, defaultValue: DataTypes.NOW },
    },
    {
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: [
            "col1",
            "col2",
            "col3",
            "col4",
            "col5",
            "col6",
            "col7",
            "col8",
            "col9",
            "col10",
            "groupId",
          ],
        },
      ],
    }
  );
