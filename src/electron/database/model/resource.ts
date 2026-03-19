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
      col11: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col12: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col13: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col14: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col15: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col16: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col17: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col18: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col19: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col20: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col21: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col22: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col23: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col24: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col25: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col26: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col27: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col28: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col29: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      col30: {
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
            "col11",
            "col12",
            "col13",
            "col14",
            "col15",
            "col16",
            "col17",
            "col18",
            "col19",
            "col20",
            "col21",
            "col22",
            "col23",
            "col24",
            "col25",
            "col26",
            "col27",
            "col28",
            "col29",
            "col30",
            "groupId",
          ],
        },
      ],
    },
  );
