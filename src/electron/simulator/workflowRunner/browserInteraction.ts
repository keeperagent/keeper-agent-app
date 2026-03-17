import { Browser, Page } from "puppeteer-core";
import {
  updateVariable,
  processSkipSetting,
  getActualValue,
  waitAndClickText,
} from "@/electron/simulator/util";
import { DEFAULT_TIMEOUT } from "@/electron/simulator/constant";
import {
  IFlowProfile,
  IOpenURLNodeConfig,
  ISolveCaptchaNodeConfig,
  ITypeTextNodeConfig,
  IReloadPageNodeConfig,
  IGoBackNodeConfig,
  ICloseTabNodeConfig,
  ISelectTabNodeConfig,
  IOpenNewTabNodeConfig,
  IScrollNodeConfig,
  IWorkflowVariable,
  ICrawlTextNodeConfig,
  IClickNodeConfig,
  ICheckElementExistNodeConfig,
  IClickExtensionNodeConfig,
} from "@/electron/type";
import {
  SELECTOR_TYPE,
  CAPTCHA_TYPE,
  BOOLEAN_RESULT,
  SCROLL_DIRECTION,
  SCROLL_TYPE,
  WORKFLOW_TYPE,
} from "@/electron/constant";
import { solveCaptcha, CAPTCHA_METHOD } from "@/electron/service/captcha";
import { Thread, ThreadManager } from "./threadManager";
import { WorkflowRunnerArgs, NodeHandler } from "./index";

export class BrowserInteraction {
  threadManager: ThreadManager;

  constructor({ threadManager }: WorkflowRunnerArgs) {
    this.threadManager = threadManager;
  }

  openURL = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IOpenURLNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const url = getActualValue(config?.url || "", listVariable);
      await page?.goto(url, {
        timeout: (config?.timeout || 0) * 1000 || DEFAULT_TIMEOUT,
      });

      return flowProfile;
    };

    return this.threadManager.runNormalTask<IOpenURLNodeConfig>({
      flowProfile,
      taskFn: script,
      taskName: "openURL",
    });
  };

  typeText = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ITypeTextNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const timeout = (config?.timeout || 0) * 1000 || DEFAULT_TIMEOUT;
      const content = getActualValue(config?.content, listVariable);

      if (config?.selectorType === SELECTOR_TYPE.CSS_SELECTOR) {
        const cssSelector = getActualValue(
          config?.cssSelector || "",
          listVariable,
        );

        const element = await page?.waitForSelector(cssSelector, {
          timeout,
        });

        if (config?.shouldClearInput) {
          await element?.click({ clickCount: 3 });
          await page.keyboard.press("Backspace");
        }
        await element?.type(content, { delay: config?.speed * 1000 });
      } else if (config?.selectorType === SELECTOR_TYPE.XPATH_SELECTOR) {
        const xPathSelector = getActualValue(
          config?.xPathSelector || "",
          listVariable,
        );
        const element = await page?.waitForSelector(
          `::-p-xpath(${xPathSelector})`,
          {
            timeout,
          },
        );

        if (config?.shouldClearInput) {
          // @ts-ignore
          await element?.click({ clickCount: 3 });
          await page.keyboard.press("Backspace");
        }
        await element?.type(content, { delay: config?.speed * 1000 });
      }

      return flowProfile;
    };

    return this.threadManager.runNormalTask<ITypeTextNodeConfig>({
      flowProfile,
      taskFn: script,
      taskName: "typeText",
    });
  };

  click = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IClickNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const timeout = (config?.timeout || 0) * 1000 || DEFAULT_TIMEOUT;
      if (config?.selectorType === SELECTOR_TYPE.CSS_SELECTOR) {
        const cssSelector = getActualValue(
          config?.cssSelector || "",
          listVariable,
        );

        if (config?.listShadowRoot) {
          await page?.evaluate(
            (config, cssSelector) => {
              const listShadowRoot = config?.listShadowRoot || [];
              let shadowRootElement;

              for (const shadowRootName of listShadowRoot) {
                if (shadowRootName) {
                  const currenShadowRoot =
                    document.querySelector(shadowRootName)?.shadowRoot;

                  if (currenShadowRoot) {
                    shadowRootElement = currenShadowRoot;
                  }
                }
              }

              const element = shadowRootElement?.querySelector(cssSelector);
              if (element) {
                /* @ts-ignore */
                element?.click();
              }
            },
            config,
            cssSelector,
          );
        } else {
          // can't waiting element inside shadowRoot
          await page?.waitForSelector(cssSelector, {
            timeout,
          });

          await page?.evaluate((cssSelector) => {
            const element = document.querySelector(cssSelector);

            // @ts-ignore
            element?.click();
          }, cssSelector);
        }
      } else if (config?.selectorType === SELECTOR_TYPE.XPATH_SELECTOR) {
        const xPathSelector = getActualValue(
          config?.xPathSelector || "",
          listVariable,
        );
        const element = await page?.waitForSelector(
          `::-p-xpath(${xPathSelector})`,
          {
            timeout,
          },
        );
        // @ts-ignore
        await element?.click();
      }

      return flowProfile;
    };

    return this.threadManager.runNormalTask<IClickNodeConfig>({
      flowProfile,
      taskFn: script,
      taskName: "click",
    });
  };

  solveCaptcha = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const timeout =
      ((flowProfile?.config as ISolveCaptchaNodeConfig).timeout || 0) * 1000;

    const script = async (
      page: Page,
      config: ISolveCaptchaNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      let method = "";
      if (config?.captchaType === CAPTCHA_TYPE.RECAPTCHAV2) {
        method = CAPTCHA_METHOD.RECAPTCHAV2;
      } else if (config?.captchaType === CAPTCHA_TYPE.HCAPTCHA) {
        method = CAPTCHA_METHOD.HCAPTCHA;
      } else if (config?.captchaType === CAPTCHA_TYPE.TURNSTILE_CLOUDFLARE) {
        method = CAPTCHA_METHOD.CLOUDFARE_TURNSTILE;
      }
      const err = await solveCaptcha(
        page,
        method,
        config?.twoCaptchaAPIKey!,
        timeout,
      );
      if (err) {
        throw new Error(err?.message);
      }

      return flowProfile;
    };

    return this.threadManager.runNormalTask<ISolveCaptchaNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout,
      taskName: "solveCaptcha",
    });
  };

  reloadPage = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IReloadPageNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      await page?.reload();
      return flowProfile;
    };

    return this.threadManager.runNormalTask<IReloadPageNodeConfig>({
      flowProfile,
      taskFn: script,
      taskName: "reloadPage",
    });
  };

  goBackPage = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IReloadPageNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      await page?.goBack();
      return flowProfile;
    };

    return this.threadManager.runNormalTask<IGoBackNodeConfig>({
      flowProfile,
      taskFn: script,
      taskName: "goBackPage",
    });
  };

  closeTab = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ICloseTabNodeConfig,
      listVariable: IWorkflowVariable[],
      flowProfile: IFlowProfile,
      browser: Browser | null,
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { threadID } = flowProfile;
      const thread = this.threadManager.getThread(threadID);
      const { listPage } = thread.simulator;
      if (listPage?.length === 0) {
        return flowProfile;
      }

      let selectedTab = config?.selectedTab || 1;
      selectedTab = selectedTab - 1;

      page = listPage[selectedTab];
      await page?.close();
      let newListPage = await browser?.pages();
      newListPage = newListPage || [];

      let currentPageIndex = 0;
      if (newListPage?.length > 0) {
        if (selectedTab < listPage?.length - 1) {
          const nextPage = listPage[selectedTab + 1];
          await nextPage?.bringToFront();
          currentPageIndex = selectedTab;
        } else {
          const previousPage = listPage[selectedTab - 1];
          await previousPage?.bringToFront();
          currentPageIndex = selectedTab - 1;
        }
      }

      const updatedThread: Thread = {
        ...thread,
        simulator: {
          ...thread.simulator,
          listPage: newListPage || [],
          currentPageIndex,
        },
      };
      this.threadManager.updateThread(threadID, updatedThread);
      return flowProfile;
    };

    return this.threadManager.runNormalTask<ICloseTabNodeConfig>({
      flowProfile,
      taskFn: script,
      taskName: "closeTab",
    });
  };

  selectTab = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ISelectTabNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { threadID } = flowProfile;
      const thread = this.threadManager.getThread(threadID);

      const { listPage, currentPageIndex } = thread.simulator;
      if (currentPageIndex === null) {
        throw Error("empty page");
      }

      // first tab is 0, second tab is 1, ...
      const selectedTab = config?.selectedTab - 1;
      const isValidSelectedTab = selectedTab < listPage?.length;
      if (!isValidSelectedTab) {
        throw Error("invalid selected tab index");
      }

      page = listPage[selectedTab];
      await page?.bringToFront();
      thread.simulator.currentPageIndex = selectedTab;
      return flowProfile;
    };

    return this.threadManager.runNormalTask<ISelectTabNodeConfig>({
      flowProfile,
      taskFn: script,
      taskName: "selectTab",
    });
  };

  openNewTab = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IOpenNewTabNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const { threadID } = flowProfile;
      const thread = this.threadManager.getThread(threadID);
      const { listPage, currentPageIndex, browser } = thread.simulator;
      if (currentPageIndex === null) {
        throw Error("empty page");
      }

      const newPage = await browser?.newPage();
      await newPage?.goto((config as IOpenNewTabNodeConfig).url, {
        timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
      });

      newPage && listPage?.push(newPage);
      const newPageIndex = listPage?.findIndex((page) => page === newPage);
      thread.simulator.currentPageIndex = newPageIndex;
      thread.simulator.listPage = listPage;
      return flowProfile;
    };

    return this.threadManager.runNormalTask<IOpenNewTabNodeConfig>({
      flowProfile,
      taskFn: script,
      taskName: "openNewTab",
    });
  };

  scroll = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IScrollNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      // scroll by coordinnates mode
      if (config?.scrollSelector === SCROLL_TYPE.SCROLL_COORDINATES) {
        const isScrollUp =
          config?.scrollDirection === SCROLL_DIRECTION.SCROLL_DOWN;
        const yAxis = isScrollUp ? config?.yAxis : config?.yAxis * -1;

        await page?.evaluate(
          (xAxis, yAxis) => {
            window.scrollBy(xAxis, yAxis);
          },
          0,
          yAxis,
        );

        // scroll by selector mode
      } else if (config?.scrollSelector === SCROLL_TYPE.SCROLL_SELECTOR) {
        if (config?.selectorType === SELECTOR_TYPE.CSS_SELECTOR) {
          const cssSelector = getActualValue(
            config?.cssSelector || "",
            listVariable,
          );
          await page?.waitForSelector(cssSelector, {
            timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
          });

          await page.evaluate((cssSelector) => {
            const element = document.querySelector(cssSelector);
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }, cssSelector);
        } else if (config?.selectorType === SELECTOR_TYPE.XPATH_SELECTOR) {
          const xPathSelector = getActualValue(
            config?.xPathSelector || "",
            listVariable,
          );
          const element = await page?.waitForSelector(
            `::-p-xpath(${xPathSelector})`,
            {
              timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
            },
          );
          // @ts-ignore
          await element.scrollIntoView({ behavior: "smooth" });
        }
      }

      return flowProfile;
    };

    return this.threadManager.runNormalTask<IScrollNodeConfig>({
      flowProfile,
      taskFn: script,
      taskName: "scroll",
    });
  };

  checkElementExist = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ICheckElementExistNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      let isElementExist = false;

      try {
        const timeout = config?.timeout! * 1000 || DEFAULT_TIMEOUT;
        if (config?.selectorType === SELECTOR_TYPE.CSS_SELECTOR) {
          const cssSelector = getActualValue(
            config?.cssSelector || "",
            listVariable,
          );
          await page.waitForSelector(cssSelector, {
            timeout,
          });
          isElementExist = true;
        } else if (config?.selectorType === SELECTOR_TYPE.XPATH_SELECTOR) {
          const xPathSelector = getActualValue(
            config?.xPathSelector || "",
            listVariable,
          );
          await page?.waitForSelector(`::-p-xpath(${xPathSelector})`, {
            timeout,
          });
          isElementExist = true;
        }
      } catch {}

      const newListVariable = updateVariable(listVariable, {
        variable: config?.variable!,
        value: isElementExist ? BOOLEAN_RESULT.TRUE : BOOLEAN_RESULT.FALSE,
      });
      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ICheckElementExistNodeConfig>({
      flowProfile,
      taskFn: script,
      taskName: "checkElementExist",
    });
  };

  crawlText = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ICrawlTextNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const timeout = (config?.timeout || 0) * 1000 || DEFAULT_TIMEOUT;
      let text = null;
      if (config?.selectorType === SELECTOR_TYPE.CSS_SELECTOR) {
        const cssSelector = getActualValue(
          config?.cssSelector || "",
          listVariable,
        );
        await page?.waitForSelector(cssSelector, {
          timeout,
        });
        text = await page?.evaluate((cssSelector) => {
          const element = document.querySelector(cssSelector);
          return element?.textContent;
        }, cssSelector);
      } else if (config?.selectorType === SELECTOR_TYPE.XPATH_SELECTOR) {
        const xPathSelector = getActualValue(
          config?.xPathSelector || "",
          listVariable,
        );
        const element = await page?.waitForSelector(
          `::-p-xpath(${xPathSelector})`,
          {
            timeout,
          },
        );
        text = await element?.evaluate((el) => el.textContent);
      }

      const newListVariable = updateVariable(listVariable, {
        variable: config?.variable!,
        value: text,
      });

      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };
      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ICrawlTextNodeConfig>({
      flowProfile,
      taskFn: script,
      taskName: "crawlText",
    });
  };

  clickExtension = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IClickExtensionNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const text = getActualValue(config?.text || "", listVariable);
      const clicked = await waitAndClickText(text, page);
      if (!clicked) {
        throw new Error(`Element with text "${text}" not found in extension`);
      }
      return flowProfile;
    };

    return this.threadManager.runNormalTask<IClickExtensionNodeConfig>({
      flowProfile,
      taskFn: script,
      taskName: "clickExtension",
      withExtensionPopup: true,
    });
  };
}

export const registerBrowserHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const s = new BrowserInteraction(args);
  handlers.set(WORKFLOW_TYPE.OPEN_URL, s.openURL);
  handlers.set(WORKFLOW_TYPE.TYPE_TEXT, s.typeText);
  handlers.set(WORKFLOW_TYPE.CLICK, s.click);
  handlers.set(WORKFLOW_TYPE.CRAWL_TEXT, s.crawlText);
  handlers.set(WORKFLOW_TYPE.SOLVE_CAPTCHA, s.solveCaptcha);
  handlers.set(WORKFLOW_TYPE.RELOAD_PAGE, s.reloadPage);
  handlers.set(WORKFLOW_TYPE.GO_BACK, s.goBackPage);
  handlers.set(WORKFLOW_TYPE.CLOSE_TAB, s.closeTab);
  handlers.set(WORKFLOW_TYPE.SELECT_TAB, s.selectTab);
  handlers.set(WORKFLOW_TYPE.NEW_TAB, s.openNewTab);
  handlers.set(WORKFLOW_TYPE.SCROLL, s.scroll);
  handlers.set(WORKFLOW_TYPE.CHECK_ELEMENT_EXIST, s.checkElementExist);
  handlers.set(WORKFLOW_TYPE.CLICK_EXTENSION, s.clickExtension);
};
