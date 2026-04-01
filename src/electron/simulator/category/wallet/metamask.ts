import { Page } from "playwright-core";
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
    await page?.locator("input[id='onboarding__terms-checkbox']").click();

    // click Import an exist wallet button
    await sleep(100);
    await page
      ?.locator("button[data-testid='onboarding-import-wallet']")
      .click();

    // go to next page
    await sleep(100);
    await page?.locator("button[data-testid='metametrics-no-thanks']").click();

    const seedPhrase = getActualValue(config?.seedPhrase || "", listVariable);
    const password = getActualValue(config?.password || "", listVariable);
    const listWord = seedPhrase?.split(" ");

    // type phrase into input
    for (let i = 0; i < listWord?.length; i++) {
      await page?.locator(`#import-srp__srp-word-${i}`).fill(listWord[i]);
    }

    await sleep(100);
    await page?.locator("button[data-testid='import-srp-confirm']").click();

    // go to next page
    // type password
    await sleep(100);
    await page
      ?.locator("input[data-testid='create-password-new']")
      .fill(password);

    // type confirm password
    await page
      ?.locator("input[data-testid='create-password-confirm']")
      .fill(password);

    // click check box
    await sleep(100);
    await page?.locator("input[data-testid='create-password-terms']").click();

    // click Create Wallet button
    await sleep(100);
    await page?.locator("button[data-testid='create-password-import']").click();

    // go to next page
    // Click "Got it" button
    await sleep(1000);
    await page
      ?.locator("button[data-testid='onboarding-complete-done']")
      .click();

    // Click "Next" button
    await sleep(1000);
    await page?.locator("button[data-testid='pin-extension-next']").click();

    // Click "Done" button
    await sleep(1000);
    await page?.locator("button[data-testid='pin-extension-done']").click();

    // go to next page
    await page?.goto(`chrome-extension://${config?.extensionID}/home.html#`);

    // Close Popup
    try {
      await sleep(300);
      await page?.locator("button[data-testid='popover-close']").click();
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
    const password = getActualValue(config?.password || "", listVariable);
    await page
      ?.locator("input[data-testid='unlock-password']")
      .pressSequentially(password, {
        delay: 50,
        timeout: config?.timeout! * 3000 || DEFAULT_TIMEOUT,
      });

    // click Unlock button
    await sleep(100);
    await page?.locator("button[data-testid='unlock-submit']").click();
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
