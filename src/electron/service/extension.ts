import axios from "axios";
import path from "path";
import fs from "fs-extra";
import JSZip from "jszip";
import puppeteer, { Page } from "puppeteer-core";
import { IpcMainEvent, app } from "electron";
import { FILE_TYPE, TEMP_FOLDER, RESPONSE_CODE, MESSAGE } from "@/electron/constant";
import { extensionDB } from "@/electron/database/extension";
import { preferenceDB } from "@/electron/database/preference";
import { browserDownloader } from "./browserDownloader";
import { logEveryWhere, removeLastTrailingSlash, sleep } from "./util";
import { getBaseProfilePath } from "@/electron/simulator/util";

const tempFolder = removeLastTrailingSlash(
  path.join(app.getPath("userData"), TEMP_FOLDER),
);

const getCrxBuffer = async (
  crxUrl: string,
  isStoreLink: boolean,
  event: IpcMainEvent,
): Promise<[ArrayBuffer | null, Error | null]> => {
  try {
    // input link extension on store
    if (isStoreLink) {
      const response = await axios.get(crxUrl, {
        responseType: "stream",
        timeout: 60000,
      });
      const totalSize =
        response.headers["Content-Length"] ||
        response.headers["content-length"];
      let downloadedSize = 0;
      let crxBuffer = new Uint8Array(0);

      response.data.on("data", (chunk: Buffer) => {
        const chunkArray = new Uint8Array(chunk);
        const newBuffer = new Uint8Array(crxBuffer.length + chunkArray.length);
        newBuffer.set(crxBuffer);
        newBuffer.set(chunkArray, crxBuffer.length);
        crxBuffer = newBuffer;

        downloadedSize += chunkArray.length;
        const percentage = ((downloadedSize / totalSize) * 100).toFixed(0);

        event.reply(MESSAGE.IMPORT_EXTENSION_RES, {
          code: RESPONSE_CODE.NORMAL_MESSAGE,
          isSuccess: false,
          isDone: false,
          percentage,
        });
      });

      await new Promise((resolve) => {
        response.data.on("end", () => {
          resolve(true);
        });
      });

      return [crxBuffer.buffer, null];
    }

    const crxBuffer = toArrayBuffer(fs.readFileSync(crxUrl));
    return [crxBuffer, null];
  } catch (err: any) {
    logEveryWhere({ message: `getCrxBuffer() error: ${err?.message}` });
    return [null, err];
  }
};

const toArrayBuffer = (buffer: any) => {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);

  for (let i = 0; i < buffer.length; i++) {
    view[i] = buffer[i];
  }

  return arrayBuffer;
};


const saveCrxtoZIP = async (
  crxUrl: string,
  isStoreLink: boolean,
  zipFilePath: string,
  event: IpcMainEvent,
): Promise<Error | null> => {
  try {
    const [crxBuffer] = await getCrxBuffer(crxUrl, isStoreLink, event);
    if (crxBuffer === null || crxBuffer.byteLength === 0) {
      return Error(
        "Can not download extension from link. Please import from file",
      );
    }

    const zip = new JSZip();
    await zip.loadAsync(Buffer.from(crxBuffer)).then(async (zipData) => {
      const content = await zipData.generateAsync({ type: "nodebuffer" });
      await fs.writeFile(zipFilePath, content);
    });

    return null;
  } catch (err: any) {
    console.error("Error downloading CRX file:", err);
    return err;
  }
};

const getExtensionId = (storeLink: string): [string | null, Error | null] => {
  const regex = /\/([a-z]{32})/i;
  const matches = regex.exec(storeLink);
  if (matches && matches?.length > 1) {
    return [matches[1], null];
  }

  return [null, Error("extension id not found")];
};

const unZipCrxOrDownloadFromStore = async (
  storeLinkOrFilePath: string,
  event: IpcMainEvent,
): Promise<[string | null, Error | null]> => {
  const isStoreLink = storeLinkOrFilePath.includes(
    "https://chromewebstore.google.com/",
  );
  if (!isStoreLink && !storeLinkOrFilePath?.includes(FILE_TYPE.CRX)) {
    return [null, Error("file is not .crx")];
  }

  let fileName = "crxFile";
  let crxFilePath = storeLinkOrFilePath;
  if (isStoreLink) {
    const [extensionID, err] = getExtensionId(storeLinkOrFilePath);
    if (extensionID === null) {
      return [null, err];
    }

    fileName = extensionID;
    crxFilePath = `https://clients2.google.com/service/update2/crx?response=redirect&os=linux&arch=x64&os_arch=x86_64&nacl_arch=x86-64&prod=chromium&prodchannel=unknown&prodversion=91.0.4442.4&lang=en-US&acceptformat=crx2,crx3&x=id%3D${extensionID}%26installsource%3Dondemand%26uc`;
  }

  const zipFilePath = isStoreLink
    ? path.join(tempFolder, `${fileName}.zip`)
    : storeLinkOrFilePath;

  const error = await saveCrxtoZIP(
    crxFilePath,
    isStoreLink,
    zipFilePath,
    event,
  );
  return [zipFilePath, error];
};

const turnOnDevMode = async (page: Page) => {
  try {
    await page?.evaluate(() => {
      const button = document
        ?.querySelector("extensions-manager")
        ?.shadowRoot?.querySelector("extensions-toolbar")
        ?.shadowRoot?.querySelector("cr-toolbar")
        ?.querySelector("cr-toggle#devMode")
        ?.shadowRoot?.querySelector("#bar");
      // @ts-ignore
      button?.click();
    });
  } catch (err: any) {
    logEveryWhere({ message: `turnOnDevMode() error: ${err?.message}` });
  }
};

const reloadExtension = async (page: Page) => {
  try {
    await page?.evaluate(() => {
      const button = document
        ?.querySelector("extensions-manager")
        ?.shadowRoot?.querySelector("extensions-toolbar")
        ?.shadowRoot?.querySelector("#devDrawer")
        ?.querySelector("#updateNow");
      // @ts-ignore
      button?.click();
    });
  } catch (err: any) {
    logEveryWhere({ message: `reloadExtension() error: ${err?.message}` });
  }
};

const getExtensionIdBrowser = async (
  extensionPath: string,
): Promise<[string | null, Error | null]> => {
  const [preference, err] = await preferenceDB.getOnePreference();
  if (err || !preference || !preference?.browserRevision) {
    return [null, Error("preference not found")];
  }

  const executablePath = browserDownloader.revisionInfo(
    preference?.browserRevision,
  )?.executablePath;

  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: null,
    args: [
      `--load-extension=${extensionPath}`,
      `--disable-extensions-except=${extensionPath}`,
      "--disable-extensions",
    ],
  });

  const page = await browser.newPage();
  await page?.goto("chrome://extensions/");

  const getExtensionId = async () => {
    const extensionId = await page.$eval(
      "extensions-manager",

      (extensionsManager) => {
        const extensionsList = extensionsManager?.shadowRoot?.querySelector(
          "extensions-item-list",
        );
        const extensionItem =
          extensionsList?.shadowRoot?.querySelectorAll("extensions-item");

        let id = "";
        extensionItem?.forEach((item: any) => {
          id = item?.id || "";
        });

        return id;
      },
    );

    return extensionId;
  };

  await turnOnDevMode(page);
  const extensionId = await getExtensionId();
  await sleep(1500);
  await browser?.close();
  return [extensionId, null];
};

const updateExtenionOnDB = async (
  extensionPath: string,
  id?: number,
): Promise<Error | null> => {
  const [extensionId, err] = await getExtensionIdBrowser(extensionPath);
  if (err || !extensionId) {
    return err;
  }

  await extensionDB.updateExtension({
    id,
    extensionId,
  });

  return null;
};

const generateNewFolderName = (
  oldFolderNames: string[],
  newFolderName: string,
): string => {
  let increment = 1;
  let newName = newFolderName;

  while (oldFolderNames.includes(newName)) {
    newName = `${newFolderName} (${increment})`;
    increment++;
  }

  return newName;
};

const createBaseProfileExtension = async (listExtensionPath: string) => {
  const [preference, err] = await preferenceDB.getOnePreference();
  if (err || !preference || !preference?.browserRevision) {
    return [null, Error("preference not found")];
  }

  const executablePath = browserDownloader.revisionInfo(
    preference?.browserRevision,
  )?.executablePath;

  const args = [
    "--disable-prompt-on-repost",
    "--no-default-browser-check",
    "--disable-notifications",
    "--disable-client-side-phishing-detection",
    "--disable-speech-api",
    "--no-first-run",
    `--load-extension=${listExtensionPath}`,
    `--disable-extensions-except=${listExtensionPath}`,
  ];
  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: null,
    ignoreDefaultArgs: [
      "--enable-automation",
      "--enable-blink-features=IdleDetection",
      "--enable-blink-features=AutomationControlled",
      "--disable-extensions",
    ],
    args,
    userDataDir: getBaseProfilePath(),
  });

  const page = await browser.newPage();
  await page?.goto("chrome://extensions/");

  await turnOnDevMode(page);
  await sleep(1500);

  await reloadExtension(page);
  await sleep(1500);

  await browser?.close();
};

export {
  unZipCrxOrDownloadFromStore,
  getExtensionIdBrowser,
  updateExtenionOnDB,
  generateNewFolderName,
  createBaseProfileExtension,
};
