import fs from "fs-extra";
import path from "path";
import axios from "axios";
import { app } from "electron";
import { BROWSER_FOLDER, TEMP_FOLDER } from "@/electron/constant";
import { logEveryWhere } from "./util";

const DOWNLOAD_FOLDER = path.join(app.getPath("userData"), BROWSER_FOLDER);
const TEMP_FOLDER_PATH = path.join(app.getPath("userData"), TEMP_FOLDER);

type IPlatformInfo = {
  platformId: string;
  executableRelativePath: string;
};

const getPlatformInfo = (): IPlatformInfo | null => {
  const { platform, arch } = process;

  if (platform === "darwin" && arch === "arm64") {
    return {
      platformId: "mac-arm64",
      executableRelativePath: "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    };
  }

  if (platform === "darwin" && arch === "x64") {
    return {
      platformId: "mac",
      executableRelativePath: "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    };
  }

  if (platform === "win32") {
    return {
      platformId: "win64",
      executableRelativePath: "chrome-win/chrome.exe",
    };
  }

  return null;
};

const getChromiumInfo = () => {
  const browsersJsonPath = path.join(
    path.dirname(require.resolve("playwright-core")),
    "browsers.json",
  );
  const browsersJson = JSON.parse(fs.readFileSync(browsersJsonPath, "utf-8"));
  const chromium = browsersJson.browsers.find(
    (browser: any) => browser.name === "chromium",
  );
  return chromium as { revision: string; browserVersion: string };
};

const getZipExtract = () => {
  const { extract } = require("playwright-core/lib/zipBundle");
  return extract;
};

class BrowserDownloader {
  private getExecutablePath(): string | null {
    const platformInfo = getPlatformInfo();
    if (!platformInfo) {
      return null;
    }
    const { revision } = getChromiumInfo();
    return path.join(
      DOWNLOAD_FOLDER,
      `chromium-${revision}`,
      platformInfo.executableRelativePath,
    );
  }

  private getBrowserDir(): string | null {
    const { revision } = getChromiumInfo();
    return path.join(DOWNLOAD_FOLDER, `chromium-${revision}`);
  }

  private getDownloadURL(): string | null {
    const platformInfo = getPlatformInfo();
    if (!platformInfo) {
      return null;
    }
    const { revision } = getChromiumInfo();
    const { platformId } = platformInfo;
    return `https://cdn.playwright.dev/builds/chromium/${revision}/chromium-${platformId}.zip`;
  }

  isChromiumInstalled(): boolean {
    const executablePath = this.getExecutablePath();
    return !!executablePath && fs.existsSync(executablePath);
  }

  getChromiumExecutablePath(): string | undefined {
    const executablePath = this.getExecutablePath();
    return executablePath && fs.existsSync(executablePath)
      ? executablePath
      : undefined;
  }

  async downloadChromium(
    callback?: (done: number, total: number) => void,
  ): Promise<boolean> {
    try {
      logEveryWhere({ message: "downloadChromium(): start" });
      const downloadURL = this.getDownloadURL();
      const browserDir = this.getBrowserDir();

      if (!downloadURL || !browserDir) {
        logEveryWhere({
          message: "downloadChromium(): unsupported platform",
        });
        return false;
      }

      logEveryWhere({
        message: `downloadChromium(): url=${downloadURL}, dir=${browserDir}`,
      });

      if (this.isChromiumInstalled()) {
        return true;
      }

      const zipPath = path.join(TEMP_FOLDER_PATH, "chromium.zip");
      if (fs.existsSync(zipPath)) {
        await fs.remove(zipPath);
      }

      try {
        await this.downloadFile(downloadURL, zipPath, callback);

        if (fs.existsSync(browserDir)) {
          await fs.remove(browserDir);
        }

        logEveryWhere({ message: "downloadChromium(): extracting..." });
        const extract = getZipExtract();
        await extract(zipPath, { dir: browserDir });

        const executablePath = this.getExecutablePath();
        if (executablePath && fs.existsSync(executablePath)) {
          await fs.chmod(executablePath, 0o755);
        }

        logEveryWhere({ message: "downloadChromium(): done" });
        return true;
      } finally {
        if (fs.existsSync(zipPath)) {
          await fs.remove(zipPath);
        }
      }
    } catch (error: any) {
      logEveryWhere({
        message: `downloadChromium() error: ${error?.message}`,
      });
      return false;
    }
  }

  private async downloadFile(
    url: string,
    destPath: string,
    callback?: (done: number, total: number) => void,
  ): Promise<void> {
    const response = await axios.get(url, {
      responseType: "stream",
      maxRedirects: 5,
    });

    const totalBytes = parseInt(response.headers["content-length"] || "0", 10);
    let downloadedBytes = 0;
    let lastReportedPercent = -1;

    const fileStream = fs.createWriteStream(destPath);
    response.data.pipe(fileStream);

    response.data.on("data", (chunk: Buffer) => {
      downloadedBytes += chunk.length;
      if (callback && totalBytes > 0) {
        const percent = Math.floor((downloadedBytes / totalBytes) * 100);
        if (percent > lastReportedPercent) {
          lastReportedPercent = percent;
          logEveryWhere({
            message: `downloadChromium() progress: ${percent}%`,
          });
          callback(downloadedBytes, totalBytes);
        }
      }
    });

    await new Promise<void>((resolve, reject) => {
      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });
      fileStream.on("error", reject);
      response.data.on("error", reject);
    });
  }
}

export const browserDownloader = new BrowserDownloader();

export const getChromiumBrowserVersion = (): string =>
  getChromiumInfo().browserVersion;
