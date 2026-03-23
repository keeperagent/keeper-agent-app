import { DataTypes } from "sequelize";
import type { Migration } from "@/electron/database/migration/umzug";

export const up: Migration = async ({ context: sequelize }) => {
  const transaction = await sequelize.transaction();
  try {
    const queryInterface = sequelize.getQueryInterface();

    await queryInterface.addColumn(
      "Jobs",
      "agentRegistryId",
      {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ScheduleLogs",
      "traceData",
      {
        type: DataTypes.TEXT,
        allowNull: true,
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
