import { Page, BrowserContext } from "playwright-core";
import {
  IApproveMartianWalletNodeConfig,
  IFlowProfile,
  IImportMartianWalletNodeConfig,
  IWorkflowVariable,
  ISwitchMartianWalletNodeConfig,
  IUnlockMartianWalletNodeConfig,
} from "@/electron/type";
import {
  DEFAULT_EXTENSION_TIMEOUT,
  DEFAULT_TIMEOUT,
} from "@/electron/simulator/constant";
import {
  sleep,
  processSkipSetting,
  waitAndClickText,
  getActualValue,
} from "@/electron/simulator/util";

export class MartianWallet {
  importWallet = async (
    page: Page,
    config: IImportMartianWalletNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
    browser: BrowserContext | null,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    const seedPhrase = getActualValue(config?.seedPhrase || "", listVariable);
    const password = getActualValue(config?.password || "", listVariable);

    const tempPage = await browser?.newPage();
    await tempPage?.goto(
      `chrome-extension://${config?.extensionID}/onboarding/onboarding.html?restore=true&mnemonic=true`,
      { timeout: DEFAULT_TIMEOUT },
    );

    await sleep(1000);
    await tempPage
      ?.locator("xpath=//p[contains(text(), 'Secret Phrase')]")
      .click({ timeout: DEFAULT_TIMEOUT });
    await sleep(300);

    const listWord = seedPhrase?.split(" ");
    for (let i = 0; i < listWord?.length; i++) {
      await tempPage?.locator(`input[name='${i}']`).fill(listWord[i]);
    }

    await sleep(100);
    // click Confirm button
    await tempPage
      ?.locator("xpath=//div[contains(text(), 'Import Wallet')]")
      .click({ timeout: DEFAULT_TIMEOUT });

    // create password
    await sleep(3000);
    await tempPage
      ?.locator("xpath=(//input[@type='password'])[1]")
      .pressSequentially(password, {
        delay: 50,
        timeout: DEFAULT_EXTENSION_TIMEOUT,
      });

    await sleep(1000);
    await tempPage
      ?.locator("xpath=(//input[@type='password'])[2]")
      .pressSequentially(password, {
        delay: 50,
        timeout: DEFAULT_EXTENSION_TIMEOUT,
      });

    await tempPage
      ?.locator("input[type='checkbox']")
      .click({ timeout: DEFAULT_TIMEOUT });

    // click Continue button
    await tempPage
      ?.locator("xpath=//div[contains(text(), 'Continue')]")
      .click({ timeout: DEFAULT_TIMEOUT });

    // select Aptos
    await sleep(1000);
    await tempPage?.locator("xpath=(//input[@type='checkbox'])[1]").click();

    // select Sui
    await sleep(1000);
    await tempPage?.locator("xpath=(//input[@type='checkbox'])[3]").click();

    await sleep(1000);
    // click Import Wallet button
    await tempPage
      ?.locator("xpath=//div[contains(text(), 'Import Wallet')]")
      .click({ timeout: DEFAULT_TIMEOUT });

    //   turn off notification
    await sleep(2000);
    await tempPage?.locator("xpath=//input[@type='checkbox']").click();

    // click Import Wallet button
    await sleep(500);
    await tempPage
      ?.locator("xpath=//div[contains(text(), 'Continue')]")
      .click({ timeout: DEFAULT_TIMEOUT });

    // click Continue button
    await sleep(500);
    await tempPage
      ?.locator("xpath=//div[contains(text(), 'Continue')]")
      .click({ timeout: DEFAULT_TIMEOUT });

    // click Finish button
    await sleep(500);
    await sleep(500);
    await tempPage
      ?.locator("xpath=//div[contains(text(), 'Finish')]")
      .click({ timeout: DEFAULT_TIMEOUT });
    await sleep(300);

    return flowProfile;
  };

  unlockWallet = async (
    page: Page,
    config: IUnlockMartianWalletNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    try {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      await page?.goto(`chrome-extension://${config?.extensionID}/index.html`, {
        timeout: 5000,
      });

      // type password
      await sleep(500);
      const password = getActualValue(config?.password || "", listVariable);
      await sleep(100);
      await page
        ?.locator("input[type='password']")
        .pressSequentially(password, { delay: 50, timeout: 5000 });

      // click "Unlock" button
      await sleep(300);
      await page
        ?.locator("xpath=//button[contains(text(), 'Unlock')]")
        .click({ timeout: 5000 });

      return flowProfile;
    } catch {
      return flowProfile;
    }
  };

  approve = async (
    page: Page,
    config: IApproveMartianWalletNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await waitAndClickText("APPROVE", page);
    return flowProfile;
  };

  switch = async (
    page: Page,
    config: ISwitchMartianWalletNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await waitAndClickText("SWITCH", page);
    return flowProfile;
  };
}
