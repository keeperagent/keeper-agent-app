import { migrator } from "./umzug";
import { logEveryWhere } from "@/electron/service/util";

// Reference: https://sequelize.org/docs/v6/other-topics/migrations/#migration-skeleton

const runMigration = async () => {
  try {
    logEveryWhere({ message: "=== Run migration ===" });
    await migrator.up();
  } catch (err: any) {
    logEveryWhere({ message: `runMigration() error: ${err?.message}` });
  }
};

const roolbackMigration = async () => {
  try {
    logEveryWhere({ message: "=== Rollback migration ===" });
    await migrator.down();
  } catch (err: any) {
    logEveryWhere({ message: `rollbackMigration() error: ${err?.message}` });
  }
};

export { runMigration, roolbackMigration };
