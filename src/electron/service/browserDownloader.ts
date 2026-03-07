import fs from "fs-extra";
import path from "path";
import {
  Browser,
  BrowserPlatform,
  install,
  canDownload,
  InstallOptions,
  detectBrowserPlatform,
  getInstalledBrowsers,
  computeExecutablePath,
} from "@puppeteer/browsers";
import { app } from "electron";
import { BROWSER_FOLDER } from "@/electron/constant";
import { logEveryWhere } from "./util";

// Reference:
// https://github.com/puppeteer/puppeteer/blob/11d94525c821ab1bb6e059f3b998a8660f597348/utils/ChromiumDownloader.js
// https://github.com/puppeteer/puppeteer/blob/11d94525c821ab1bb6e059f3b998a8660f597348/install.js

// List Chrome revision:
// https://chromiumdash.appspot.com/releases?platform=Mac
// https://download-chromium.appspot.com/
// https://chromiumdash.appspot.com/fetch_releases?platform=Mac&channel=Stable&num=1
// https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json
// https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json
// https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Mac

const DOWNLOAD_FOLDER = path.join(
  path.join(app.getPath("userData")),
  BROWSER_FOLDER,
);

type IRevision = {
  platform: string;
  revision: string;
};

class BrowserDownloader {
  private platform: BrowserPlatform | undefined;

  constructor() {
    this.platform = detectBrowserPlatform();
  }

  async installedBrowser() {
    const listBrowser = await getInstalledBrowsers({
      cacheDir: DOWNLOAD_FOLDER,
    });
    return listBrowser;
  }

  async downloadRevision(revision: string, callback?: any): Promise<boolean> {
    const platform = detectBrowserPlatform();
    if (!platform) {
      return true;
    }
    const folderPath = getFolderPath(platform, revision);

    // Determine if this is a Chrome version (from Chrome for Testing) or Chromium revision
    // Chrome versions are like "131.0.6778.85", Chromium revisions are numeric like "1311234"
    const isChromeVersion = revision.includes(".");
    const browser = isChromeVersion ? Browser.CHROME : Browser.CHROMIUM;

    const options: InstallOptions = {
      platform,
      browser,
      buildId: revision,
      cacheDir: folderPath, // if @revision is already installed, it will skip instalation step
      downloadProgressCallback: (
        downloadedBytes: number,
        totalBytes: number,
      ) => {
        logEveryWhere({
          message: `downloadBrowser() progress: ${Number((downloadedBytes / totalBytes) * 100).toFixed(1)}%`,
        });
        if (callback) {
          callback(downloadedBytes, totalBytes);
        }
      },
    };

    const isAvailable = await canDownload(options);
    if (isAvailable) {
      await install({ ...options, unpack: true });
      return true;
    }

    return false;
  }

  downloadedRevisions(): IRevision[] {
    if (!fs.existsSync(DOWNLOAD_FOLDER)) {
      return [];
    }

    const fileNames = fs.readdirSync(DOWNLOAD_FOLDER);
    const listRevision: any[] = fileNames
      .map((fileName) => parseFolderPath(fileName))
      .filter((revision: IRevision | null) => revision !== null);
    return listRevision;
  }

  removeRevision(revision: string) {
    if (!this.platform) {
      return;
    }

    const folderPath = getFolderPath(this.platform, revision);
    const isExist = fs.pathExistsSync(folderPath);
    if (isExist) {
      fs.rmSync(folderPath, { recursive: true, maxRetries: 3 });
    }
  }

  revisionInfo(revision: string) {
    if (!this.platform) {
      return;
    }

    const folderPath = getFolderPath(this.platform, revision);
    // Determine browser type based on revision format
    const isChromeVersion = revision.includes(".");
    const browser = isChromeVersion ? Browser.CHROME : Browser.CHROMIUM;

    const executablePath = computeExecutablePath({
      cacheDir: folderPath,
      browser,
      platform: this.platform,
      buildId: revision,
    });

    return {
      executablePath,
      folderPath,
      downloaded: fs.existsSync(folderPath),
    };
  }
}

function getFolderPath(platform: string, revision: string) {
  return path.join(DOWNLOAD_FOLDER, platform + "-" + revision);
}

function parseFolderPath(folderPath: string): IRevision | null {
  const name = path.basename(folderPath);
  const splits = name.split("-");

  if (splits.length !== 2) {
    return null;
  }
  const [platform, revision] = splits;
  return { platform, revision };
}

export const browserDownloader = new BrowserDownloader();
