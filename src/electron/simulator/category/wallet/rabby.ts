import { Page, Browser } from "puppeteer-core";
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
    browser: Browser | null,
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
      const importSeedPhrase = await tempPage?.waitForSelector(
        "::-p-xpath(//div[contains(text(), 'Import Seed Phrase')])",
        { timeout: 5000 },
      );
      // @ts-ignore
      importSeedPhrase?.click();

      await sleep(100);
      const inputPassword = await tempPage?.waitForSelector("#password");
      await inputPassword?.type(password);

      await sleep(100);
      const inputConfirmPassword =
        await tempPage?.waitForSelector("#confirmPassword");
      await inputConfirmPassword?.type(password);

      await sleep(100);
      // click "Next" button
      const nextButton = await tempPage?.waitForSelector(
        "::-p-xpath(//span[contains(text(), 'Next')])",
        { timeout: 5000 },
      );
      // @ts-ignore
      nextButton?.click();

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

        listPage = await browser?.pages();
        await sleep(1000);
        continue;
      }

      // reload page to make sure all element is loaded
      await inputSeedPhrasePage?.reload();
      await sleep(300);

      const seedPhrase = getActualValue(config?.seedPhrase || "", listVariable);
      const listWord = seedPhrase?.split(" ");

      for (let i = 0; i < listWord?.length; i++) {
        const input = await inputSeedPhrasePage?.waitForSelector(
          `.is-mnemonics-input:nth-child(${i + 1}) > input`,
        );
        await input?.type(listWord[i], { delay: 150 });
      }

      await sleep(100);
      // click Confirm button
      const confirmButton = await inputSeedPhrasePage?.waitForSelector(
        "::-p-xpath(//span[contains(text(), 'Confirm')])",
        { timeout: 5000 },
      );
      // @ts-ignore
      confirmButton?.click();

      await sleep(500);
      // click select first address wallet add to rabby
      const selectAddressButton =
        await inputSeedPhrasePage?.waitForSelector(`.AddToRabby`);
      selectAddressButton?.click();

      await sleep(300);
      const doneButton = await inputSeedPhrasePage?.waitForSelector(
        "::-p-xpath(//span[contains(text(), 'Done')])",
        { timeout: 5000 },
      );
      // @ts-ignore
      doneButton?.click();

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
      const importPrivateKeyButton = await page?.waitForSelector(
        "::-p-xpath(//div[contains(text(), 'Import Private Key')])",
        { timeout: 5000 },
      );
      // @ts-ignore
      importPrivateKeyButton?.click();

      // type password
      const inputPassword = await page?.waitForSelector("#password");
      await inputPassword?.type(password);

      // type confirm pasword
      await sleep(100);
      const inputConfirmPassword =
        await page?.waitForSelector("#confirmPassword");
      await inputConfirmPassword?.type(password);

      // click "Next" button
      await sleep(100);
      const nextButton = await page?.waitForSelector(
        "::-p-xpath(//span[contains(text(), 'Next')])",
        { timeout: 5000 },
      );
      // @ts-ignore
      nextButton?.click();

      const privateKey = getActualValue(config?.privateKey || "", listVariable);
      // type "Private Key"
      const privateKeyInput = await page?.waitForSelector("#key", {
        timeout: DEFAULT_TIMEOUT,
      });
      await privateKeyInput?.type(privateKey);

      // click "Confirm" button
      await sleep(100);
      const confirmButton = await page?.waitForSelector(
        "::-p-xpath(//span[contains(text(), 'Confirm')])",
        { timeout: 5000 },
      );
      // @ts-ignore
      confirmButton?.click();
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
    const passwordInput = await page?.waitForSelector("#password", {
      timeout: DEFAULT_TIMEOUT,
    });

    await sleep(100);
    const password = getActualValue(config?.password || "", listVariable);
    await passwordInput?.type(password);

    // click "Unlock" button
    await sleep(100);
    const unlockButton = await page?.waitForSelector(
      "::-p-xpath(//span[contains(text(), 'Unlock')])",
      { timeout: 5000 },
    );
    // @ts-ignore
    unlockButton?.click();

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
        const element = await page?.waitForSelector(
          "::-p-xpath(//span[contains(text(), 'Ignore all')])",
          { timeout: 5000 },
        );
        // @ts-ignore
        await element?.click();
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
        const xPath =
          "::-p-xpath(//span[contains(text(), 'Advanced Settings')])";
        const element = await page?.waitForSelector(xPath, { timeout: 5000 });
        // @ts-ignore
        await element?.click();
        await sleep(1500);

        const inputElement = await page?.waitForSelector(".gas-modal input", {
          timeout: 3000,
        });
        await inputElement?.click({ clickCount: 3 });
        await page?.keyboard?.press("Backspace");
        await inputElement?.type(gasLimit?.toString(), { delay: 100 });

        const confirmButton = await page?.waitForSelector(
          "::-p-xpath(//span[contains(text(), 'Confirm')])",
          { timeout: 3000 },
        );
        // @ts-ignore
        await confirmButton?.click();
        await sleep(300);
      } catch {
        // just ignore error
      }
    }

    if (isCustomGasPrice) {
      // select gas mode
      const gasModeElement = await page?.waitForSelector(
        ".ant-dropdown-trigger",
        {
          timeout: 3000,
        },
      );
      await gasModeElement?.click();
      await sleep(300);
      if (gasOption === RABBY_GAS_MODE.NORMAL) {
        const normalButton = await page?.waitForSelector(
          "::-p-xpath(//li[contains(@class, 'ant-dropdown-menu-item')]//div[text()='Normal'])",
          { timeout: 3000 },
        );
        // @ts-ignore
        await normalButton?.click();
      } else if (gasOption === RABBY_GAS_MODE.FAST) {
        const fastButton = await page?.waitForSelector(
          "::-p-xpath(//li[contains(@class, 'ant-dropdown-menu-item')]//div[text()='Fast'])",
          { timeout: 3000 },
        );
        // @ts-ignore
        await fastButton?.click();
      } else if (gasOption === RABBY_GAS_MODE.INSTANT) {
        const instantButton = await page?.waitForSelector(
          "::-p-xpath(//li[contains(@class, 'ant-dropdown-menu-item')]//div[text()='Instant'])",
          { timeout: 3000 },
        );
        // @ts-ignore
        await instantButton?.click();
      } else if (gasOption === RABBY_GAS_MODE.CUSTOM && gasPrice > 0) {
        const customButton = await page?.waitForSelector(
          "::-p-xpath(//li[contains(@class, 'ant-dropdown-menu-item')]//div[text()='Custom'])",
          { timeout: 3000 },
        );
        // @ts-ignore
        await customButton?.click();
        await sleep(1000);

        const inputElement = await page?.waitForSelector(".gas-modal input", {
          timeout: 3000,
        });
        await inputElement?.click({ clickCount: 3 });
        await page?.keyboard?.press("Backspace");
        await inputElement?.type(gasPrice?.toString(), { delay: 100 });

        const confirmButton = await page?.waitForSelector(
          "::-p-xpath(//span[contains(text(), 'Confirm')])",
          { timeout: 3000 },
        );
        // @ts-ignore
        await confirmButton?.click();
        await sleep(300);
      }
    }

    if (ignoreWarning) {
      if (!isCompleteRender) {
        await waitTextAppear(text, page); // wait until button appear
        isCompleteRender = true;
      }
      try {
        const element = await page?.waitForSelector(
          "::-p-xpath(//span[contains(text(), 'Ignore all')])",
          { timeout: 5000 },
        );
        // @ts-ignore
        await element?.click();
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
    const addNetworkButton = await page?.waitForSelector(
      "::-p-xpath(//span[contains(text(), 'Add Custom Network')])",
      { timeout: 3000 },
    );
    // @ts-ignore
    await addNetworkButton?.click();

    if (config?.mode === RABBY_ADD_NETWORK_TYPE.MANUALY) {
      await sleep(100);
      const inputChainId = await page?.waitForSelector("#id");
      await inputChainId?.type(config?.chainId || "");

      await sleep(100);
      const inputNetworkName = await page?.waitForSelector("#name");
      await inputNetworkName?.type(config?.networkName || "");

      await sleep(100);
      const inputRpcUrl = await page?.waitForSelector("#rpcUrl");
      await inputRpcUrl?.type(config?.rpcUrl || "");

      await sleep(100);
      const inputNativeToken =
        await page?.waitForSelector("#nativeTokenSymbol");
      await inputNativeToken?.type(config?.symbol || "");

      await sleep(100);
      const inputBlockExplorer = await page?.waitForSelector("#scanLink");
      await inputBlockExplorer?.type(config?.blockExplorer || "");

      await sleep(100);
      const confirmButton = await page?.waitForSelector(
        "::-p-xpath(//span[contains(text(), 'Confirm')])",
        { timeout: 3000 },
      );
      // @ts-ignore
      await confirmButton?.click();
    } else if (config?.mode === RABBY_ADD_NETWORK_TYPE.FROM_CHAINLIST) {
      await sleep(100);
      const chainListButton = await page?.waitForSelector(
        "::-p-xpath(//div[contains(text(), 'Quick add from Chainlist')])",
        { timeout: 3000 },
      );
      // @ts-ignore
      await chainListButton?.click();

      await sleep(100);
      const inputChainId = await page?.waitForSelector(
        "input[placeholder='Search custom network name or ID']",
      );
      await inputChainId?.type(config?.chainId || "");

      await sleep(100);
      const chainButton = await page?.waitForSelector(
        `::-p-xpath(//span[contains(text(), ${config?.chainId || ""})])`,
        { timeout: 3000 },
      );
      // @ts-ignore
      await chainButton?.click();

      await sleep(100);
      const confirmButton = await page?.waitForSelector(
        "::-p-xpath(//span[contains(text(), 'Confirm')])",
        { timeout: 3000 },
      );
      // @ts-ignore
      await confirmButton?.click();
    }

    return flowProfile;
  };
}
