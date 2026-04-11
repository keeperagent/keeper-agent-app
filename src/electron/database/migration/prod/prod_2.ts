import { DataTypes } from "sequelize";
import type { Migration } from "@/electron/database/migration/umzug";

export const up: Migration = async ({ context: sequelize }) => {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.getQueryInterface().addColumn(
      "Jobs",
      "handoffToNext",
      {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      { transaction },
    );

    await transaction.commit();
  } catch (err) {
    console.log("transaction rollback(), version: 2, up(), error: ", err);
    await transaction.rollback();
  }
};

export const down: Migration = async ({ context: sequelize }) => {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.getQueryInterface().removeColumn("Jobs", "handoffToNext", {
      transaction,
    });
    await transaction.commit();
  } catch (err) {
    console.log("transaction rollback(), version: 2, down(), error: ", err);
    await transaction.rollback();
  }
};
