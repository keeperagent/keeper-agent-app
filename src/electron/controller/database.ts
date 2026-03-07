import { MESSAGE } from "@/electron/constant";
import { exportDatabase, importDatabase } from "@/electron/service/database";
import { onIpc } from "./helpers";
import type {
  IpcExportDatabasePayload,
  IpcImportDatabasePayload,
} from "@/electron/ipcTypes";

export const databaseController = () => {
  onIpc<IpcExportDatabasePayload>(
    MESSAGE.EXPORT_DATABASE,
    MESSAGE.EXPORT_DATABASE_RES,
    async (event, payload) => {
      const { folderPath } = payload;
      const err = await exportDatabase(folderPath);
      event.reply(MESSAGE.EXPORT_DATABASE_RES, {
        error: err?.message,
      });
    },
  );

  onIpc<IpcImportDatabasePayload>(
    MESSAGE.IMPORT_DATABASE,
    MESSAGE.IMPORT_DATABASE_RES,
    async (event, payload) => {
      const { filePath } = payload;
      const err = await importDatabase(filePath);
      event.reply(MESSAGE.IMPORT_DATABASE_RES, {
        error: err?.message,
      });
    },
  );
};
