import { BrowserContext } from "playwright-core";
import fs from "fs-extra";
import _ from "lodash";
import { preferenceDB } from "@/electron/database/preference";
import { logEveryWhere } from "@/electron/service/util";
import { IProfileProxy } from "@/electron/type";
import { browserDownloader } from "@/electron/service/browserDownloader";
import {
  LIST_NETWORK_PROTOCOL,
  UNABLE_TO_GET_PROXY,
} from "@/electron/constant";
import {
  ISimulator,
  calculateWindowPositions,
  getBaseProfilePath,
  getDeviceSize,
  getProfilePath,
  sleep,
} from "@/electron/simulator/util";
import { TEMP_PROFILENAME } from "@/electron/simulator/constant";
import { StopSignal } from "@/electron/simulator/stopSignal";
import { chromium } from "@/electron/service/stealthBrowser";
import { IExtension } from "@/electron/type";
import { extensionDB } from "@/electron/database/extension";
import { createBaseProfileExtension } from "@/electron/service/extension";

let baseProfileInitPromise: Promise<void> | null = null;
export const ensureBaseProfile = async (): Promise<void> => {
  const baseProfilePath = getBaseProfilePath();
  const isExist = fs.pathExistsSync(baseProfilePath);
  const isEmpty = !isExist || fs.readdirSync(baseProfilePath).length === 0;
  if (!isEmpty) {
    return;
  }

  if (!baseProfileInitPromise) {
    baseProfileInitPromise = (async () => {
      const [allExtension] = await extensionDB.getListExtension();
      const listExtensionPath =
        allExtension?.data
          ?.map((extension: IExtension) => extension?.storedAtPath || "")
          ?.filter((extPath: string) => Boolean(extPath))
          .join(",") || "";
      await createBaseProfileExtension(listExtensionPath);
    })().finally(() => {
      baseProfileInitPromise = null;
    });
  }

  await baseProfileInitPromise;
};

export class BaseBrowser {
  private windowPosition: {
    [threadID: string]: { x: number; y: number };
  };
  private lastWindowPositionKey: string; // to trigger recaculate window position
  private stopSignal: StopSignal;

  constructor(stopSignal: StopSignal) {
    this.windowPosition = {};
    this.lastWindowPositionKey = "";
    this.stopSignal = stopSignal;
  }

  async createBrowser({
    profileName,
    profileKey,
    threadID,
    profileProxy,
    userAgent,
    windowWidth,
    windowHeight,
    isFullScreen,
    totalScreen,
    defaultOpenUrl,
  }: {
    profileName: string;
    profileKey: string;
    threadID: string;
    profileProxy: IProfileProxy;
    userAgent?: string;
    windowWidth?: number;
    windowHeight?: number;
    isFullScreen?: boolean;
    totalScreen?: number;
    defaultOpenUrl?: string;
  }): Promise<[ISimulator | null, Error | null]> {
    let simulator: ISimulator | null = null;
    try {
      const args = [
        "--disable-prompt-on-repost",
        "--no-default-browser-check",
        "--disable-notifications",
        "--disable-client-side-phishing-detection",
        "--disable-speech-api",
        "--no-first-run",
        "--lang=en-US",
        "-disable-features=site-per-process",
      ];

      if (!isFullScreen && windowWidth && windowHeight) {
        const { width, height } = getDeviceSize();
        const windowPositionKey = this.getWindowPositionKey(
          width,
          height,
          windowWidth,
          windowHeight,
          totalScreen || 1,
        );
        if (windowPositionKey !== this.lastWindowPositionKey) {
          this.windowPosition = calculateWindowPositions(
            width,
            height,
            windowWidth,
            windowHeight,
            totalScreen || 1,
          );
          this.lastWindowPositionKey = windowPositionKey;
        }

        args.push(`--window-size=${windowWidth},${windowHeight}`);
        const position = this.windowPosition[threadID];
        args.push(`--window-position=${position?.x},${position?.y}`);
      } else {
        args.push(`--start-maximized`);
      }

      const { isUseProxy, proxy } = profileProxy;
      if (isUseProxy) {
        const protocol =
          _.find(LIST_NETWORK_PROTOCOL, {
            value: proxy?.protocol,
          })?.prefix || "";
        const ip = proxy?.ip;
        const port = proxy?.port;

        if (!ip || !port) {
          return [null, Error(UNABLE_TO_GET_PROXY)];
        }

        args.push(`--proxy-server=${protocol}${ip}:${port}`);
        logEveryWhere({ message: `Creating browser with proxy ${ip}:${port}` });

        // skip if user Stop workflow or Close browser
        if (this.stopSignal.shouldStop(profileKey)) {
          this.stopSignal.removeStopSignal(profileKey);
          return [null, Error(`Browser closed`)];
        }
      }

      const [preference, err] = await preferenceDB.getOnePreference();
      if (err || !preference) {
        return [null, err];
      }

      const chromiumExecutablePath =
        preference?.customChromePath ||
        browserDownloader.getChromiumExecutablePath();

      if (!chromiumExecutablePath) {
        return [
          null,
          Error(
            "No browser found. Please download Chromium from the Browser tab first.",
          ),
        ];
      }

      const profileFolderPath = getProfilePath(profileName);
      const [err1, isCreateNewFolder] =
        await this.createProfileFolder(profileFolderPath);
      if (err1) {
        return [null, err1];
      }

      const contextOptions: Parameters<
        typeof chromium.launchPersistentContext
      >[1] = {
        executablePath: chromiumExecutablePath,
        headless: false,
        ignoreDefaultArgs: ["--enable-automation", "--disable-extensions"],
        args,
        timeout: 30000,
        viewport: null,
      };

      if (userAgent) {
        contextOptions.userAgent = userAgent;
      }

      if (isUseProxy && proxy?.username && proxy?.password) {
        const protocol =
          _.find(LIST_NETWORK_PROTOCOL, {
            value: proxy?.protocol,
          })?.prefix || "";
        contextOptions.proxy = {
          server: `${protocol}${proxy.ip}:${proxy.port}`,
          username: proxy.username,
          password: proxy.password,
        };
      }

      const browser: BrowserContext = await chromium.launchPersistentContext(
        profileFolderPath,
        contextOptions,
      );

      // close browser again if browser not closed completely
      if (this.stopSignal.shouldStop(profileKey)) {
        await browser?.close();
        this.stopSignal.removeStopSignal(profileKey);
        return [null, Error(`Browser already closed`)];
      }

      const newPage = await browser.newPage();
      const pages = browser.pages();
      for (let i = 0; i < pages.length; i++) {
        const pageUrl = pages[i]?.url();
        if (pageUrl == "about:blank" && pages[i] !== newPage) {
          await pages[i]?.close();
        }
      }
      await sleep(300);

      if (!isFullScreen && windowWidth && windowHeight) {
        await newPage?.setViewportSize({
          width: windowWidth,
          height: windowHeight,
        });
      }

      if (defaultOpenUrl) {
        await newPage?.goto(defaultOpenUrl);
      }

      let browserProcessId: number | null = null;
      try {
        // @ts-ignore
        browserProcessId =
          (browser as any)._connection?.toImpl?.(browser)?._browser?.options
            ?.browserProcess?.process?.pid || null;
      } catch {
        browserProcessId = null;
      }

      simulator = {
        browser: browser,
        listPage: [newPage],
        browserProcessId,
        currentPageIndex: 0, // assign first tab is current page
        isCreateNewFolder,
      };
    } catch (err: any) {
      logEveryWhere({ message: `createBrowser() error: ${err?.message}` });
      return [null, err];
    }

    if (this.stopSignal.shouldStop(profileKey)) {
      this.stopSignal.removeStopSignal(profileKey);
    }
    return [simulator, null];
  }

  getWindowPositionKey(
    screenWidth: number,
    screenHeight: number,
    pageWidth: number,
    pageHeight: number,
    totalScreen: number,
  ): string {
    return `${screenWidth}-${screenHeight}-${pageWidth}-${pageHeight}-${totalScreen}`;
  }

  async createProfileFolder(
    profileFolderPath: string,
  ): Promise<[Error | null, boolean]> {
    try {
      const isExist = fs.pathExistsSync(profileFolderPath);

      const isTempProfile = profileFolderPath.includes(TEMP_PROFILENAME);
      if (isExist) {
        // only remove temp profile folder
        if (isTempProfile) {
          fs.rmSync(profileFolderPath, { recursive: true, maxRetries: 15 });
        } else {
          return [null, false];
        }
      }

      await ensureBaseProfile();
      fs.copySync(getBaseProfilePath(), profileFolderPath, {
        overwrite: true,
        recursive: true,
      });

      return [null, true];
    } catch (err: any) {
      return [err, false];
    }
  }
}
