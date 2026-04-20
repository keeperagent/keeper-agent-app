import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import { logEveryWhere } from "@/electron/service/util";

const DB_FILE_NAME = "ka_app.db";
const VEC_DB_FILE_NAME = "ka_app_vec.db";

let dbPath: string | null = null;
export const getDbPath = (): string => {
  if (!dbPath) {
    dbPath = path.join(app.getPath("userData"), DB_FILE_NAME);
    const isExist = fs.pathExistsSync(dbPath);
    if (!isExist) {
      logEveryWhere({ message: `Create database file, path: ${dbPath}` });
      fs.openSync(dbPath, "w", 0o600);
    }
  }
  return dbPath;
};

let vecDbPath: string | null = null;
export const getVecDbPath = (): string => {
  if (!vecDbPath) {
    vecDbPath = path.join(app.getPath("userData"), VEC_DB_FILE_NAME);
    const isExist = fs.pathExistsSync(vecDbPath);
    if (!isExist) {
      logEveryWhere({
        message: `Create vec database file, path: ${vecDbPath}`,
      });
      fs.openSync(vecDbPath, "w", 0o600);
    }
  }
  return vecDbPath;
};
