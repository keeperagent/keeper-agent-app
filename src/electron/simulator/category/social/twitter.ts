import { Page } from "playwright-core";
import {
  IFlowProfile,
  IFollowTwitterNodeConfig,
  ILikeTwitterNodeConfig,
  ILoginTwitterNodeConfig,
  IReTweetTwitterNodeConfig,
  IReplyTweetTwitterNodeConfig,
  IWorkflowVariable,
} from "@/electron/type";
import { DEFAULT_TIMEOUT } from "@/electron/simulator/constant";
import {
  sleep,
  processSkipSetting,
  getActualValue,
} from "@/electron/simulator/util";
import {
  FOLLOW_TWITTER_ACTION,
  LIKE_TWITTER_ACTION,
  RETEET_TWITTER_ACTION,
} from "@/electron/constant";

export class Twitter {
  loginTwitter = async (
    page: Page,
    config: ILoginTwitterNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    await page?.goto("https://twitter.com/i/flow/login", {
      timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
    });
    await sleep(1000);
    const { username = "", password = "" } = config;

    const usernameTwitter = getActualValue(username, listVariable);
    const passwordTwitter = getActualValue(password, listVariable);

    // enter user name
    await page
      ?.locator("input[autocomplete='username']")
      .pressSequentially(usernameTwitter, {
        delay: 50,
        timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
      });
    await sleep(1000);

    // Button "Next"
    await page
      ?.locator("xpath=//span[contains(text(), 'Next')]")
      .click({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });

    await sleep(2000);
    // enter password
    await page
      ?.locator("input[name='password']")
      .pressSequentially(passwordTwitter, {
        delay: 50,
        timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
      });
    await sleep(1000);

    // Button "Log in"
    await page
      ?.locator("xpath=//span[contains(text(), 'Log in')]")
      .click({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });
    await sleep(1000);

    return flowProfile;
  };

  followAccount = async (
    page: Page,
    config: IFollowTwitterNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }
    const accountUrl = getActualValue(config?.accountUrl || "", listVariable);

    await page?.goto(accountUrl, {
      timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
    });
    const { action } = config;
    const shouldClickFollow = action === FOLLOW_TWITTER_ACTION.FOLLOW;

    await page
      ?.locator("div[data-testid='placementTracking']")
      .waitFor({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });
    const isFollowing = await page.evaluate(() => {
      const followButton = document.querySelector(
        "div[data-testid='placementTracking']",
      );
      const text = (followButton as HTMLDivElement)?.innerText;
      const isFollowing = text === "Following";
      return isFollowing;
    });
    await page.hover("div[data-testid='placementTracking']"); // hover to get Unfollow button appear
    await sleep(500);

    // click to Follow
    if (shouldClickFollow && !isFollowing) {
      await page?.locator("div[data-testid='placementTracking']").click();
    }

    // click to UnFollow
    if (!shouldClickFollow && isFollowing) {
      await page?.locator("div[data-testid='placementTracking']").click();
      await sleep(500);
      await page
        ?.locator("xpath=//span[text()='Unfollow']")
        .click({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });
      await sleep(500);
      await page.reload();
    }

    return flowProfile;
  };

  likeTweet = async (
    page: Page,
    config: ILikeTwitterNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }
    const tweetUrl = getActualValue(config?.tweetUrl || "", listVariable);

    await page?.goto(tweetUrl, {
      timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
    });
    const { action } = config;
    const shouldClickLike = action === LIKE_TWITTER_ACTION.LIKE;

    await page
      ?.locator(
        "xpath=(//div[@data-testid='like' or @data-testid='unlike'])[1]",
      )
      .waitFor({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });
    let dataTestId: string | null = ""; // use to check if this tweet is already liked or not
    dataTestId = await page
      ?.locator(
        "xpath=(//div[@data-testid='like' or @data-testid='unlike'])[1]",
      )
      .getAttribute("data-testid");

    await sleep(500);
    if (shouldClickLike && dataTestId === "like") {
      await page
        ?.locator("xpath=//article//div[@data-testid='like'][1]")
        .click({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });
    }

    if (!shouldClickLike && dataTestId === "unlike") {
      await page
        ?.locator("xpath=//article//div[@data-testid='unlike'][1]")
        .click({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });
    }

    await sleep(500);
    return flowProfile;
  };

  reTweet = async (
    page: Page,
    config: IReTweetTwitterNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }
    const tweetUrl = getActualValue(config?.tweetUrl || "", listVariable);

    await page?.goto(tweetUrl, {
      timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
    });
    const { action } = config;

    await page
      ?.locator(
        "xpath=(//div[@data-testid='retweet' or @data-testid='unretweet'])[1]",
      )
      .waitFor({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });
    let dataTestId: string | null = ""; // use to check if this tweet is already re-tweet or not
    dataTestId = await page
      ?.locator(
        "xpath=(//div[@data-testid='retweet' or @data-testid='unretweet'])[1]",
      )
      .getAttribute("data-testid");

    await sleep(500);
    if (action === RETEET_TWITTER_ACTION.RETWEET && dataTestId === "retweet") {
      await page
        ?.locator("xpath=//article//div[@data-testid='retweet'][1]")
        .click({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });

      await sleep(500);
      await page
        ?.locator("xpath=//div[@data-testid='retweetConfirm']")
        .click({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });
    }

    if (
      action === RETEET_TWITTER_ACTION.UNDO_RETWEET &&
      dataTestId === "unretweet"
    ) {
      await page
        ?.locator("xpath=//article//div[@data-testid='unretweet'][1]")
        .click({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });

      await sleep(500);
      await page
        ?.locator("xpath=//div[@data-testid='unretweetConfirm']")
        .click({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });
    }

    await sleep(500);
    return flowProfile;
  };

  replyTweet = async (
    page: Page,
    config: IReplyTweetTwitterNodeConfig,
    listVariable: IWorkflowVariable[],
    flowProfile: IFlowProfile,
  ): Promise<IFlowProfile | null> => {
    if (processSkipSetting(config, listVariable)) {
      return flowProfile;
    }

    const tweetUrl = getActualValue(config?.tweetUrl || "", listVariable);
    const comment = getActualValue(config?.comment || "", listVariable);
    await page?.goto(tweetUrl, {
      timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
    });

    await sleep(500);
    await page
      ?.locator("label[data-testid='tweetTextarea_0_label']")
      .click({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });

    await sleep(300);
    await page
      ?.locator("br[data-text='true']")
      .pressSequentially(comment, { delay: 10 });
    await sleep(300);

    await page
      ?.locator("xpath=//span[contains(text(), 'Reply')]")
      .click({ timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT });
    await sleep(500);

    return flowProfile;
  };
}
