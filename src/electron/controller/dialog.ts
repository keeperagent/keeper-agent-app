import { dialog, OpenDialogOptions, shell, app } from "electron";
import fs from "fs";
import path from "path";
import { MESSAGE, TEMP_FOLDER } from "@/electron/constant";
import { mainWindow } from "@/electron/main";
import { getSkillDirPath } from "@/electron/service/agentSkill";
import { onIpc } from "./helpers";
import type {
  IpcChooseFilePayload,
  IpcReadFileAsDataUrlPayload,
  IpcOpenFolderPayload,
  IpcSaveClipboardImagePayload,
  IpcDeleteTempFilePayload,
} from "@/electron/ipcTypes";
import { logEveryWhere } from "@/electron/service/util";

export const dialogController = () => {
  onIpc(
    MESSAGE.CHOOSE_FOLDER,
    MESSAGE.CHOOSE_FOLDER_RES,
    async (event, _payload) => {
      if (!mainWindow) {
        return;
      }

      // Reference: https://www.electronjs.org/docs/latest/api/dialog
      const chooseFolderDialog: OpenDialogOptions = {
        title: "Select folder",
        buttonLabel: "Select",
        properties: ["openDirectory"],
      };

      const { filePaths } = await dialog.showOpenDialog(
        mainWindow,
        chooseFolderDialog,
      );

      event.reply(MESSAGE.CHOOSE_FOLDER_RES, {
        data: filePaths?.[0] || null,
      });
    },
  );

  onIpc<IpcChooseFilePayload>(
    MESSAGE.CHOOSE_FILE,
    MESSAGE.CHOOSE_FILE_RES,
    async (event, payload) => {
      if (!mainWindow) {
        return;
      }

      const { filters, multiple = true } = payload || {};
      const chooseFileDialog: OpenDialogOptions = {
        title: "Select file(s)",
        buttonLabel: "Select",
        properties: multiple ? ["openFile", "multiSelections"] : ["openFile"],
        filters: filters || [{ name: "All Files", extensions: ["*"] }],
      };

      const { canceled, filePaths } = await dialog.showOpenDialog(
        mainWindow,
        chooseFileDialog,
      );

      if (canceled || !filePaths || filePaths.length === 0) {
        event.reply(MESSAGE.CHOOSE_FILE_RES, {
          data: null,
        });
        return;
      }

      // Get file information including size for each selected file
      const fileInfo = filePaths.map((filePath: string) => {
        try {
          const stats = fs.statSync(filePath);
          const fileName = path.basename(filePath);
          const fileExt = path.extname(fileName).slice(1); // Remove the dot

          return {
            path: filePath,
            name: fileName,
            size: stats.size,
            extension: fileExt,
          };
        } catch (error: any) {
          logEveryWhere({
            message: `Error reading file stats for ${filePath}: ${error?.message}`,
          });
          const fileName = path.basename(filePath);
          const fileExt = path.extname(fileName).slice(1);
          return {
            path: filePath,
            name: fileName,
            size: 0,
            extension: fileExt,
          };
        }
      });

      event.reply(MESSAGE.CHOOSE_FILE_RES, {
        data: fileInfo,
      });
    },
  );

  onIpc<IpcReadFileAsDataUrlPayload>(
    MESSAGE.READ_FILE_AS_DATA_URL,
    MESSAGE.READ_FILE_AS_DATA_URL_RES,
    async (event, payload) => {
      const { path: filePath, requestId } = payload || {};
      if (!filePath) {
        event.reply(MESSAGE.READ_FILE_AS_DATA_URL_RES, {
          path: filePath,
          dataUrl: null,
          requestId,
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeByExt: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
      };
      const mime = mimeByExt[ext] || "application/octet-stream";
      const buffer = fs.readFileSync(filePath);
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${mime};base64,${base64}`;
      event.reply(MESSAGE.READ_FILE_AS_DATA_URL_RES, {
        path: filePath,
        dataUrl,
        requestId,
      });
    },
  );

  onIpc<IpcSaveClipboardImagePayload>(
    MESSAGE.SAVE_CLIPBOARD_IMAGE,
    MESSAGE.SAVE_CLIPBOARD_IMAGE_RES,
    async (event, payload) => {
      const { base64, mimeType, requestId } = payload || {};
      if (!base64) {
        event.reply(MESSAGE.SAVE_CLIPBOARD_IMAGE_RES, {
          data: null,
          requestId,
        });
        return;
      }

      const extByMime: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/gif": "gif",
        "image/webp": "webp",
      };
      const extension = extByMime[mimeType] || "png";
      const fileName = `clipboard-${Date.now()}.${extension}`;
      const tempDir = path.join(app.getPath("userData"), TEMP_FOLDER);
      const filePath = path.join(tempDir, fileName);

      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync(filePath, buffer);
      event.reply(MESSAGE.SAVE_CLIPBOARD_IMAGE_RES, {
        data: { path: filePath, name: fileName, extension },
        requestId,
      });
    },
  );

  onIpc<IpcDeleteTempFilePayload>(
    MESSAGE.DELETE_TEMP_FILE,
    MESSAGE.DELETE_TEMP_FILE_RES,
    async (event, payload) => {
      const { path: filePath } = payload || {};
      if (!filePath) {
        event.reply(MESSAGE.DELETE_TEMP_FILE_RES, { success: false });
        return;
      }

      const tempDir = path.join(app.getPath("userData"), TEMP_FOLDER);
      const resolvedPath = path.resolve(filePath);
      const resolvedTempDir = path.resolve(tempDir);
      if (!resolvedPath.startsWith(resolvedTempDir)) {
        event.reply(MESSAGE.DELETE_TEMP_FILE_RES, { success: false });
        return;
      }
      if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath);
      }
      event.reply(MESSAGE.DELETE_TEMP_FILE_RES, { success: true });
    },
  );

  onIpc<IpcOpenFolderPayload>(
    MESSAGE.OPEN_FOLDER,
    MESSAGE.OPEN_FOLDER_RES,
    async (event, payload) => {
      const { folderPath, skillFolderName, isOpenFile } = payload;
      let pathToOpen: string | null = null;

      if (skillFolderName) {
        pathToOpen = getSkillDirPath(skillFolderName);
      } else if (folderPath) {
        pathToOpen = folderPath;
      }
      if (pathToOpen) {
        await shell.openPath(pathToOpen);
        return;
      }

      // Fallback: show dialog with optional defaultPath
      const openFolderDialog: OpenDialogOptions = {
        defaultPath: folderPath || undefined,
        properties: isOpenFile ? ["openFile"] : ["openDirectory"],
      };
      if (!mainWindow) {
        return;
      }
      await dialog.showOpenDialog(mainWindow, openFolderDialog);
    },
  );
};
