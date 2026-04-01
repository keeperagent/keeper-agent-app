import path from "path";
import fs from "fs-extra";
import axios from "axios";
import JSZip from "jszip";
import type { BrowserContext, Page } from "playwright-core";
import { IpcMainEvent, app } from "electron";
import {
  FILE_TYPE,
  TEMP_FOLDER,
  RESPONSE_CODE,
  MESSAGE,
} from "@/electron/constant";
import { extensionDB } from "@/electron/database/extension";
import { preferenceDB } from "@/electron/database/preference";
import { chromium } from "@/electron/service/stealthBrowser";
import { getBaseProfilePath, getProfilePath } from "@/electron/simulator/util";
import {
  browserDownloader,
  getChromiumBrowserVersion,
} from "./browserDownloader";
import { logEveryWhere, removeLastTrailingSlash, sleep } from "./util";

const tempFolder = removeLastTrailingSlash(
  path.join(app.getPath("userData"), TEMP_FOLDER),
);

let currentDownloadAbortController: AbortController | null = null;

const cancelCurrentDownload = () => {
  currentDownloadAbortController?.abort();
  currentDownloadAbortController = null;
};

const getCrxPlatformParams = (): string => {
  const { platform, arch } = process;
  if (platform === "darwin") {
    const cpuArch = arch === "arm64" ? "arm64" : "x64";
    const osArch = arch === "arm64" ? "arm64" : "x86_64";
    const naclArch = arch === "arm64" ? "arm" : "x86-64";
    return `os=mac&arch=${cpuArch}&os_arch=${osArch}&nacl_arch=${naclArch}`;
  }
  if (platform === "win32") {
    return `os=win&arch=x64&os_arch=x86_64&nacl_arch=x86-64`;
  }
  return `os=linux&arch=x64&os_arch=x86_64&nacl_arch=x86-64`;
};

const downloadCrxStream = async (
  crxUrl: string,
  event: IpcMainEvent,
): Promise<ArrayBuffer> => {
  currentDownloadAbortController = new AbortController();
  const browserVersion = getChromiumBrowserVersion();
  const response = await axios.get(crxUrl, {
    responseType: "stream",
    timeout: 60000,
    signal: currentDownloadAbortController.signal,
    headers: { "User-Agent": `Mozilla/5.0 Chrome/${browserVersion}` },
  });
  const totalSize =
    response.headers["Content-Length"] || response.headers["content-length"];
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
    response.data.on("end", () => resolve(true));
  });

  return crxBuffer.buffer;
};

const getCrxBuffer = async (
  crxUrl: string,
  isStoreLink: boolean,
  event: IpcMainEvent,
): Promise<[ArrayBuffer | null, Error | null]> => {
  if (!isStoreLink) {
    try {
      return [toArrayBuffer(fs.readFileSync(crxUrl)), null];
    } catch (err: any) {
      logEveryWhere({ message: `getCrxBuffer() error: ${err?.message}` });
      return [null, err];
    }
  }

  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const buffer = await downloadCrxStream(crxUrl, event);
      return [buffer, null];
    } catch (err: any) {
      lastError = err;
      logEveryWhere({
        message: `getCrxBuffer() attempt ${attempt}/${MAX_RETRIES} failed: ${err?.message}`,
      });
      if (attempt < MAX_RETRIES) {
        await sleep(2000 * attempt);
      }
    }
  }

  return [null, lastError];
};

const toArrayBuffer = (buffer: Buffer): ArrayBuffer => {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; i++) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
};

const saveCrxToZip = async (
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
    logEveryWhere({ message: `saveCrxToZip() error: ${err?.message}` });
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
    const platformParams = getCrxPlatformParams();
    const browserVersion = getChromiumBrowserVersion();
    crxFilePath = `https://clients2.google.com/service/update2/crx?response=redirect&${platformParams}&prodversion=${browserVersion}&acceptformat=crx3&x=id%3D${extensionID}%26installsource%3Dondemand%26uc`;
  }

  fs.ensureDirSync(tempFolder);
  const zipFilePath = path.join(tempFolder, `${fileName}.zip`);
  const err = await saveCrxToZip(crxFilePath, isStoreLink, zipFilePath, event);
  return [zipFilePath, err];
};

const turnOnDevMode = async (page: Page): Promise<void> => {
  await page
    .evaluate(() => {
      const toggle = document
        ?.querySelector("extensions-manager")
        ?.shadowRoot?.querySelector("extensions-toolbar")
        ?.shadowRoot?.querySelector("cr-toggle#devMode");
      // @ts-ignore
      if (toggle && !toggle?.checked) {
        // @ts-ignore
        toggle.click();
      }
    })
    .catch(() => {});
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

// get extension id after install and save to database
const getExtensionIdBrowser = async (
  extensionPath: string,
): Promise<[string | null, Error | null]> => {
  const [preference] = await preferenceDB.getOnePreference();
  const executablePath =
    preference?.customChromePath ||
    browserDownloader.getChromiumExecutablePath();

  if (!executablePath) {
    return [null, Error("No browser executable found")];
  }

  const tmpDir = getProfilePath("temp_extension_profile");
  if (fs.existsSync(tmpDir)) {
    fs.removeSync(tmpDir);
  }

  const browser = await chromium.launchPersistentContext(tmpDir, {
    executablePath,
    headless: false,
    viewport: null,
    ignoreDefaultArgs: ["--enable-automation", "--disable-extensions"],
    args: [`--load-extension=${extensionPath}`, "--no-first-run"],
  });

  const page = await browser.newPage();
  await page.goto("chrome://extensions/");

  // Enable developer mode so extension IDs are visible
  await turnOnDevMode(page);

  await sleep(1000);
  const extensionId = await page.$eval("extensions-manager", (manager) => {
    const list = manager?.shadowRoot?.querySelector("extensions-item-list");
    const items = list?.shadowRoot?.querySelectorAll("extensions-item");
    let foundId = "";
    items?.forEach((item: any) => {
      foundId = item?.id || "";
    });
    return foundId;
  });

  await sleep(500);
  await browser.close();
  return [extensionId || null, null];
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

// Update the extension DB record with the browser-assigned extension ID
const updateExtenionOnDB = async (
  extensionPath: string,
  id?: number,
): Promise<Error | null> => {
  const [extensionId, err] = await getExtensionIdBrowser(extensionPath);
  if (err || !extensionId) {
    return err;
  }

  await extensionDB.updateExtension({ id, extensionId });
  return null;
};

// Resolves when no new page has been opened (or finished loading) for idleMs.
// Caps at maxMs so we never hang forever no matter how many extensions are installed.
const waitForExtensionsToSettle = (
  browser: BrowserContext,
  idleMs = 10000,
  maxMs = 60000,
): Promise<void> => {
  return new Promise((resolve) => {
    let resolved = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let maxTimer: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
      if (resolved) {
        return;
      }
      resolved = true;
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      if (maxTimer) {
        clearTimeout(maxTimer);
      }
      browser.off("page", onNewPage);
      resolve();
    };

    const resetIdleTimer = () => {
      if (resolved) {
        return;
      }
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      idleTimer = setTimeout(finish, idleMs);
    };

    const onNewPage = (newPage: Page) => {
      resetIdleTimer();
      newPage.on("load", resetIdleTimer);
    };

    browser.on("page", onNewPage);
    maxTimer = setTimeout(finish, maxMs);
    resetIdleTimer();
  });
};

// create base profile contains all extensions
const createBaseProfileExtension = async (
  listExtensionPath: string,
): Promise<void> => {
  const [preference] = await preferenceDB.getOnePreference();
  const executablePath =
    preference?.customChromePath ||
    browserDownloader.getChromiumExecutablePath();

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

  const browser = await chromium.launchPersistentContext(getBaseProfilePath(), {
    executablePath,
    headless: false,
    viewport: null,
    ignoreDefaultArgs: ["--enable-automation", "--disable-extensions"],
    args,
  });

  const page = await browser.newPage();
  await page.goto("chrome://extensions/");

  await turnOnDevMode(page);
  await sleep(1500);

  await reloadExtension(page);

  // Wait until all extensions have finished opening their welcome pages and
  // writing their "already set up" storage flags. We detect completion by
  // watching for new pages: the idle timer resets each time a page is created
  // or finishes loading, and resolves after 5s of silence (max 60s).
  await waitForExtensionsToSettle(browser);
  await browser.close();
};

export {
  unZipCrxOrDownloadFromStore,
  getExtensionIdBrowser,
  generateNewFolderName,
  updateExtenionOnDB,
  createBaseProfileExtension,
  cancelCurrentDownload,
};
