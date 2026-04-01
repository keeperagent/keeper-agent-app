import { chromium, BrowserContext } from "playwright-core";
import fs from "fs-extra";
import _ from "lodash";
import { IProxyProvider, IProxyInfo } from "@/electron/proxy";
import { preferenceDB } from "@/electron/database/preference";
import { logEveryWhere } from "@/electron/service/util";
import { IProfileProxy } from "@/electron/type";
import { browserDownloader } from "@/electron/service/browserDownloader";
import {
  LIST_NETWORK_PROTOCOL,
  PROXY_SERVICE_TYPE,
  PROXY_TYPE,
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

export class BaseBrowser {
  private decodoProxyProvider: IProxyProvider;
  private brightDataProxyProvider: IProxyProvider;
  private windowPosition: {
    [threadID: string]: { x: number; y: number };
  };
  private lastWindowPositionKey: string; // to trigger recaculate window position
  private stopSignal: StopSignal;

  constructor(
    decodoProxyProvider: IProxyProvider,
    brightDataProxyProvider: IProxyProvider,
    stopSignal: StopSignal,
  ) {
    this.decodoProxyProvider = decodoProxyProvider;
    this.brightDataProxyProvider = brightDataProxyProvider;
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
    maxProfilePerProxy,
    defaultOpenUrl,
    campaignId,
    workflowId,
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
    maxProfilePerProxy?: number;
    defaultOpenUrl?: string;
    campaignId?: number;
    workflowId?: number;
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

      // wait until able to get a proxy
      let proxy: IProxyInfo | null = null;
      const { isUseProxy, proxyIp, proxyType, proxyService } = profileProxy;
      if (isUseProxy) {
        if (proxyType === PROXY_TYPE.STATIC_PROXY) {
          const protocol =
            _.find(LIST_NETWORK_PROTOCOL, {
              value: proxyIp?.protocol,
            })?.prefix || "";
          const ip = proxyIp?.ip;
          const port = proxyIp?.port;
          if (protocol && ip && port) {
            proxy = {
              protocol,
              ip,
              port,
            };
          }
        } else if (proxyType === PROXY_TYPE.ROTATE_PROXY) {
          const provider =
            proxyService === PROXY_SERVICE_TYPE.DECODO
              ? this.decodoProxyProvider
              : proxyService === PROXY_SERVICE_TYPE.BRIGHTDATA
                ? this.brightDataProxyProvider
                : null;
          if (provider) {
            const res = await provider.getAProxy(
              profileKey,
              maxProfilePerProxy || 1,
              campaignId || 0,
              workflowId || 0,
            );
            if (res?.error) {
              return [null, Error(res?.error)];
            }

            if (res?.proxy) {
              proxy = res?.proxy;
            }
          } else {
            throw Error(`proxy service ${proxyService} not implemented`);
          }
        }

        // skip if user Stop workflow or Close browser
        if (this.stopSignal.shouldStop(profileKey)) {
          this.stopSignal.removeStopSignal(profileKey);
          return [null, Error(`Browser closed`)];
        }
        if (!proxy?.ip || !proxy?.port) {
          return [null, Error(UNABLE_TO_GET_PROXY)];
        }

        logEveryWhere({
          message: `Creating browser with proxy ${proxy?.ip}:${proxy?.port}`,
        });
        const protocol =
          _.find(LIST_NETWORK_PROTOCOL, {
            value: proxy?.protocol,
          })?.prefix || "";
        const proxyString = `${protocol}${proxy?.ip}:${proxy?.port}`;
        args.push(`--proxy-server=${proxyString}`);
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

      if (proxy?.username && proxy?.password) {
        contextOptions.proxy = {
          server: `${_.find(LIST_NETWORK_PROTOCOL, { value: proxy?.protocol })?.prefix || ""}${proxy?.ip}:${proxy?.port}`,
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

      await newPage?.addInitScript(() => {
        // Remove webdriver flag
        // https://stackoverflow.com/questions/56335066/changing-window-navigator-within-puppeteer-to-bypass-antibot-system
        // @ts-ignore
        delete navigator.__proto__.webdriver;

        // Inject window.chrome — Chromium doesn't have this but sites check for it
        Object.defineProperty(window, "chrome", {
          value: { runtime: {} },
          writable: false,
        });
      });

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
