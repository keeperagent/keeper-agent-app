import qs from "qs";
import { Page } from "playwright-core";
import axios from "axios";
import { preferenceDB } from "@/electron/database/preference";
import { logEveryWhere, sleep } from "./util";

export const CAPTCHA_METHOD = {
  RECAPTCHAV2: "userrecaptcha",
  HCAPTCHA: "hcaptcha",
  CLOUDFARE_TURNSTILE: "turnstile",
};

const STATUS_CODE = {
  CAPCHA_NOT_READY: "CAPCHA_NOT_READY",
  ERROR_CAPTCHA_UNSOLVABLE: "ERROR_CAPTCHA_UNSOLVABLE",
};

const api = axios.create({
  baseURL: "http://2captcha.com",
  timeout: 30000,
});

/*
Reference: 
  https://2captcha.com/2captcha-api#solving_recaptchav2_new
 */
const solveCaptcha = async (
  page: Page,
  method: string,
  twoCaptchaAPIKey: string,
  timeout: number,
): Promise<Error | null> => {
  try {
    let captchaKey = null;
    let requestKeyFormat = "";
    if (method === CAPTCHA_METHOD.RECAPTCHAV2) {
      requestKeyFormat = "googlekey";
      [captchaKey] = await getReCaptchaV2Key(page);
    } else if (method === CAPTCHA_METHOD.HCAPTCHA) {
      requestKeyFormat = "sitekey";
      [captchaKey] = await getHCaptchaV2Key(page);
    } else if (method === CAPTCHA_METHOD.CLOUDFARE_TURNSTILE) {
      requestKeyFormat = "sitekey";
      [captchaKey] = await getCloudfareCaptchaKey(page);
    }

    if (captchaKey === null) {
      return Error("captchaKey not found");
    }

    const res = await api.get(
      `/in.php?key=${twoCaptchaAPIKey}&method=${method}&${requestKeyFormat}=${captchaKey}&pageurl=${page?.url()}&json=1`,
    );
    const captchaID = res?.data?.request;
    logEveryWhere({ message: `Captcha ID: ${captchaID}` });
    if (!captchaID) {
      return Error("captchaID not found");
    }

    const [token, err] = await getCaptchaToken(
      captchaID,
      twoCaptchaAPIKey,
      timeout,
    );
    if (err !== null) {
      return err;
    }
    logEveryWhere({ message: `Captcha token: ${token}` });
    if (!token || token === STATUS_CODE.ERROR_CAPTCHA_UNSOLVABLE) {
      return Error(STATUS_CODE.ERROR_CAPTCHA_UNSOLVABLE);
    }

    // fill response from 2Captcha into actual captcha on the website
    if (method === CAPTCHA_METHOD.RECAPTCHAV2) {
      await page.evaluate((token) => {
        const element = document.getElementById("g-recaptcha-response");
        if (element) {
          element.innerHTML = token;
        }
      }, token);
      await sleep(1 * 1000);
    } else if (method === CAPTCHA_METHOD.HCAPTCHA) {
      await page.evaluate((token) => {
        let element = document.querySelector(
          "textarea[name='g-recaptcha-response']",
        );
        if (element) {
          element.innerHTML = token;
        }

        if (!element) {
          element = document.querySelector(
            "textarea[name='h-recaptcha-response']",
          );
          if (element) {
            element.innerHTML = token;
          }
        }
      }, token);
      await sleep(1000);
      await page.locator("#checkbox").click();
    } else if (method === CAPTCHA_METHOD.CLOUDFARE_TURNSTILE) {
      await page.evaluate((token) => {
        let element = document.querySelector(
          "input[name='cf-turnstile-response']",
        );
        element?.setAttribute("value", token);

        element = document.querySelector("input[name='g-recaptcha-response']");
        element?.setAttribute("value", token);

        element = document.querySelector("input[name='cfToken']");
        element?.setAttribute("value", token);
      }, token);

      await sleep(1 * 1000);
    }

    return null;
  } catch (err: any) {
    logEveryWhere({ message: `solveCaptcha() error: ${err?.message}` });
    return err;
  }
};

const getReCaptchaV2Key = async (
  page: Page,
): Promise<[string | null, Error | null]> => {
  try {
    const captchaFrame = await page.waitForSelector(
      "iframe[title='reCAPTCHA']",
      { timeout: 7000 },
    );
    const captchaSrc = await captchaFrame?.getAttribute("src");
    if (!captchaSrc) {
      return [null, Error("@captchaSrc not found")];
    }

    const { k } = qs.parse(captchaSrc);
    if (!k) {
      return [null, Error("@k not found")];
    }

    return [k?.toString(), null];
  } catch (err: any) {
    logEveryWhere({ message: `getReCaptchaV2Key() error: ${err?.message}` });
    return [null, err];
  }
};

const getHCaptchaV2Key = async (
  page: Page,
): Promise<[string | null, Error | null]> => {
  try {
    const captchaFrame = await page.waitForSelector("iframe[src*='sitekey']", {
      timeout: 7000,
    });
    const captchaSrc = await captchaFrame?.getAttribute("src");
    if (!captchaSrc) {
      return [null, Error("@captchaSrc not found")];
    }

    const { sitekey } = qs.parse(captchaSrc);
    if (!sitekey) {
      return [null, Error("@k not found")];
    }

    return [sitekey?.toString(), null];
  } catch (err: any) {
    logEveryWhere({ message: `getHCaptchaV2Key() error: ${err?.message}` });
    return [null, err];
  }
};

const getCloudfareCaptchaKey = async (
  page: Page,
): Promise<[string | null, Error | null]> => {
  try {
    const captchaKey = await page
      ?.locator("div.cf-turnstile")
      .getAttribute("data-sitekey");
    if (!captchaKey) {
      return [null, Error("src of iframe not found")];
    }
    logEveryWhere({ message: `Captcha key: ${captchaKey}` });
    return [captchaKey, null];
  } catch (err: any) {
    logEveryWhere({
      message: `getCloudfareCaptchaKey() error: ${err?.message}`,
    });
    return [null, err];
  }
};

const getCaptchaToken = async (
  captchaID: number,
  twoCaptchaAPIKey: string,
  timeout: number,
): Promise<[string | null, Error | null]> => {
  try {
    const startTime = new Date().getTime();
    let token = null;
    let step = 0;
    while (true) {
      let currentTime = new Date().getTime();
      if (currentTime - startTime > timeout) {
        return [null, Error("solve captcha timeout")];
      }

      const [preference] = await preferenceDB.getOnePreference();
      if (!preference) {
        return [null, Error("API key not found")];
      }

      const res = await api.get(
        `/res.php?key=${twoCaptchaAPIKey}&action=get&id=${captchaID}&json=1`,
      );
      if (step !== 0) {
        logEveryWhere({
          message: `Rerun getCaptchaToken() ${step} times, response: ${res?.data}`,
        });
      }
      await sleep(4000);

      currentTime = new Date().getTime();
      if (currentTime - startTime > timeout) {
        return [null, Error("solve captcha timeout")];
      }

      if (res?.data?.request === STATUS_CODE.CAPCHA_NOT_READY) {
        step += 1;
        continue;
      }

      token = res?.data?.request;
      break;
    }

    return [token, null];
  } catch (err: any) {
    logEveryWhere({ message: `getCaptchaToken() error: ${err?.message}` });
    return [null, err];
  }
};

export { solveCaptcha };
