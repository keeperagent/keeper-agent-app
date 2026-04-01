import { IpcMainEvent, app } from "electron";
import JSZip from "jszip";
import path from "path";
import fs from "fs-extra";
import {
  RESPONSE_CODE,
  FILE_PROTOCOL_NAME,
  FILE_TYPE,
  EXTENSION_FOLDER,
  MESSAGE,
} from "@/electron/constant";
import { IExtension } from "@/electron/type";
import { extensionDB } from "@/electron/database/extension";
import {
  cancelCurrentDownload,
  createBaseProfileExtension,
  generateNewFolderName,
  getExtensionIdBrowser,
  unZipCrxOrDownloadFromStore,
  updateExtenionOnDB,
} from "@/electron/service/extension";
import { sleep } from "@/electron/service/util";
import { onIpc } from "./helpers";
import type {
  IpcGetListExtensionPayload,
  IpcGetListExtensionByNamePayload,
  IpcImportExtensionPayload,
  IpcGetExtensionIdOnBrowserPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";

export const extensionController = () => {
  onIpc<IpcGetListExtensionPayload>(
    MESSAGE.GET_LIST_EXTENSION,
    MESSAGE.GET_LIST_EXTENSION_RES,
    async (event, payload) => {
      const { searchText } = payload;
      const [res] = await extensionDB.getListExtension(searchText);
      event.reply(MESSAGE.GET_LIST_EXTENSION_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcGetListExtensionByNamePayload>(
    MESSAGE.GET_LIST_EXTENSIONB_BY_NAME,
    MESSAGE.GET_LIST_EXTENSIONB_BY_NAME_RES,
    async (event, payload) => {
      const { listExtensionName } = payload;
      const [res, err] =
        await extensionDB.getListExtensionByName(listExtensionName);
      if (err) {
        event.reply(MESSAGE.GET_LIST_EXTENSIONB_BY_NAME_RES, {
          code: RESPONSE_CODE.ERROR,
        });
        return;
      }

      event.reply(MESSAGE.GET_LIST_EXTENSIONB_BY_NAME_RES, {
        data: res,
      });
    },
  );

  onIpc(
    MESSAGE.CANCEL_IMPORT_EXTENSION,
    MESSAGE.CANCEL_IMPORT_EXTENSION,
    async () => {
      cancelCurrentDownload();
    },
  );

  onIpc<IpcImportExtensionPayload>(
    MESSAGE.IMPORT_EXTENSION,
    MESSAGE.IMPORT_EXTENSION_RES,
    async (event: IpcMainEvent, payload) => {
      const { listFile } = payload;

      const listResAwait: Promise<string>[] = [];
      listFile.forEach((file: any) => {
        const res = uploadSingleExtension(file, event);
        listResAwait.push(res);
      });

      // notify to front-end when all file is processed
      const listRes = await Promise.all(listResAwait);

      const isSuccess = !listRes?.includes("");
      event.reply(MESSAGE.IMPORT_EXTENSION_RES, {
        isSuccess,
        isDone: true,
      });
    },
  );

  onIpc<IpcGetExtensionIdOnBrowserPayload>(
    MESSAGE.GET_EXTENSION_ID_ON_BROWSER,
    MESSAGE.GET_EXTENSION_ID_ON_BROWSER_RES,
    async (event, payload) => {
      const { extensionPath, id } = payload;

      await updateExtenionOnDB(extensionPath, id);
      await sleep(300);
      const [res] = await extensionDB.getListExtension();
      event.reply(MESSAGE.GET_EXTENSION_ID_ON_BROWSER_RES, {
        res,
        isGetIdSuccess: true,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_EXTENSION,
    MESSAGE.DELETE_EXTENSION_RES,
    async (event, payload) => {
      const listID = payload?.data;

      // remove folder
      const [listExtension] = await extensionDB.getListExtensionById(listID);
      for (let i = 0; i < listExtension.length; i++) {
        const extPath = listExtension[i]?.storedAtPath;
        if (!extPath) {
          continue;
        }

        const isExist = fs.pathExistsSync(extPath);
        if (isExist) {
          fs.rmSync(extPath, { recursive: true, maxRetries: 3 });
        }
      }

      const [res, err] = await extensionDB.deleteExtension(listID);
      if (err) {
        event.reply(MESSAGE.DELETE_EXTENSION_RES, {
          err: res,
          isSuccess: false,
        });

        return;
      }

      event.reply(MESSAGE.DELETE_EXTENSION_RES, {
        data: listID,
        isSuccess: true,
      });
    },
  );

  const formatFolderName = (extensionName: string) => {
    let formatedName = extensionName.replace(/[^A-Z0-9]/gi, "_");

    while (true) {
      const previousName = formatedName;
      formatedName = formatedName.replace("__", "_"); // replace "__" or "___" to "_"

      if (previousName === formatedName) {
        break;
      }
    }

    return formatedName;
  };

  // extension like Metamask use @key to translate to multiple languages
  const formatFieldName = (name: string): string => {
    if (name?.includes("__MSG_")) {
      let translateKey = name?.replace("__MSG_", "");
      translateKey = translateKey?.replace("__", "");

      return translateKey;
    }
    return name;
  };

  const uploadSingleExtension = async (
    file: any,
    event: IpcMainEvent,
  ): Promise<string> => {
    const { path: filePath, type, link } = file;
    const isImportCrxOrLink = Boolean(type === FILE_TYPE.CRX || link);
    let extension: IExtension = {};

    if (
      type !== FILE_TYPE.ZIP &&
      type !== FILE_TYPE.CRX &&
      !isImportCrxOrLink
    ) {
      event.reply(MESSAGE.IMPORT_EXTENSION_RES, {
        code: RESPONSE_CODE.INVALID_FILE_TYPE,
        isSuccess: false,
        isDone: false,
        data: file,
      });
      return "";
    }

    let zipFilePath = filePath;
    if (isImportCrxOrLink) {
      const [newZipFile, err] = await unZipCrxOrDownloadFromStore(
        link || filePath,
        event,
      );
      if (err) {
        if (link) {
          event.reply(MESSAGE.IMPORT_EXTENSION_RES, {
            code: RESPONSE_CODE.ERROR,
            isSuccess: false,
            isDone: true,
            error: err?.message,
          });
        } else {
          event.reply(MESSAGE.IMPORT_EXTENSION_RES, {
            code: RESPONSE_CODE.READ_FILE_ERROR,
            isSuccess: false,
            isDone: false,
            data: file,
          });
        }

        return "";
      }

      if (newZipFile) {
        zipFilePath = newZipFile;
      }
    }

    const translateKey = {
      name: "",
      description: "",
    };
    const translatedContent = {
      name: "",
      description: "",
    };
    let defaultLocale = "";
    let extensionInfo: any = {};
    let isValidExtension = false;

    const zipBuffer = await fs.readFile(zipFilePath);
    const zip = await new JSZip().loadAsync(zipBuffer);

    // get extension detail in manifest.json
    const manifestEntry = zip.file("manifest.json");
    if (manifestEntry) {
      const extensionInfoStr = await manifestEntry.async("string");
      extensionInfo = JSON.parse(extensionInfoStr);

      const name = formatFieldName(extensionInfo?.name);
      const description = formatFieldName(extensionInfo?.description);
      defaultLocale = extensionInfo?.default_locale;
      if (name !== extensionInfo?.name) {
        translateKey.name = name;
      }
      if (description !== extensionInfo?.description) {
        translateKey.description = description;
      }

      extension = {
        name,
        description,
        version: extensionInfo?.version,
      };

      isValidExtension = true;
    }

    if (!isValidExtension) {
      event.reply(MESSAGE.IMPORT_EXTENSION_RES, {
        code: RESPONSE_CODE.NOT_EXTENSION,
        isSuccess: false,
        isDone: false,
        data: file,
      });
      return "";
    }

    // some extension like Metamask support multiple languages
    if (translateKey?.name !== "" || translateKey?.description !== "") {
      const localeEntry = zip.file(`_locales/${defaultLocale}/messages.json`);
      if (localeEntry) {
        {
          const contentStr = await localeEntry.async("string");
          const content = JSON.parse(contentStr);

          if (translateKey?.name !== "") {
            translatedContent.name = content?.[translateKey.name]?.message;
          }

          if (translateKey?.description !== "") {
            translatedContent.description =
              content?.[translateKey.description]?.message;
          }
        }
      }
    }

    if (translatedContent.name !== "") {
      extension.name = translatedContent.name;
    }
    if (translatedContent.description !== "") {
      extension.description = translatedContent.description;
    }

    const currentFolderName = formatFolderName(extension?.name!);

    let destinationPath = path.join(
      app.getPath("userData"),
      EXTENSION_FOLDER,
      currentFolderName,
    );

    let defaultIcon = extensionInfo?.action?.default_icon;

    defaultIcon =
      typeof defaultIcon !== "string"
        ? defaultIcon?.["128"] ||
          defaultIcon?.["48"] ||
          defaultIcon?.["32"] ||
          defaultIcon?.["24"] ||
          defaultIcon?.["16"]
        : defaultIcon;

    extension.storedAtPath = destinationPath;
    const iconPath = defaultIcon
      ? path.join(destinationPath, defaultIcon)
      : path.join(
          destinationPath,
          extensionInfo?.icons?.["128"] ||
            extensionInfo?.icons?.["48"] ||
            extensionInfo?.icons?.["32"] ||
            extensionInfo?.icons?.["16"],
        );
    // Normalize path for URL - on Windows, convert backslashes to forward slashes for URL
    const normalizedIconPath =
      process.platform === "win32" ? iconPath.replace(/\\/g, "/") : iconPath;
    extension.iconPath = `${FILE_PROTOCOL_NAME}://${normalizedIconPath}`;

    const [listExtension] = await extensionDB.getListExtension();

    let listStoredPath: string[] = [];
    if (listExtension?.data) {
      listStoredPath = listExtension?.data?.map((extension: IExtension) => {
        const storedAtPath = extension?.storedAtPath;
        const folderNameSplit = storedAtPath?.split("/");
        const storedFolderName = folderNameSplit?.[folderNameSplit?.length - 1];

        return storedFolderName!;
      });
    }
    listStoredPath = listStoredPath?.filter(
      (extensionPath: string) => extensionPath,
    );

    // if folder name exist already, generate new folder name
    if (listStoredPath?.includes(currentFolderName)) {
      const newFolderName = generateNewFolderName(
        listStoredPath,
        currentFolderName,
      );
      extension.storedAtPath = destinationPath.replace(
        currentFolderName,
        newFolderName,
      );
      // Reconstruct iconPath with the new folder name
      const newIconPath = iconPath.replace(currentFolderName, newFolderName);
      // Normalize path for URL - on Windows, convert backslashes to forward slashes
      const normalizedIconPathForReplace =
        process.platform === "win32"
          ? newIconPath.replace(/\\/g, "/")
          : newIconPath;
      extension.iconPath = `${FILE_PROTOCOL_NAME}://${normalizedIconPathForReplace}`;

      destinationPath = destinationPath.replace(
        currentFolderName,
        newFolderName,
      );
    }

    await fs.ensureDir(destinationPath);
    for (const [name, entry] of Object.entries(zip.files)) {
      if (!entry.dir) {
        const content = await entry.async("nodebuffer");
        const destPath = path.join(destinationPath, name);
        await fs.ensureDir(path.dirname(destPath));
        await fs.writeFile(destPath, content);
      }
    }
    event.reply(MESSAGE.IMPORT_EXTENSION_RES, {
      code: RESPONSE_CODE.NORMAL_MESSAGE,
      isSuccess: false,
      isDone: false,
    });
    const [extensionID, errExtensionID] =
      await getExtensionIdBrowser(destinationPath);
    extension.extensionId = extensionID || "";

    // remove from temp folder
    link && fs.unlinkSync(zipFilePath);

    const [_res, err] = await extensionDB.createExtension(extension);
    if (err || errExtensionID) {
      event.reply(MESSAGE.IMPORT_EXTENSION_RES, {
        code: RESPONSE_CODE.DATABASE_ERROR,
        data: file,
        isSuccess: false,
        isDone: false,
      });

      return "";
    }

    event.reply(MESSAGE.IMPORT_EXTENSION_RES, {
      data: file,
      isSuccess: true,
      isDone: false,
    });
    return destinationPath;
  };
};

onIpc(
  MESSAGE.CREATE_BASE_PROFILE_EXTENSION,
  MESSAGE.CREATE_BASE_PROFILE_EXTENSION_RES,
  async (event, _payload) => {
    const [allExtension, err] = await extensionDB.getListExtension();

    let listExtensionPath = "";
    if (allExtension?.data && !err) {
      listExtensionPath = allExtension?.data
        ?.map((extension: IExtension) => extension?.storedAtPath || "")
        ?.filter((extPath?: string) => Boolean(extPath))
        .join(",");
    }

    await createBaseProfileExtension(listExtensionPath);

    event.reply(MESSAGE.CREATE_BASE_PROFILE_EXTENSION_RES, {
      isCreateBaseSuccess: true,
    });
  },
);
