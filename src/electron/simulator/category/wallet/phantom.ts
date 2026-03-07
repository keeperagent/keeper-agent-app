import { Page, Browser } from "puppeteer-core";
import {
  IConnectPhantomWalletNodeConfig,
  IFlowProfile,
  IImportPhantomWalletNodeConfig,
  IWorkflowVariable,
  IUnlockPhantomWalletNodeConfig,
} from "@/electron/type";
import { DEFAULT_TIMEOUT } from "@/electron/simulator/constant";
import {
  sleep,
  processSkipSetting,
  waitAndClickText,
  getActualValue,
} from "@/electron/simulator/util";

export class PhantomWallet {
  importWallet = async (
    page: Page,
    config: IImportPhantomWalletNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
    browser: Browser | null,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await sleep(300);
    const tempPage = await browser?.newPage();
    await tempPage?.goto(
      `chrome-extension://${config?.extensionID}/onboarding.html?restore=true`,
      { timeout: DEFAULT_TIMEOUT },
    );

    await sleep(300);
    const haveWalletButton = await tempPage?.waitForSelector(
      "::-p-xpath(//button[contains(text(), 'I already have a wallet')])",
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    await haveWalletButton?.click();

    await sleep(300);
    const secretPhaseOption = await tempPage?.waitForSelector(
      "::-p-xpath(//div[contains(text(), 'Import Recovery Phrase')])",
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    await secretPhaseOption?.click();

    await sleep(300);
    const seedPhrase = getActualValue(config?.seedPhrase || "", listVariable);
    const password = getActualValue(config?.password || "", listVariable);
    const listWord = seedPhrase?.split(" ");
    for (let i = 0; i < listWord?.length; i++) {
      const input = await tempPage?.waitForSelector(
        `input[data-testid='secret-recovery-phrase-word-input-${i}']`,
        { timeout: DEFAULT_TIMEOUT },
      );
      await input?.type(listWord[i]);
    }

    await sleep(300);
    const confirmButton = await tempPage?.waitForSelector(
      "::-p-xpath(//button[contains(text(), 'Import Wallet')])",
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    confirmButton?.click();

    await sleep(500);
    const continueButton = await tempPage?.waitForSelector(
      "::-p-xpath(//button[contains(text(), 'Continue')])",
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    continueButton?.click();

    // create password
    await sleep(300);
    const inputPassword = await tempPage?.waitForSelector(
      "input[name='password']",
      { timeout: DEFAULT_TIMEOUT },
    );
    await inputPassword?.type(password);

    await sleep(300);
    const inputConfirmPassword = await tempPage?.waitForSelector(
      "input[name='confirmPassword']",
      { timeout: DEFAULT_TIMEOUT },
    );
    await inputConfirmPassword?.type(password);

    await sleep(300);
    const checkbox = await tempPage?.waitForSelector(
      `input[data-testid='onboarding-form-terms-of-service-checkbox']`,
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    await checkbox?.click();

    await sleep(300);
    const continueButton2 = await tempPage?.waitForSelector(
      "::-p-xpath(//button[contains(text(), 'Continue')])",
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    continueButton2?.click();

    try {
      await sleep(300);
      const continueButton3 = await tempPage?.waitForSelector(
        "::-p-xpath(//button[contains(text(), 'Continue')])",
        { timeout: 5000 },
      );
      // @ts-ignore
      continueButton3?.click();
    } catch {}

    try {
      await sleep(300);
      const getStartedButton = await tempPage?.waitForSelector(
        "::-p-xpath(//button[contains(text(), 'Get Started')])",
        { timeout: 5000 },
      );
      // @ts-ignore
      getStartedButton?.click();
    } catch {}

    // clean up, close side panel if it exists
    await sleep(3000);
    try {
      const targets = browser?.targets() || [];
      for (const target of targets) {
        const targetUrl = target.url();
        if (
          targetUrl?.includes("chrome-extension://") &&
          targetUrl?.includes("popup.html") &&
          targetUrl?.includes(config?.extensionID!)
        ) {
          try {
            const cdpSession = await target.createCDPSession();
            // @ts-ignore
            const targetId = target._targetId;
            if (targetId) {
              await cdpSession.send("Target.closeTarget", { targetId });
            }
          } catch {}
        }
      }
    } catch {}

    return flowProfile;
  };

  unlockWallet = async (
    page: Page,
    config: IUnlockPhantomWalletNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await page?.goto(`chrome-extension://${config?.extensionID}/popup.html`, {
      timeout: 5000,
    });

    // type password
    await sleep(500);
    const passwordInput = await page?.waitForSelector(
      "input[name='password']",
      {
        timeout: 5000,
      },
    );

    const password = getActualValue(config?.password || "", listVariable);
    await sleep(100);
    await passwordInput?.type(password);

    // click "Unlock" button
    await sleep(300);
    const unlockButton = await page?.waitForSelector(
      "::-p-xpath(//button[contains(text(), 'Unlock')])",
      { timeout: 5000 },
    );
    // @ts-ignore
    unlockButton?.click();
    await sleep(300);

    return flowProfile;
  };

  connectWallet = async (
    page: Page,
    config: IConnectPhantomWalletNodeConfig,
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

  clickConfirm = async (
    page: Page,
    config: IConnectPhantomWalletNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await sleep(1000);
    await waitAndClickText("Confirm", page);

    return flowProfile;
  };
}
