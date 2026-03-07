import { spawn } from "child_process";
import fs from "fs-extra";
import path from "path";
import { app } from "electron";
import { db } from "@/electron/database";
import { TEMP_FOLDER, FILE_KEY } from "@/electron/constant";
import { getDbPath } from "@/electron/database/common";
import { removeLastTrailingSlash, logEveryWhere } from "./util";
import { encryptionService } from "./encrypt";

const tempFolder = removeLastTrailingSlash(
  path.join(app.getPath("userData"), TEMP_FOLDER),
);

const exportDatabase = async (folderPath: string): Promise<Error | null> => {
  try {
    const outputFilename = "database.txt";
    const tempSqlFileName = "export.sql";
    const tempFilePath = path.join(tempFolder, tempSqlFileName);

    const err: Error | null = await new Promise((resolve, reject) => {
      const command = "sqlite3";
      const args = [getDbPath()];
      const sqliteProcess = spawn(command, args);

      sqliteProcess.stdout.on("data", (data) => {
        logEveryWhere({ message: `exportDatabase() stdout: ${data}` });
      });

      sqliteProcess.stderr.on("data", (data) => {
        logEveryWhere({
          message: `exportDatabase() stderr: ${data?.toString()}`,
        });
        reject(data?.toString());
      });

      // Redirect the output of .dump to the file
      sqliteProcess.stdin.write(`.output "${tempFilePath}"\n`);
      sqliteProcess.stdin.write(".dump\n");
      sqliteProcess.stdin.write(".quit\n");

      sqliteProcess.stdin.end();

      sqliteProcess.on("close", (code) => {
        logEveryWhere({
          message: `exportDatabase() child process exited with code ${code}`,
        });
        resolve(null);
      });
    });

    // encrypt file (FILE_KEY so export can be shared between users)
    const sqlCommand = await fs.readFile(tempFilePath, "utf8");
    const encryptedSql = encryptionService.encryptData(sqlCommand, FILE_KEY);
    await fs.writeFile(
      `${removeLastTrailingSlash(folderPath)}/${outputFilename}`,
      encryptedSql,
    );
    fs.unlinkSync(tempFilePath);

    return err;
  } catch (err: any) {
    logEveryWhere({
      message: `exportDatabase() error: ${err?.message ?? err}`,
    });
    return err;
  }
};

const importDatabase = async (filePath: string): Promise<Error | null> => {
  const tempSqlFileName = "import.sql";
  const tempFilePath = path.join(tempFolder, tempSqlFileName);

  try {
    if (!fs.existsSync(filePath)) {
      return Error("file does not exist");
    }

    const encryptedSql = await fs.readFile(filePath, "utf8");
    const decryptedSql = encryptionService.decryptData(encryptedSql, FILE_KEY);

    await fs.writeFile(tempFilePath, decryptedSql);

    // drop all table because in sqlQuery already have create table statement
    await db.drop();

    const err: Error | null = await new Promise((resolve, reject) => {
      const command = "sqlite3";
      const args = [getDbPath()];
      const sqliteProcess = spawn(command, args);

      sqliteProcess.stdout.on("data", (data) => {
        logEveryWhere({ message: `importDatabase() stdout: ${data}` });
      });

      sqliteProcess.stderr.on("data", (data) => {
        logEveryWhere({
          message: `importDatabase() stderr: ${data?.toString()}`,
        });
        reject(data?.toString());
      });

      // Import the .dump file into the database
      sqliteProcess.stdin.write(`.read "${tempFilePath}"\n`);
      sqliteProcess.stdin.write(".quit\n");

      sqliteProcess.stdin.end();

      sqliteProcess.on("close", (code) => {
        logEveryWhere({
          message: `importDatabase() child process exited with code ${code}`,
        });
        resolve(null);
      });
    });
    return err;
  } catch (err: any) {
    logEveryWhere({
      message: `importDatabase() error: ${err?.message ?? err}`,
    });
    return err;
  } finally {
    fs.unlinkSync(tempFilePath);
  }
};

export { exportDatabase, importDatabase };
