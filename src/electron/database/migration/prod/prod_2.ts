import { DataTypes } from "sequelize";
import type { Migration } from "@/electron/database/migration/umzug";

export const up: Migration = async ({ context: sequelize }) => {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.getQueryInterface().addColumn(
      "Preferences",
      "isMcpServerOn",
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      { transaction },
    );

    await sequelize.getQueryInterface().addColumn(
      "Preferences",
      "mcpServerPort",
      {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 55555,
      },
      { transaction },
    );

    await transaction.commit();
  } catch (err) {
    console.log("transaction rollback(), version: 2, up(), error: ", err);
    await transaction.rollback();
  }
};

export const down: Migration = async ({ context: _sequelize }) => {};
