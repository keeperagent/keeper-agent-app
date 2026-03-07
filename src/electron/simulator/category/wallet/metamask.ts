import { Page } from "puppeteer-core";
import {
  IFlowProfile,
  IImportMetamaskNodeConfig,
  IWorkflowVariable,
} from "@/electron/type";
import { DEFAULT_TIMEOUT } from "@/electron/simulator/constant";
import {
  sleep,
  processSkipSetting,
  waitAndClickText,
  getActualValue,
} from "@/electron/simulator/util";

export class Metamask {
  import = async (
    page: Page,
    config: IImportMetamaskNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await page?.goto(
      `chrome-extension://${config?.extensionID}/home.html#onboarding/welcome`,
      { timeout: config?.timeout! * 3000 || DEFAULT_TIMEOUT },
    );

    // click Agree checkbox
    await sleep(100);
    await page?.evaluate(() => {
      const checkbox = document.querySelector(
        "input[id='onboarding__terms-checkbox']",
      );
      // @ts-ignore
      checkbox?.click();
    });

    // click Import an exist wallet button
    await sleep(100);
    await page?.waitForSelector(
      "button[data-testid='onboarding-import-wallet']",
    );
    await page?.evaluate(() => {
      const button = document.querySelector(
        "button[data-testid='onboarding-import-wallet']",
      );
      // @ts-ignore
      button?.click();
    });

    // go to next page
    await sleep(100);
    await page?.waitForSelector("button[data-testid='metametrics-no-thanks']");
    await page?.evaluate(() => {
      const button = document.querySelector(
        "button[data-testid='metametrics-no-thanks']",
      );
      // @ts-ignore
      button?.click();
    });

    const seedPhrase = getActualValue(config?.seedPhrase || "", listVariable);
    const password = getActualValue(config?.password || "", listVariable);
    const listWord = seedPhrase?.split(" ");

    // type phrase into input
    for (let i = 0; i < listWord?.length; i++) {
      const input = await page?.waitForSelector(`#import-srp__srp-word-${i}`);
      await input?.type(listWord[i]);
    }

    await sleep(100);
    await page?.waitForSelector("button[data-testid='import-srp-confirm']");
    await page?.evaluate(() => {
      const button = document.querySelector(
        "button[data-testid='import-srp-confirm']",
      );
      // @ts-ignore
      button?.click();
    });

    // go to next page
    // type password
    await sleep(100);
    const passwordInput = await page?.waitForSelector(
      "input[data-testid='create-password-new']",
    );
    await passwordInput?.type(password);

    // type confirm password
    const confirmPasswordInput = await page?.waitForSelector(
      "input[data-testid='create-password-confirm']",
    );
    await confirmPasswordInput?.type(password);

    // click check box
    await sleep(100);
    await page?.waitForSelector("input[data-testid='create-password-terms']");
    await page?.evaluate(() => {
      const checkbox = document.querySelector(
        "input[data-testid='create-password-terms']",
      );
      // @ts-ignore
      checkbox?.click();
    });

    // click Create Wallet button
    await sleep(100);
    await page?.evaluate(() => {
      const button = document.querySelector(
        "button[data-testid='create-password-import']",
      );
      // @ts-ignore
      button?.click();
    });

    // go to next page
    // Click "Got it" button
    await sleep(1000);
    await page?.waitForSelector(
      "button[data-testid='onboarding-complete-done']",
    );
    await page?.evaluate(() => {
      const button = document.querySelector(
        "button[data-testid='onboarding-complete-done']",
      );
      // @ts-ignore
      button?.click();
    });

    // Click "Next" button
    await sleep(1000);
    await page?.evaluate(() => {
      const button = document.querySelector(
        "button[data-testid='pin-extension-next']",
      );
      // @ts-ignore
      button?.click();
    });

    // Click "Done" button
    await sleep(1000);
    await page?.evaluate(() => {
      const button = document.querySelector(
        "button[data-testid='pin-extension-done']",
      );
      // @ts-ignore
      button?.click();
    });

    // go to next page
    await page?.goto(`chrome-extension://${config?.extensionID}/home.html#`);

    // Close Popup
    try {
      await sleep(300);
      await page?.evaluate(() => {
        const button = document.querySelector(
          "button[data-testid='popover-close']",
        );
        // @ts-ignore
        button?.click();
      });
    } catch {}

    await page.reload();
    return flowProfile;
  };

  unlock = async (
    page: Page,
    config: IImportMetamaskNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await page?.goto(
      `chrome-extension://${config?.extensionID}/home.html#unlock`,
      { timeout: config?.timeout! * 3000 || DEFAULT_TIMEOUT },
    );

    // type password
    await sleep(100);
    const passwordInput = await page?.waitForSelector(
      "input[data-testid='unlock-password']",
      {
        timeout: config?.timeout! * 3000 || DEFAULT_TIMEOUT,
      },
    );
    const password = getActualValue(config?.password || "", listVariable);
    await passwordInput?.type(password);

    // click Unlock button
    await sleep(100);
    await page?.waitForSelector("button[data-testid='unlock-submit']");
    await page?.evaluate(() => {
      const button = document.querySelector(
        "button[data-testid='unlock-submit']",
      );
      // @ts-ignore
      button?.click();
    });
    await sleep(500);

    return flowProfile;
  };

  connect = async (
    page: Page,
    config: IImportMetamaskNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await sleep(1000);
    await waitAndClickText("Connect", page);

    return flowProfile;
  };

  approve = async (
    page: Page,
    config: IImportMetamaskNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await waitAndClickText("Approve");
    return flowProfile;
  };

  cancel = async (
    page: Page,
    config: IImportMetamaskNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await waitAndClickText("Cancel");
    return flowProfile;
  };

  confirm = async (
    page: Page,
    config: IImportMetamaskNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await waitAndClickText("Confirm");
    return flowProfile;
  };
}
