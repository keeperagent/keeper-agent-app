import { app } from "electron";
import path from "path";
import {
  getDatabaseFileStatistic,
  getFolderStatistic,
} from "@/electron/service/file";
import {
  MESSAGE,
  RESPONSE_CODE,
  PROFILE_FOLDER,
  EXTENSION_FOLDER,
  TEMP_FOLDER,
  BROWSER_FOLDER,
  KA_SKILL_FOLDER,
} from "@/electron/constant";
import { onIpc } from "./helpers";
import type { IpcFolderStatisticPayload } from "@/electron/ipcTypes";

export const fileController = () => {
  onIpc<IpcFolderStatisticPayload>(
    MESSAGE.GET_PROFILE_FOLDER_STATISTIC,
    MESSAGE.GET_PROFILE_FOLDER_STATISTIC_RES,
    async (event, payload) => {
      const { limit } = payload;
      const folderPath = path.join(app.getPath("userData"), PROFILE_FOLDER);
      const [listFolder, totalFolder, totalSize, err] =
        await getFolderStatistic(folderPath, limit);
      if (err) {
        event.reply(MESSAGE.GET_PROFILE_FOLDER_STATISTIC_RES, {
          code: RESPONSE_CODE.ERROR,
          error: err?.message,
        });
        return;
      }

      event.reply(MESSAGE.GET_PROFILE_FOLDER_STATISTIC_RES, {
        data: listFolder,
        totalFolder,
        totalSize,
      });
    },
  );

  onIpc<IpcFolderStatisticPayload>(
    MESSAGE.GET_EXTENSION_FOLDER_STATISTIC,
    MESSAGE.GET_EXTENSION_FOLDER_STATISTIC_RES,
    async (event, payload) => {
      const { limit } = payload;
      const folderPath = path.join(app.getPath("userData"), EXTENSION_FOLDER);
      const [listFolder, totalFolder, totalSize, err] =
        await getFolderStatistic(folderPath, limit);
      if (err) {
        event.reply(MESSAGE.GET_EXTENSION_FOLDER_STATISTIC_RES, {
          code: RESPONSE_CODE.ERROR,
          error: err?.message,
        });
        return;
      }

      event.reply(MESSAGE.GET_EXTENSION_FOLDER_STATISTIC_RES, {
        data: listFolder,
        totalFolder,
        totalSize,
      });
    },
  );

  onIpc<IpcFolderStatisticPayload>(
    MESSAGE.GET_TEMP_FOLDER_STATISTIC,
    MESSAGE.GET_TEMP_FOLDER_STATISTIC_RES,
    async (event, payload) => {
      const { limit } = payload;
      const folderPath = path.join(app.getPath("userData"), TEMP_FOLDER);
      const [listFolder, totalFolder, totalSize, err] =
        await getFolderStatistic(folderPath, limit);
      if (err) {
        event.reply(MESSAGE.GET_TEMP_FOLDER_STATISTIC_RES, {
          code: RESPONSE_CODE.ERROR,
          error: err,
        });
        return;
      }

      event.reply(MESSAGE.GET_TEMP_FOLDER_STATISTIC_RES, {
        data: listFolder,
        totalFolder,
        totalSize,
      });
    },
  );

  onIpc<IpcFolderStatisticPayload>(
    MESSAGE.GET_SKILL_FOLDER_STATISTIC,
    MESSAGE.GET_SKILL_FOLDER_STATISTIC_RES,
    async (event, payload) => {
      const { limit } = payload;
      const folderPath = path.join(app.getPath("userData"), KA_SKILL_FOLDER);
      const [listFolder, totalFolder, totalSize, err] =
        await getFolderStatistic(folderPath, limit);
      if (err) {
        event.reply(MESSAGE.GET_SKILL_FOLDER_STATISTIC_RES, {
          code: RESPONSE_CODE.ERROR,
          error: err?.message,
        });
        return;
      }

      event.reply(MESSAGE.GET_SKILL_FOLDER_STATISTIC_RES, {
        data: listFolder,
        totalFolder,
        totalSize,
      });
    },
  );

  onIpc<IpcFolderStatisticPayload>(
    MESSAGE.GET_BROWSER_FOLDER_STATISTIC,
    MESSAGE.GET_BROWSER_FOLDER_STATISTIC_RES,
    async (event, payload) => {
      const { limit } = payload;
      const folderPath = path.join(app.getPath("userData"), BROWSER_FOLDER);
      const [listFolder, totalFolder, totalSize, err] =
        await getFolderStatistic(folderPath, limit);
      if (err) {
        event.reply(MESSAGE.GET_BROWSER_FOLDER_STATISTIC_RES, {
          code: RESPONSE_CODE.ERROR,
          error: err,
        });
        return;
      }

      event.reply(MESSAGE.GET_BROWSER_FOLDER_STATISTIC_RES, {
        data: listFolder,
        totalFolder,
        totalSize,
      });
    },
  );

  onIpc(
    MESSAGE.GET_DATABASE_FILE_STATISTIC,
    MESSAGE.GET_DATABASE_FILE_STATISTIC_RES,
    async (event, _payload) => {
      const [fileInfo, err] = await getDatabaseFileStatistic();
      if (err) {
        event.reply(MESSAGE.GET_DATABASE_FILE_STATISTIC_RES, {
          code: RESPONSE_CODE.ERROR,
          error: err,
        });
        return;
      }

      event.reply(MESSAGE.GET_DATABASE_FILE_STATISTIC_RES, {
        data: fileInfo,
      });
    },
  );

  onIpc(
    MESSAGE.GET_FOLDER_PATH,
    MESSAGE.GET_FOLDER_PATH_RES,
    async (event, _payload) => {
      const profileFolderPath = path.join(
        app.getPath("userData"),
        PROFILE_FOLDER,
      );
      const extensionFolderPath = path.join(
        app.getPath("userData"),
        EXTENSION_FOLDER,
      );
      const tempFolderPath = path.join(app.getPath("userData"), TEMP_FOLDER);
      const skillFolderPath = path.join(
        app.getPath("userData"),
        KA_SKILL_FOLDER,
      );
      const browserFolderPath = path.join(
        app.getPath("userData"),
        BROWSER_FOLDER,
      );

      event.reply(MESSAGE.GET_FOLDER_PATH_RES, {
        data: {
          profileFolderPath,
          extensionFolderPath,
          tempFolderPath,
          skillFolderPath,
          browserFolderPath,
        },
      });
    },
  );
};
