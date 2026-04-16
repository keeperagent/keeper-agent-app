import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import { logEveryWhere } from "@/electron/service/util";

const DB_FILE_NAME = "ka_app.db";

let _dbPath: string | null = null;

export const getDbPath = (): string => {
  if (!_dbPath) {
    _dbPath = path.join(app.getPath("userData"), DB_FILE_NAME);
    const isExist = fs.pathExistsSync(_dbPath);
    if (!isExist) {
      logEveryWhere({ message: `Create database file, path: ${_dbPath}` });
      fs.openSync(_dbPath, "w", 0o600);
    }
  }
  return _dbPath;
};
