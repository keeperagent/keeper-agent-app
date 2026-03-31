import { Page, BrowserContext } from "playwright-core";
import {
  IFlowProfile,
  IImportRabbyWalletNodeConfig,
  IWorkflowVariable,
  IUnlockRabbyWalletNodeConfig,
  IConnectRabbyWalletNodeConfig,
  ICancelRabbyWalletNodeConfig,
  ISignRabbyWalletNodeConfig,
  IRabbyAddNetworkNodeConfig,
} from "@/electron/type";
import { DEFAULT_TIMEOUT } from "@/electron/simulator/constant";
import {
  sleep,
  processSkipSetting,
  waitAndClickText,
  waitTextAppear,
  getActualValue,
} from "@/electron/simulator/util";
import {
  IMPORT_WALLET_TYPE,
  RABBY_ADD_NETWORK_TYPE,
  RABBY_GAS_MODE,
} from "@/electron/constant";

export class RabbyWallet {
  imporWallet = async (
    page: Page,
    config: IImportRabbyWalletNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
    browser: BrowserContext | null,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    const { importType } = config;
    const password = getActualValue(config?.password || "", listVariable);

    // import wallet using "Seed Phrase"
    if (importType === IMPORT_WALLET_TYPE.IMPORT_BY_SEED_PHRASE) {
      const tempPage = await browser?.newPage();
      await tempPage?.goto(
        `chrome-extension://${config?.extensionID}/index.html#/no-address`,
        { timeout: DEFAULT_TIMEOUT },
      );

      // click "Import Seed Phrase"
      await tempPage
        ?.locator("xpath=//div[contains(text(), 'Import Seed Phrase')]")
        .click({ timeout: 5000 });

      await sleep(100);
      await tempPage?.locator("#password").fill(password);

      await sleep(100);
      await tempPage?.locator("#confirmPassword").fill(password);

      await sleep(100);
      // click "Next" button
      await tempPage
        ?.locator("xpath=//span[contains(text(), 'Next')]")
        .click({ timeout: 5000 });

      // select page to type "Seed Phrase"
      let listPage = await browser?.pages();
      let inputSeedPhrasePage: Page | undefined;

      while (true) {
        let isFoundInputSeedPhrasePage = false;
        for (let i = 0; i < (listPage?.length || 0); i++) {
          if (
            listPage?.[i]
              ?.url()
              ?.includes(
                `chrome-extension://${config?.extensionID}/index.html#/import/mnemonics`,
              )
          ) {
            isFoundInputSeedPhrasePage = true;
            inputSeedPhrasePage = listPage?.[i];
          }
        }

        if (isFoundInputSeedPhrasePage) {
          break;
        }

        listPage = browser?.pages();
        await sleep(1000);
        continue;
      }

      // reload page to make sure all element is loaded
      await inputSeedPhrasePage?.reload();
      await sleep(300);

      const seedPhrase = getActualValue(config?.seedPhrase || "", listVariable);
      const listWord = seedPhrase?.split(" ");

      for (let i = 0; i < listWord?.length; i++) {
        await inputSeedPhrasePage
          ?.locator(`.is-mnemonics-input:nth-child(${i + 1}) > input`)
          .pressSequentially(listWord[i], { delay: 150 });
      }

      await sleep(100);
      // click Confirm button
      await inputSeedPhrasePage
        ?.locator("xpath=//span[contains(text(), 'Confirm')]")
        .click({ timeout: 5000 });

      await sleep(500);
      // click select first address wallet add to rabby
      await inputSeedPhrasePage?.locator(`.AddToRabby`).click();

      await sleep(300);
      await inputSeedPhrasePage
        ?.locator("xpath=//span[contains(text(), 'Done')]")
        .click({ timeout: 5000 });

      // go to dashboard to view recently added wallet
      await inputSeedPhrasePage?.goto(
        `chrome-extension://${config?.extensionID}/popup.html#/dashboard`,
        { timeout: DEFAULT_TIMEOUT },
      );

      await sleep(300);
      await inputSeedPhrasePage?.close();
    } else {
      // import Rabby Wallet using "Private key"
      await page?.goto(
        `chrome-extension://${config?.extensionID}/index.html#/no-address`,
        { timeout: DEFAULT_TIMEOUT },
      );

      // reload page to make sure all element is loaded
      await page?.reload();
      await sleep(200);

      // click "Import Private Key"
      await page
        ?.locator("xpath=//div[contains(text(), 'Import Private Key')]")
        .click({ timeout: 5000 });

      // type password
      await page?.locator("#password").fill(password);

      // type confirm pasword
      await sleep(100);
      await page?.locator("#confirmPassword").fill(password);

      // click "Next" button
      await sleep(100);
      await page
        ?.locator("xpath=//span[contains(text(), 'Next')]")
        .click({ timeout: 5000 });

      const privateKey = getActualValue(config?.privateKey || "", listVariable);
      // type "Private Key"
      await page
        ?.locator("#key")
        .pressSequentially(privateKey, { delay: 50, timeout: DEFAULT_TIMEOUT });

      // click "Confirm" button
      await sleep(100);
      await page
        ?.locator("xpath=//span[contains(text(), 'Confirm')]")
        .click({ timeout: 5000 });
      await sleep(100);

      // go to dashboard to view recently added wallet
      await page?.goto(
        `chrome-extension://${config?.extensionID}/popup.html#/dashboard`,
        { timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT },
      );
    }

    return flowProfile;
  };

  unlockWallet = async (
    page: Page,
    config: IUnlockRabbyWalletNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await page?.goto(
      `chrome-extension://${config?.extensionID}/popup.html#/unlock`,
      { timeout: DEFAULT_TIMEOUT },
    );

    // type password
    await sleep(100);
    const password = getActualValue(config?.password || "", listVariable);
    await page
      ?.locator("#password")
      .pressSequentially(password, { delay: 50, timeout: DEFAULT_TIMEOUT });

    // click "Unlock" button
    await sleep(100);
    await page
      ?.locator("xpath=//span[contains(text(), 'Unlock')]")
      .click({ timeout: 5000 });

    return flowProfile;
  };

  connectWallet = async (
    page: Page,
    config: IConnectRabbyWalletNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    if (config?.ignoreWarning) {
      await waitTextAppear("Connect", page); // wait until button appear

      try {
        await page
          ?.locator("xpath=//span[contains(text(), 'Ignore all')]")
          .click({ timeout: 5000 });
        await sleep(300);
      } catch {}
    }

    await sleep(1000);
    await waitAndClickText("Connect", page);

    return flowProfile;
  };

  cancel = async (
    page: Page,
    config: ICancelRabbyWalletNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await waitAndClickText("Cancel", page);
    return flowProfile;
  };

  sign = async (
    page: Page,
    config: ISignRabbyWalletNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await this.signTransaction(config, page, "Sign");
    return flowProfile;
  };

  signTransaction = async (
    config: ISignRabbyWalletNodeConfig,
    page: Page,
    text: string,
  ) => {
    const {
      ignoreWarning,
      isCustomGasLimit,
      gasLimit = 0,
      gasOption,
      gasPrice = 0,
      isCustomGasPrice,
    } = config;
    let isCompleteRender = false;

    if (isCustomGasLimit && gasLimit > 0) {
      if (!isCompleteRender) {
        await waitTextAppear(text, page); // wait until button appear
        isCompleteRender = true;
      }

      try {
        const xPath = "xpath=//span[contains(text(), 'Advanced Settings')]";
        await page?.locator(xPath).click({ timeout: 5000 });
        await sleep(1500);

        await page?.locator(".gas-modal input").waitFor({ timeout: 3000 });
        await page?.locator(".gas-modal input").selectText();
        await page?.keyboard?.press("Backspace");
        await page
          ?.locator(".gas-modal input")
          .pressSequentially(gasLimit?.toString(), { delay: 100 });

        await page
          ?.locator("xpath=//span[contains(text(), 'Confirm')]")
          .click({ timeout: 3000 });
        await sleep(300);
      } catch {}
    }

    if (isCustomGasPrice) {
      // select gas mode
      await page?.locator(".ant-dropdown-trigger").click({ timeout: 3000 });
      await sleep(300);
      if (gasOption === RABBY_GAS_MODE.NORMAL) {
        await page
          ?.locator(
            "xpath=//li[contains(@class, 'ant-dropdown-menu-item')]//div[text()='Normal']",
          )
          .click({ timeout: 3000 });
      } else if (gasOption === RABBY_GAS_MODE.FAST) {
        await page
          ?.locator(
            "xpath=//li[contains(@class, 'ant-dropdown-menu-item')]//div[text()='Fast']",
          )
          .click({ timeout: 3000 });
      } else if (gasOption === RABBY_GAS_MODE.INSTANT) {
        await page
          ?.locator(
            "xpath=//li[contains(@class, 'ant-dropdown-menu-item')]//div[text()='Instant']",
          )
          .click({ timeout: 3000 });
      } else if (gasOption === RABBY_GAS_MODE.CUSTOM && gasPrice > 0) {
        await page
          ?.locator(
            "xpath=//li[contains(@class, 'ant-dropdown-menu-item')]//div[text()='Custom']",
          )
          .click({ timeout: 3000 });
        await sleep(1000);

        await page?.locator(".gas-modal input").waitFor({ timeout: 3000 });
        await page?.locator(".gas-modal input").selectText();
        await page?.keyboard?.press("Backspace");
        await page
          ?.locator(".gas-modal input")
          .pressSequentially(gasPrice?.toString(), { delay: 100 });

        await page
          ?.locator("xpath=//span[contains(text(), 'Confirm')]")
          .click({ timeout: 3000 });
        await sleep(300);
      }
    }

    if (ignoreWarning) {
      if (!isCompleteRender) {
        await waitTextAppear(text, page); // wait until button appear
        isCompleteRender = true;
      }
      try {
        await page
          ?.locator("xpath=//span[contains(text(), 'Ignore all')]")
          .click({ timeout: 5000 });
        await sleep(300);
      } catch {}
    }

    await waitAndClickText(text, page);
    await waitAndClickText("Confirm", page);
  };

  addNetwork = async (
    page: Page,
    config: IRabbyAddNetworkNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await page?.goto(
      `chrome-extension://${config?.extensionID}/popup.html#/custom-testnet`,
      { timeout: DEFAULT_TIMEOUT },
    );

    await sleep(300);
    await page
      ?.locator("xpath=//span[contains(text(), 'Add Custom Network')]")
      .click({ timeout: 3000 });

    if (config?.mode === RABBY_ADD_NETWORK_TYPE.MANUALY) {
      await sleep(100);
      await page?.locator("#id").fill(config?.chainId || "");

      await sleep(100);
      await page?.locator("#name").fill(config?.networkName || "");

      await sleep(100);
      await page?.locator("#rpcUrl").fill(config?.rpcUrl || "");

      await sleep(100);
      await page?.locator("#nativeTokenSymbol").fill(config?.symbol || "");

      await sleep(100);
      await page?.locator("#scanLink").fill(config?.blockExplorer || "");

      await sleep(100);
      await page
        ?.locator("xpath=//span[contains(text(), 'Confirm')]")
        .click({ timeout: 3000 });
    } else if (config?.mode === RABBY_ADD_NETWORK_TYPE.FROM_CHAINLIST) {
      await sleep(100);
      await page
        ?.locator("xpath=//div[contains(text(), 'Quick add from Chainlist')]")
        .click({ timeout: 3000 });

      await sleep(100);
      await page
        ?.locator("input[placeholder='Search custom network name or ID']")
        .fill(config?.chainId || "");

      await sleep(100);
      await page
        ?.locator(`xpath=//span[contains(text(), ${config?.chainId || ""})]`)
        .click({ timeout: 3000 });

      await sleep(100);
      await page
        ?.locator("xpath=//span[contains(text(), 'Confirm')]")
        .click({ timeout: 3000 });
    }

    return flowProfile;
  };
}
