import { Page, BrowserContext } from "playwright-core";
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
    browser: BrowserContext | null,
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
    await tempPage
      ?.locator("xpath=//button[contains(text(), 'I already have a wallet')]")
      .click({ timeout: DEFAULT_TIMEOUT });

    await sleep(300);
    await tempPage
      ?.locator("xpath=//div[contains(text(), 'Import Recovery Phrase')]")
      .click({ timeout: DEFAULT_TIMEOUT });

    await sleep(300);
    const seedPhrase = getActualValue(config?.seedPhrase || "", listVariable);
    const password = getActualValue(config?.password || "", listVariable);
    const listWord = seedPhrase?.split(" ");
    for (let i = 0; i < listWord?.length; i++) {
      await tempPage
        ?.locator(`input[data-testid='secret-recovery-phrase-word-input-${i}']`)
        .fill(listWord[i]);
    }

    await sleep(300);
    await tempPage
      ?.locator("xpath=//button[contains(text(), 'Import Wallet')]")
      .click({ timeout: DEFAULT_TIMEOUT });

    await sleep(500);
    await tempPage
      ?.locator("xpath=//button[contains(text(), 'Continue')]")
      .click({ timeout: DEFAULT_TIMEOUT });

    // create password
    await sleep(300);
    await tempPage?.locator("input[name='password']").fill(password);

    await sleep(300);
    await tempPage?.locator("input[name='confirmPassword']").fill(password);

    await sleep(300);
    await tempPage
      ?.locator(
        `input[data-testid='onboarding-form-terms-of-service-checkbox']`,
      )
      .click({ timeout: DEFAULT_TIMEOUT });

    await sleep(300);
    await tempPage
      ?.locator("xpath=//button[contains(text(), 'Continue')]")
      .click({ timeout: DEFAULT_TIMEOUT });

    try {
      await sleep(300);
      await tempPage
        ?.locator("xpath=//button[contains(text(), 'Continue')]")
        .click({ timeout: 5000 });
    } catch {}

    try {
      await sleep(300);
      await tempPage
        ?.locator("xpath=//button[contains(text(), 'Get Started')]")
        .click({ timeout: 5000 });
    } catch {}

    // clean up, close side panel if it exists
    await sleep(3000);
    try {
      const cdpSession = await browser?.newCDPSession(page);
      const targets = await cdpSession?.send("Target.getTargets");
      const { targetInfos = [] } = targets || {};
      for (const targetInfo of targetInfos || []) {
        const targetUrl = targetInfo?.url || "";
        if (
          targetUrl?.includes("chrome-extension://") &&
          targetUrl?.includes("popup.html") &&
          targetUrl?.includes(config?.extensionID!)
        ) {
          try {
            await cdpSession?.send("Target.closeTarget", {
              targetId: targetInfo.targetId,
            });
          } catch {}
        }
      }
      await cdpSession?.detach();
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
    const password = getActualValue(config?.password || "", listVariable);
    await sleep(100);
    await page
      ?.locator("input[name='password']")
      .pressSequentially(password, { delay: 50, timeout: 5000 });

    // click "Unlock" button
    await sleep(300);
    await page
      ?.locator("xpath=//button[contains(text(), 'Unlock')]")
      .click({ timeout: 5000 });
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
