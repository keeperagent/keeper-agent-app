import path from "path";
import { Umzug, SequelizeStorage } from "umzug";
import { Sequelize } from "sequelize";
import { getDbPath } from "@/electron/database/common";

const db = new Sequelize({
  dialect: "sqlite",
  storage: getDbPath(),
  query: { nest: true },
  logging: true,
});

// Main process is bundled to dist/electron/main/index.js; migration files are emitted as migration/prod/*.js
const migrationDir = path.join(__dirname, "migration", "prod");

export const migrator = new Umzug({
  migrations: {
    glob: ["*.js", { cwd: migrationDir }],
  },
  context: db,
  storage: new SequelizeStorage({
    sequelize: db,
  }),
  logger: console,
});

export type Migration = typeof migrator._types.migration;
