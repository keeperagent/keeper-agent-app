import { Page, Browser } from "puppeteer-core";
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
    browser: Browser | null,
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
    const secretPhreaseOption = await tempPage?.waitForSelector(
      "::-p-xpath(//p[contains(text(), 'Secret Phrase')])",
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    await secretPhreaseOption?.click();
    await sleep(300);

    const listWord = seedPhrase?.split(" ");
    for (let i = 0; i < listWord?.length; i++) {
      const input = await tempPage?.waitForSelector(`input[name='${i}']`);
      await input?.type(listWord[i]);
    }

    await sleep(100);
    // click Confirm button
    const confirmButton = await tempPage?.waitForSelector(
      "::-p-xpath(//div[contains(text(), 'Import Wallet')])",
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    confirmButton?.click();

    // create password
    await sleep(3000);
    const inputPassword = await tempPage?.waitForSelector(
      "::-p-xpath((//input[@type='password'])[1])",
      { timeout: DEFAULT_EXTENSION_TIMEOUT },
    );
    await inputPassword?.type(password);

    await sleep(1000);
    const inputConfirmPassword = await tempPage?.waitForSelector(
      "::-p-xpath((//input[@type='password'])[2])",
      { timeout: DEFAULT_EXTENSION_TIMEOUT },
    );
    await inputConfirmPassword?.type(password);

    const checkbox = await tempPage?.waitForSelector("input[type='checkbox']", {
      timeout: DEFAULT_TIMEOUT,
    });
    await checkbox?.click();

    // click Continue button
    const continueButton = await tempPage?.waitForSelector(
      "::-p-xpath(//div[contains(text(), 'Continue')])",
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    continueButton?.click();

    // select Aptos
    await sleep(1000);
    const aptosCheckbox = await tempPage?.waitForSelector(
      "::-p-xpath((//input[@type='checkbox'])[1])",
    );
    // @ts-ignore
    await aptosCheckbox?.click();

    // select Sui
    await sleep(1000);
    const suiCheckbox = await tempPage?.waitForSelector(
      "::-p-xpath((//input[@type='checkbox'])[3])",
    );
    // @ts-ignore
    await suiCheckbox?.click();

    await sleep(1000);
    // click Import Wallet button
    const importButton = await tempPage?.waitForSelector(
      "::-p-xpath(//div[contains(text(), 'Import Wallet')])",
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    importButton?.click();

    //   turn off notification
    await sleep(2000);
    const notiCheckbox = await tempPage?.waitForSelector(
      "::-p-xpath(//input[@type='checkbox'])",
    );
    // @ts-ignore
    await notiCheckbox?.click();

    // click Import Wallet button
    await sleep(500);
    const continue1Button = await tempPage?.waitForSelector(
      "::-p-xpath(//div[contains(text(), 'Continue')])",
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    continue1Button?.click();

    // click Continue button
    await sleep(500);
    const continue2Button = await tempPage?.waitForSelector(
      "::-p-xpath(//div[contains(text(), 'Continue')])",
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    continue2Button?.click();

    // click Finish button
    await sleep(500);
    await sleep(500);
    const finishButton = await tempPage?.waitForSelector(
      "::-p-xpath(//div[contains(text(), 'Finish')])",
      { timeout: DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    finishButton?.click();
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
      const passwordInput = await page?.waitForSelector(
        "input[type='password']",
        {
          timeout: 5000,
        },
      );

      await sleep(100);
      const password = getActualValue(config?.password || "", listVariable);
      await passwordInput?.type(password);

      // click "Unlock" button
      await sleep(300);
      const unlockButton = await page?.waitForSelector(
        "::-p-xpath(//button[contains(text(), 'Unlock')])",
        { timeout: 5000 },
      );
      // @ts-ignore
      unlockButton?.click();

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
