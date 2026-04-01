import { Page, BrowserContext } from "playwright-core";
import { executeInSandbox } from "@/electron/simulator/sandbox";
import { app, screen } from "electron";
import _ from "lodash";
import { DEFAULT_EXTENSION_TIMEOUT, TEMP_PROFILENAME } from "./constant";
import {
  BASE_PROFILE_FOLDER,
  PROFILE_FOLDER,
  COMPARISION_EXPRESSION,
} from "@/electron/constant";
import { IWorkflowVariable, INodeConfig, ISkipSetting } from "@/electron/type";

export interface ISimulator {
  browser: BrowserContext | null;
  listPage: Page[];
  currentPageIndex: number | null;
  isCreateNewFolder: boolean; // is profile is created with new folder
  browserProcessId: number | null;
}

export const getProfilePath = (profileName: string) =>
  `${app.getPath("userData")}/${PROFILE_FOLDER}/${profileName}`;

export const getBaseProfilePath = () =>
  `${app.getPath("userData")}/${PROFILE_FOLDER}/${BASE_PROFILE_FOLDER}`;

export const getProfileNameForThread = (threadID: string) =>
  `${TEMP_PROFILENAME}_${threadID}`;

export const sleep = async (millisecond: number) => {
  return new Promise((resolve) => setTimeout(resolve, millisecond));
};

export const getActualValue = (
  value: string,
  listVariable: IWorkflowVariable[],
): string => {
  let actualValue = value;
  listVariable?.forEach((variable) => {
    const variableFormat = `{{${variable?.variable}}}`;
    actualValue = actualValue.replaceAll(variableFormat, variable?.value || "");
  });

  return actualValue;
};

export const updateVariable = (
  listVariable: IWorkflowVariable[],
  variable: IWorkflowVariable,
): IWorkflowVariable[] => {
  const newListVariable = listVariable;

  const oldVariable = _.find(newListVariable, {
    variable: variable?.variable,
  });
  if (oldVariable) {
    const newVariable: IWorkflowVariable = {
      ...oldVariable,
      value: variable?.value,
    };
    const indexOfVariable = _.findIndex(newListVariable, {
      variable: variable?.variable,
    });
    newListVariable.splice(indexOfVariable, 1, newVariable);
  } else {
    newListVariable.push({
      value: variable?.value,
      variable: variable?.variable!,
    });
  }

  return newListVariable;
};

export const calculateWindowPositions = (
  screenWidth: number,
  screenHeight: number,
  pageWidth: number,
  pageHeight: number,
  totalScreen: number,
): { [threadID: string]: { x: number; y: number } } => {
  if (pageWidth > screenWidth) {
    pageWidth = screenWidth;
  }
  if (pageHeight > screenHeight) {
    pageHeight = screenHeight;
  }

  let extraYOffset = 40;
  let yOffset = pageHeight;

  const numberOfColumn = Math.floor(screenWidth / pageWidth);
  const numberOfRow = Math.ceil(totalScreen / numberOfColumn);
  let isFitScreen = true; // is all window fit to screen or not
  if ((pageHeight + extraYOffset) * numberOfRow > screenHeight) {
    isFitScreen = false;
    extraYOffset = 0;
    yOffset = Math.round(screenHeight / numberOfRow); // dont use @pageHeight to calculate y offet
  }

  const positions: { [threadID: string]: { x: number; y: number } } = {};
  let x = 0;
  let y = 0;

  for (let i = 0; i < totalScreen; i++) {
    positions[i] = {
      x,
      y,
    };

    if ((i + 1) % numberOfColumn === 0) {
      x = 0;

      if (isFitScreen) {
        y += pageHeight + 40;
      } else {
        y += yOffset;
      }
    } else {
      x += pageWidth;
    }
  }

  return positions;
};

export const getDeviceSize = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  return { width, height };
};

const checkShouldSkipNode = (
  listVariable: IWorkflowVariable[],
  skipSetting?: ISkipSetting,
): [boolean, Error | null] => {
  if (!skipSetting || !skipSetting?.isSkip) {
    return [false, null];
  }

  let { leftSide = "", condition, rightSide = "" } = skipSetting;
  if (!condition) {
    return [false, Error("missing config condition")];
  }

  leftSide = getActualValue(leftSide, listVariable);
  rightSide = getActualValue(rightSide, listVariable);

  let isConditionSuccess = false;
  if (condition === COMPARISION_EXPRESSION.EQUAL) {
    if (leftSide === rightSide) {
      isConditionSuccess = true;
    }
  } else if (condition === COMPARISION_EXPRESSION.LARGER) {
    if (leftSide > rightSide) {
      isConditionSuccess = true;
    }
  } else if (condition === COMPARISION_EXPRESSION.SMALLER) {
    if (leftSide < rightSide) {
      isConditionSuccess = true;
    }
  } else if (condition === COMPARISION_EXPRESSION.NOT_EQUAL) {
    if (leftSide !== rightSide) {
      isConditionSuccess = true;
    }
  }

  return [isConditionSuccess, null];
};
export const processSkipSetting = (
  config: INodeConfig,
  listVariable: IWorkflowVariable[],
): boolean => {
  const { skipSetting } = config;
  const [shouldSkip, error] = checkShouldSkipNode(listVariable, skipSetting);
  if (error) {
    throw error;
  }

  return shouldSkip;
};

export const waitAndClickText = async (
  text: string,
  page?: Page,
  elementTag?: string,
): Promise<boolean> => {
  const startTime = Date.now();
  while (true) {
    if (Date.now() - startTime > DEFAULT_EXTENSION_TIMEOUT) {
      return false;
    }

    const isFound = await page?.evaluate(
      ({
        text,
        elementTag,
      }: {
        text: string;
        elementTag: string | undefined;
      }) => {
        const buttons = Array.from(
          document.querySelectorAll(elementTag || "button"),
        );
        const button = buttons.find(
          (button) => (button as HTMLElement)?.innerText === text,
        );
        if (button) {
          (button as HTMLElement)?.click();
          return true;
        }

        return false;
      },
      { text, elementTag },
    );

    if (!isFound) {
      await sleep(500);
      continue;
    }

    await sleep(500);
    return true;
  }
};

export const waitTextAppear = async (text: string, page?: Page) => {
  while (true) {
    const isFound = await page?.evaluate((text) => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const button = buttons.find((button) =>
        button?.innerText?.includes(text),
      );
      if (button) {
        return true;
      }

      return false;
    }, text);

    if (!isFound) {
      await sleep(500);
      continue;
    }

    await sleep(500);
    break;
  }
};

export const sendWithTimeout = async (
  funcPromise: Promise<any> | undefined,
  timeout: number,
): Promise<any> => {
  // Use Promise.race to implement a timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(Error("Timeout")), timeout),
  );

  return Promise.race([funcPromise, timeoutPromise]);
};

export const executeCodeWithVariable = async (
  code: string,
  listVariable: IWorkflowVariable[],
  timeout?: number,
): Promise<[any, Error | null]> => {
  const variables = listVariable
    .filter((variable) => variable?.variable)
    .map((variable) => {
      let value: any = "";
      try {
        value = JSON.parse(variable?.value);
      } catch {
        value = variable?.value;
      }
      return { name: variable.variable!, value };
    });

  let [result, err] = await executeInSandbox(code, variables, { timeout });
  if (err) {
    return [null, err];
  }

  if (typeof result === "object") {
    result = JSON.stringify(result, null, 4);
  } else if (result === "undefined" || result === "null") {
    result = String(null);
  }

  return [result, null];
};
