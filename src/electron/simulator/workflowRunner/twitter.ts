import {
  IFlowProfile,
  IFollowTwitterNodeConfig,
  ILikeTwitterNodeConfig,
  ILoginTwitterNodeConfig,
  IReTweetTwitterNodeConfig,
  IReplyTweetTwitterNodeConfig,
} from "@/electron/type";
import { Twitter } from "@/electron/simulator/category/social/twitter";
import { WORKFLOW_TYPE } from "@/electron/constant";
import { WorkflowRunnerArgs, NodeHandler } from "./index";
import { ThreadManager } from "./threadManager";

export class TwitterWorkflow {
  threadManager: ThreadManager;
  private twitter: Twitter;

  constructor({ threadManager }: WorkflowRunnerArgs) {
    this.threadManager = threadManager;
    this.twitter = new Twitter();
  }

  loginTwitter = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<ILoginTwitterNodeConfig>({
      flowProfile,
      taskFn: this.twitter.loginTwitter,
      timeout:
        ((flowProfile?.config as ILoginTwitterNodeConfig)?.timeout || 0) * 1000,
      taskName: "loginTwitter",
    });
  };

  followTwitter = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IFollowTwitterNodeConfig>({
      flowProfile,
      taskFn: this.twitter.followAccount,
      timeout:
        ((flowProfile?.config as IFollowTwitterNodeConfig)?.timeout || 0) *
        1000,
      taskName: "followTwitter",
    });
  };

  likeTweet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<ILikeTwitterNodeConfig>({
      flowProfile,
      taskFn: this.twitter.likeTweet,
      timeout:
        ((flowProfile?.config as ILikeTwitterNodeConfig)?.timeout || 0) * 1000,
      taskName: "likeTweet",
    });
  };

  reTweet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IReTweetTwitterNodeConfig>({
      flowProfile,
      taskFn: this.twitter.reTweet,
      timeout:
        ((flowProfile?.config as IReTweetTwitterNodeConfig)?.timeout || 0) *
        1000,
      taskName: "reTweet",
    });
  };

  replyTweet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    return this.threadManager.runNormalTask<IReplyTweetTwitterNodeConfig>({
      flowProfile,
      taskFn: this.twitter.replyTweet,
      timeout:
        ((flowProfile?.config as IReplyTweetTwitterNodeConfig)?.timeout || 0) *
        1000,
      taskName: "replyTweet",
    });
  };
}

export const registerTwitterHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const s = new TwitterWorkflow(args);
  handlers.set(WORKFLOW_TYPE.LOGIN_TWITTER, s.loginTwitter);
  handlers.set(WORKFLOW_TYPE.FOLLOW_TWITTER, s.followTwitter);
  handlers.set(WORKFLOW_TYPE.LIKE_TWITTER, s.likeTweet);
  handlers.set(WORKFLOW_TYPE.RETWEET_TWITTER, s.reTweet);
  handlers.set(WORKFLOW_TYPE.REPLY_TWITTER, s.replyTweet);
};
