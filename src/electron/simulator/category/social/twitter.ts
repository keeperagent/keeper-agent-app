import { Page } from "puppeteer-core";
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
    const input = await page?.waitForSelector(
      "input[autocomplete='username']",
      {
        timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
      },
    );
    await input?.type(usernameTwitter, { delay: 50 });
    await sleep(1000);

    // Button "Next"
    const nextBtn = await page?.waitForSelector(
      "::-p-xpath(//span[contains(text(), 'Next')])",
      {
        timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
      },
    );
    // @ts-ignore
    await nextBtn?.click();

    await sleep(2000);
    // enter password
    const inputPwd = await page?.waitForSelector("input[name='password']", {
      timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
    });
    await inputPwd?.type(passwordTwitter, { delay: 50 });
    await sleep(1000);

    // Button "Log in"
    const loginBtn = await page?.waitForSelector(
      "::-p-xpath(//span[contains(text(), 'Log in')])",
      {
        timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
      },
    );
    // @ts-ignore
    await loginBtn?.click();
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

    const followButton = await page?.waitForSelector(
      "div[data-testid='placementTracking']",
      { timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT },
    );
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
      await followButton?.click();
    }

    // click to UnFollow
    if (!shouldClickFollow && isFollowing) {
      await followButton?.click();
      await sleep(500);
      const unFollowButton = await page?.waitForSelector(
        "::-p-xpath(//span[text()='Unfollow'])",
        { timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT },
      );
      // @ts-ignore
      await unFollowButton?.click();
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

    const firstLikeButton = await page?.waitForSelector(
      "::-p-xpath((//div[@data-testid='like' or @data-testid='unlike'])[1])",
      { timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT },
    );
    let dataTestId: string | null = ""; // use to check if this tweet is already liked or not
    if (firstLikeButton) {
      dataTestId = await firstLikeButton.evaluate((element) =>
        // @ts-ignore
        element?.getAttribute("data-testid"),
      );
    }

    await sleep(500);
    if (shouldClickLike && dataTestId === "like") {
      const likeButton = await page?.waitForSelector(
        "::-p-xpath(//article//div[@data-testid='like'][1])",
        { timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT },
      );
      // @ts-ignore
      await likeButton?.click();
    }

    if (!shouldClickLike && dataTestId === "unlike") {
      const unLikeButton = await page?.waitForSelector(
        "::-p-xpath(//article//div[@data-testid='unlike'][1])",
        { timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT },
      );
      // @ts-ignore
      await unLikeButton?.click();
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

    const firstRetweetButton = await page?.waitForSelector(
      "::-p-xpath((//div[@data-testid='retweet' or @data-testid='unretweet'])[1])",
      { timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT },
    );
    let dataTestId: string | null = ""; // use to check if this tweet is already re-tweet or not
    if (firstRetweetButton) {
      dataTestId = await firstRetweetButton.evaluate((element) =>
        // @ts-ignore
        element?.getAttribute("data-testid"),
      );
    }

    await sleep(500);
    if (action === RETEET_TWITTER_ACTION.RETWEET && dataTestId === "retweet") {
      const likeButton = await page?.waitForSelector(
        "::-p-xpath(//article//div[@data-testid='retweet'][1])",
        { timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT },
      );
      // @ts-ignore
      await likeButton?.click();

      await sleep(500);
      const confirmButton = await page?.waitForSelector(
        "::-p-xpath(//div[@data-testid='retweetConfirm'])",
        { timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT },
      );
      // @ts-ignore
      await confirmButton?.click();
    }

    if (
      action === RETEET_TWITTER_ACTION.UNDO_RETWEET &&
      dataTestId === "unretweet"
    ) {
      const unLikeButton = await page?.waitForSelector(
        "::-p-xpath(//article//div[@data-testid='unretweet'][1])",
        { timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT },
      );
      // @ts-ignore
      await unLikeButton?.click();

      await sleep(500);
      const confirmButton = await page?.waitForSelector(
        "::-p-xpath(//div[@data-testid='unretweetConfirm'])",
        { timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT },
      );
      // @ts-ignore
      await confirmButton?.click();
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
    const input = await page?.waitForSelector(
      "label[data-testid='tweetTextarea_0_label']",
      {
        timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT,
      },
    );
    await input?.click();

    await sleep(300);
    await page?.type("br[data-text='true']", comment, { delay: 10 });
    await sleep(300);

    const replyButton = await page?.waitForSelector(
      "::-p-xpath(//span[contains(text(), 'Reply')])",
      { timeout: config?.timeout! * 1000 || DEFAULT_TIMEOUT },
    );
    // @ts-ignore
    await replyButton?.click();
    await sleep(500);

    return flowProfile;
  };
}
