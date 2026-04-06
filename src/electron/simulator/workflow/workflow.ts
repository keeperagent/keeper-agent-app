import _ from "lodash";
import AsyncLock from "async-lock";
import dayjs from "dayjs";
import { Executor } from "./executor";
import { getNewExecutor } from "@/electron/inject";
import { workflowDB } from "@/electron/database/workflow";
import {
  ERROR_PERMISSION_TO_RUN_NODE,
  EXTENSION,
  EXTENSION_NAME_SEARCH,
  MESSAGE,
  NODE_STATUS,
  NODE_TYPE,
  WORKFLOW_TYPE,
} from "@/electron/constant";
import { IWorkflowData } from "./common";
import {
  enhanceConfigWithExtensionID,
  getFlowPath,
  getVariableFromProfile,
} from "./util";
import { Monitor } from "./monitor";
import {
  ICampaign,
  ICampaignProfile,
  IFlowProfile,
  IGenerateProfileNodeConfig,
  INodeConfig,
  IWorkflow,
  IWorkflowVariable,
} from "@/electron/type";
import { campaignDB } from "@/electron/database/campaign";
import { extensionDB } from "@/electron/database/extension";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { sleep } from "@/electron/simulator/util";
import {
  MESSAGE_TURN_OFF_PROFILE,
  NODE_ACTION,
} from "@/electron/simulator/constant";
import { preferenceDB } from "@/electron/database/preference";
import { telegramBotService } from "@/electron/chatGateway/adapters/telegram";
import { LOG_TYPE } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";
import { mainWindow } from "@/electron/main";
import { jobDB } from "@/electron/database/job";
import { CurrentInstance } from "./currentInstance";

const EMPTY_STRING = "--";

/* 
@Workflow class manage graph and pass Profile through Edge and Node to execute
@Executor class execute fuction base on Node type
@Monitor class monitor success, error state of each Profile and Thread
*/

export class Workflow {
  executor: Executor;
  monitor: Monitor;
  private lock: AsyncLock;
  private lockKey: string;
  workflowId: number;
  private workflow: IWorkflow | null;
  campaignId: number;
  scheduleId: number;
  private campaign: ICampaign | null;
  private encryptKey: string;
  private currentInstance: CurrentInstance;

  constructor(
    workflowId: number,
    campaignId: number,
    scheduleId: number,
    currentInstance: CurrentInstance,
  ) {
    this.executor = getNewExecutor();
    this.monitor = new Monitor(
      this.executor,
      currentInstance,
      workflowId,
      campaignId,
      scheduleId,
    );
    this.lock = new AsyncLock();
    this.lockKey = `Workflow_${workflowId}_${campaignId}`;
    this.campaign = null;
    this.workflow = null;
    this.workflowId = workflowId;
    this.campaignId = campaignId;
    this.scheduleId = scheduleId;
    this.currentInstance = currentInstance;
    this.encryptKey = "";
  }

  runWorkflow = async (
    encryptKey: string,
    overrideListVariable?: IWorkflowVariable[],
  ) => {
    if (this.monitor.isRunning) {
      logEveryWhere({
        campaignId: this.campaignId,
        workflowId: this.workflowId,
        campaignName: this.campaign?.name,
        workflowName: this.workflow?.name,
        type: LOG_TYPE.WARNING,
        message: "already run",
      });
      return;
    }

    await this.stopWorkflow(true); // reset state of last run
    const err = await this.prepareBeforeRun(encryptKey);
    if (err) {
      logEveryWhere({
        campaignId: this.campaignId,
        workflowId: this.workflowId,
        campaignName: this.campaign?.name,
        workflowName: this.workflow?.name,
        type: LOG_TYPE.ERROR,
        message: `error occur: ${err?.message}`,
      });
      return;
    }

    // Override workflow variables if provided (e.g. from Telegram bot)
    if (overrideListVariable?.length && this.workflow) {
      this.workflow.listVariable = (this.workflow.listVariable || []).map(
        (existingVariable: IWorkflowVariable) => {
          const overrideVariable = overrideListVariable.find(
            (candidateOverride: IWorkflowVariable) =>
              candidateOverride.variable === existingVariable.variable,
          );
          return overrideVariable
            ? { ...existingVariable, value: overrideVariable.value }
            : existingVariable;
        },
      );
    }

    logEveryWhere({
      campaignId: this.campaignId,
      workflowId: this.workflowId,
      campaignName: this.campaign?.name,
      workflowName: this.workflow?.name,
      type: LOG_TYPE.INFO,
      message: "workflow started",
    });

    const { numberOfThread = 1 } = this.monitor.getWorkflowState();

    const threadPromises: Promise<void>[] = [];
    for (let threadID = 0; threadID < numberOfThread; threadID++) {
      const threadIDStr = threadID.toString();
      if (this.monitor.isThreadStarted[threadIDStr]) {
        logEveryWhere({
          campaignId: this.campaignId,
          workflowId: this.workflowId,
          campaignName: this.campaign?.name,
          workflowName: this.workflow?.name,
          type: LOG_TYPE.WARNING,
          message: `thread ${threadIDStr} already started`,
        });
        continue;
      }

      const threadPromise = (async () => {
        logEveryWhere({
          campaignId: this.campaignId,
          workflowId: this.workflowId,
          campaignName: this.campaign?.name,
          workflowName: this.workflow?.name,
          threadId: threadIDStr,
          type: LOG_TYPE.INFO,
          message: `thead ${threadIDStr} started`,
        });
        this.monitor.setIsThreadStarted(threadIDStr, true);
        await this.executeThread(threadIDStr);
        this.monitor.setIsThreadStarted(threadIDStr, false);
      })();

      threadPromises.push(threadPromise);
    }

    await Promise.all(threadPromises);
    await this.checkCampaignProcess(this.campaignId);
  };

  stopWorkflow = async (hideLog?: boolean) => {
    if (!hideLog) {
      logEveryWhere({
        campaignId: this.campaignId,
        workflowId: this.workflowId,
        campaignName: this.campaign?.name,
        workflowName: this.workflow?.name,
        type: LOG_TYPE.SUCCESS,
        message: "workflow completed",
      });
    }

    this.monitor.stopAllThread();
    await this.executor.threadManager.stopThread(
      !this.campaign?.isSaveProfile,
      undefined,
      this.campaignId,
      this.workflowId,
    );
    await this.stopJob();
  };

  stopThread = async (threadID?: string) => {
    this.monitor.cleanUpThread(threadID);
    await this.executor.threadManager.stopThread(
      !this.campaign?.isSaveProfile,
      threadID,
      this.campaignId,
      this.workflowId,
    );
  };

  syncDataToUI = async () => {
    return await this.lock.acquire(this.lockKey, () => {
      this.currentInstance.setCurrentIntance(
        this.workflowId,
        this.campaignId,
        0,
      );
      return this.monitor.syncDataToUI();
    });
  };

  isUsingBrowser = () => {
    return this?.campaign?.isUseBrowser;
  };

  private checkCampaignProcess = async (
    campaignId: number,
  ): Promise<boolean> => {
    let isComplete = false;
    if (campaignId) {
      [isComplete] =
        await campaignProfileDB.checkCampaignProfileFinishRound(campaignId);
    } else {
      const { numberOfRound = 1 } = this.monitor.getWorkflowState();
      isComplete = await this.monitor.checkAllFakeFlowProfileCompleted(
        this.workflowId,
        numberOfRound,
      );
    }

    if (isComplete) {
      await this.stopWorkflow();
      await this.markJobCompleted();
      mainWindow?.webContents.send(MESSAGE.SCRIPT_RUN_COMPLETED, {
        isRunWithCampaign: Boolean(campaignId),
      });

      // Report completion via Telegram (only if this campaign is being monitored)
      if (campaignId && telegramBotService.isMonitoring(campaignId)) {
        telegramBotService.reportWorkflowCompleted(
          campaignId,
          this.workflow?.name || "Unknown",
          this.campaign?.name || "Unknown",
        );
      }
    }

    return isComplete;
  };

  private executeThread = async (threadID: string) => {
    const {
      flowPath = [],
      mapExtensionID = {},
      nodes = [],
      edges = [],
    } = this.monitor.getWorkflowState();

    // while loop for Profile, each Profile run Node one by one
    const initialFlowPathIndex = -1;
    let flowPathIndex = initialFlowPathIndex;
    while (true) {
      if (!this.monitor.isRunning) {
        await this.stopWorkflow();
        break;
      }

      let flowProfile: IFlowProfile = this.monitor.mapThread[threadID];
      let currentTime = new Date().getTime();
      if (flowProfile) {
        const detlaTimestamp =
          currentTime - (flowProfile?.nextRunTimestamp || 0);
        if (detlaTimestamp < 0 && flowProfile?.nodeID === null) {
          logEveryWhere({
            campaignId: this.campaignId,
            workflowId: this.workflowId,
            campaignName: this.campaign?.name,
            workflowName: this.workflow?.name,
            threadId: threadID,
            type: LOG_TYPE.DIM,
            message: `sleep ${-detlaTimestamp / 1000}s`,
          });
          await sleep(Math.abs(-detlaTimestamp));
        }
      } else {
        const newFlowProfile = await this.getNewFlowProfile(threadID);
        if (newFlowProfile) {
          logEveryWhere({
            campaignId: this.campaignId,
            workflowId: this.workflowId,
            campaignName: this.campaign?.name,
            workflowName: this.workflow?.name,
            threadId: threadID,
            type: LOG_TYPE.INFO,
            message: `new profile ${newFlowProfile?.profile?.name || EMPTY_STRING}`,
          });
        }

        // terminate Thread when their is no more Profile
        if (!newFlowProfile) {
          break;
        }
        flowProfile = newFlowProfile;
      }

      if (!this.monitor.isRunning) {
        await this.stopWorkflow();
        logEveryWhere({
          campaignId: this.campaignId,
          workflowId: this.workflowId,
          campaignName: this.campaign?.name,
          workflowName: this.workflow?.name,
          threadId: threadID,
          type: LOG_TYPE.WARNING,
          message: "workflow stopped",
        });
        break;
      }

      if (flowProfile?.nodeID === null) {
        // flow profile is in Edge
        flowPathIndex += 1;
        const targetNodeID = flowPath[flowPathIndex];
        const node = _.find(nodes, { id: targetNodeID });
        let nodeConfig = node?.data?.config as INodeConfig;
        if (
          nodeConfig?.status !== NODE_STATUS.RUN &&
          node?.type !== NODE_TYPE.END_NODE
        ) {
          // stop when hit disabled Node
          break;
        }

        // if error occur
        const threadError = this.monitor.mapThreadError[threadID];
        if (threadError) {
          const nodeActionWhenError = flowProfile?.config?.onError || "";

          while (
            nodeActionWhenError === NODE_ACTION.PAUSE_THREAD ||
            (threadError?.message === ERROR_PERMISSION_TO_RUN_NODE &&
              nodeActionWhenError !== NODE_ACTION.CONTINUE_RUN)
          ) {
            logEveryWhere({
              campaignId: this.campaignId,
              workflowId: this.workflowId,
              campaignName: this.campaign?.name,
              workflowName: this.workflow?.name,
              threadId: threadID,
              type: LOG_TYPE.WARNING,
              message: `pause thread when previous Processor has error, thread ${threadID}, Processor name: ${node?.data?.config?.name}`,
            });
            await sleep(30000);

            if (!this.monitor.isRunning) {
              break;
            }
          }

          if (
            [
              NODE_ACTION.RERUN_THREAD,
              NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE,
            ].includes(nodeActionWhenError as NODE_ACTION)
          ) {
            logEveryWhere({
              campaignId: this.campaignId,
              workflowId: this.workflowId,
              campaignName: this.campaign?.name,
              workflowName: this.workflow?.name,
              threadId: threadID,
              type: LOG_TYPE.WARNING,
              message: `rerun or Terminate Thread when error, thread ${threadID}, Processor name: ${node?.data?.config?.name}`,
            });
            await this.updateProfileWhenCompleted(flowProfile, threadID);
            flowPathIndex = initialFlowPathIndex;
            continue;
          }
        } else {
          // or CHECK_CONDITION Node close thread when success
          if (
            (flowProfile?.config?.workflowType ===
              WORKFLOW_TYPE.CHECK_CONDITION &&
              flowProfile?.isConditionSuccess &&
              flowProfile?.config?.onSuccess ===
                NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE) ||
            flowProfile?.config?.onSuccess ===
              NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE
          ) {
            logEveryWhere({
              campaignId: this.campaignId,
              workflowId: this.workflowId,
              campaignName: this.campaign?.name,
              workflowName: this.workflow?.name,
              threadId: threadID,
              type: LOG_TYPE.SUCCESS,
              message: `node mark Thread complete, Processor name: ${node?.data?.config?.name}`,
            });
            await this.updateProfileWhenCompleted(flowProfile, threadID);
            flowPathIndex = initialFlowPathIndex;
            continue;
          }
        }

        if (!this.monitor.isRunning) {
          await this.stopWorkflow();
          break;
        }

        // get extension ID, enhance for attribute for Profile
        nodeConfig = enhanceConfigWithExtensionID(nodeConfig, mapExtensionID);
        currentTime = new Date().getTime();
        flowProfile = {
          ...flowProfile,
          nodeID: targetNodeID,
          edgeID: null,
          nextRunTimestamp: currentTime,
          config: nodeConfig,
          startTimestamp: new Date().getTime(),
          endTimestamp: null,
        };
        if (
          flowProfile?.config?.workflowType === WORKFLOW_TYPE.GENERATE_PROFILE
        ) {
          flowProfile.lastRunDuration = 0;
        }

        // Profile choose Node to run
        logEveryWhere({
          campaignId: this.campaignId,
          workflowId: this.workflowId,
          campaignName: this.campaign?.name,
          workflowName: this.workflow?.name,
          threadId: threadID,
          type: LOG_TYPE.INFO,
          message: `profile ${flowProfile?.profile?.name || EMPTY_STRING} arrives to Processor ${flowProfile?.config?.workflowType || node?.type}`,
        });

        this.monitor.addFlowProfileToThread({
          threadID,
          flowProfile,
        });

        if (flowProfile?.config?.workflowType) {
          const [updatedFlowProfile, err] = await this.executor.executeScript(
            flowProfile?.config?.workflowType,
            flowProfile,
          );
          await this.processResultOfScript(updatedFlowProfile!, err);
        }
      } else {
        // flow profile is in Node
        const targetEdgeID =
          _.find(edges, {
            source: flowProfile?.nodeID,
          })?.id || null;

        // Profile choose Edge to run
        currentTime = new Date().getTime();
        flowProfile = {
          ...flowProfile,
          nextRunTimestamp:
            currentTime + (flowProfile?.config?.sleep || 0) * 1000,
          nodeID: null,
          edgeID: targetEdgeID,
        };

        this.monitor.addFlowProfileToThread({
          threadID,
          flowProfile,
        });
      }

      // if Profile arrive to the last Node
      if (flowPathIndex === flowPath.length - 1) {
        // check last Node has enough @onSuccess, @onError. Some node like SET_ATTRIBUTE, STOP_NODE, GET_RANDOM_VALUE, ... has undefined value for @onSuccess, @onError
        let config = flowProfile?.config || ({} as INodeConfig);
        if (!config?.onSuccess) {
          config = {
            ...config,
            onSuccess: NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE,
          };
        }
        if (!config?.onError) {
          config = {
            ...config,
            onError: NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE,
          };
        }
        flowProfile = {
          ...flowProfile,
          config,
        };

        this.monitor.addFlowProfileToThread({
          threadID: flowProfile?.threadID,
          flowProfile,
        });

        await this.updateProfileWhenCompleted(flowProfile, threadID);
        flowPathIndex = initialFlowPathIndex;
      }
    }
  };

  private processResultOfScript = async (
    flowProfile: IFlowProfile,
    error: Error | null,
  ) => {
    const { threadID, profile, config } = flowProfile;
    const nodeID = flowProfile?.nodeID!;
    const threadIDStr = threadID?.toString();

    if (error) {
      logEveryWhere({
        campaignId: this.campaignId,
        workflowId: this.workflowId,
        campaignName: this.campaign?.name,
        workflowName: this.workflow?.name,
        threadId: threadID,
        type: LOG_TYPE.ERROR,
        message: `error occur: ${error?.message}`,
      });
      this.monitor?.setNodeError({ nodeID, error });
      this.monitor?.setThreadError(threadIDStr, error);

      // send error to telegram
      if (config?.alertTelegramWhenError) {
        let errorMessage = "";
        errorMessage += `<i>${error}</i>\n`;
        errorMessage += `<strong>Current time:</strong> ${dayjs().format(
          "YYYY-MM-DD HH:mm",
        )}\n`;
        if (this.campaign) {
          errorMessage += `<strong>Campaign name:</strong> ${this.campaign?.name}\n`;
        }

        errorMessage += `<strong>Workflow name:</strong> ${this.workflow?.name}\n`;
        errorMessage += `<strong>Processor name:</strong> ${config?.name}\n`;

        if (profile?.name) {
          errorMessage += `<strong>Profile name:</strong> ${profile?.name || EMPTY_STRING}`;
        }

        this.sendMessageTelegram(errorMessage);
      }
    } else {
      if (this.monitor.mapThreadError[threadIDStr]) {
        this.monitor.clearThreadError(threadIDStr);
      }
    }

    // mark all profile completed when use STOP_SCRIPT processor
    if (
      flowProfile?.config?.workflowType === WORKFLOW_TYPE.STOP_SCRIPT &&
      this?.campaign
    ) {
      const errUpdateProfile =
        await campaignProfileDB.updateListCampaignProfile(
          true,
          [],
          { isRunning: false, round: this?.campaign?.numberOfRound },
          this.campaignId,
        );
      if (errUpdateProfile) {
        return errUpdateProfile;
      }
    }

    if (!this.monitor.isRunning) {
      logEveryWhere({
        campaignId: this.campaignId,
        workflowId: this.workflowId,
        campaignName: this.campaign?.name,
        workflowName: this.workflow?.name,
        threadId: threadID,
        type: LOG_TYPE.INFO,
        message: `profile ${flowProfile?.profile?.name || EMPTY_STRING} ignore result when workflow is terminated`,
      });
      await this.stopWorkflow(); // stop Workflow again if it's not stop completely
      return;
    }

    const runDuration =
      (flowProfile.endTimestamp || 0) - (flowProfile.startTimestamp || 0);
    this.monitor?.setMinMaxDuration({
      nodeID: flowProfile?.nodeID!,
      duration: runDuration,
    });

    flowProfile = {
      ...flowProfile,
      lastRunDuration: runDuration,
    };

    this.monitor?.addFlowProfileToThread({
      threadID: threadIDStr,
      flowProfile,
    });
  };

  private sendMessageTelegram = async (
    message: string,
  ): Promise<Error | null> => {
    const [preference] = await preferenceDB.getOnePreference();
    const err = await telegramBotService.sendMessage(
      preference?.botTokenTelegram || "",
      message,
      preference?.chatIdTelegram?.toString() || "",
    );
    return err;
  };

  private updateProfileWhenCompleted = async (
    flowProfile: IFlowProfile,
    threadID: string,
  ) => {
    const { profile, config } = flowProfile;
    const errorMessage = this.monitor?.mapThreadError[threadID];
    if (errorMessage && errorMessage?.message !== MESSAGE_TURN_OFF_PROFILE) {
      if (config?.onError === NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE) {
        logEveryWhere({
          campaignId: this.campaignId,
          workflowId: this.workflowId,
          campaignName: this.campaign?.name,
          workflowName: this.workflow?.name,
          threadId: threadID,
          type: LOG_TYPE.WARNING,
          message: `profile ${profile?.name || EMPTY_STRING} ignore thread when previous Processor has error, Processor name: ${flowProfile?.config?.name}`,
        });
        await this.updateProfile({
          id: profile?.id,
          campaignId: profile?.campaignId,
          isRunning: false,
          round: (profile?.round || 0) + 1, // update round after completed running
        });
      } else if (config?.onError === NODE_ACTION.RERUN_THREAD) {
        logEveryWhere({
          campaignId: this.campaignId,
          workflowId: this.workflowId,
          campaignName: this.campaign?.name,
          workflowName: this.workflow?.name,
          threadId: threadID,
          type: LOG_TYPE.WARNING,
          message: `profile ${profile?.name || EMPTY_STRING} stop thread and rerun when previous Processor has error, Processor name:  ${flowProfile?.config?.name}`,
        });
        // do not increase round
        await this.updateProfile({
          id: profile?.id,
          campaignId: profile?.campaignId,
          isRunning: false,
          round: profile?.round,
        });
      } else if (config?.onError === NODE_ACTION.CONTINUE_RUN) {
        this.monitor.clearThreadError(threadID);
      }
    } else if (
      config?.onSuccess === NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE
    ) {
      logEveryWhere({
        campaignId: this.campaignId,
        workflowId: this.workflowId,
        campaignName: this.campaign?.name,
        workflowName: this.workflow?.name,
        threadId: threadID,
        type: LOG_TYPE.SUCCESS,
        message: `profile ${profile?.name || EMPTY_STRING} complete, clean up thread`,
      });
      await this.updateProfile({
        id: profile?.id,
        campaignId: profile?.campaignId,
        isRunning: false,
        round: (profile?.round || 0) + 1, // update round after completed running
      });
    }

    await this.stopThread(threadID); // need to be run at the end
  };

  private updateProfile = async (
    profile: ICampaignProfile,
  ): Promise<Error | null> => {
    if (this.campaignId) {
      const [, err] = await campaignProfileDB.updateCampaignProfile(profile);
      return err;
    }

    this.monitor.updateFakeFlowProfile(profile);
    return null;
  };

  private prepareBeforeRun = async (
    encryptKey: string,
  ): Promise<Error | null> => {
    // get user permission to check whether user can run Node or not (check when run Node)
    await this.currentInstance.getIsFreeTier();
    if (this.currentInstance.isFreeTier) {
      return new Error("Can not run workflow with free tier");
    }

    this.monitor.setIsRunning(true);
    this.encryptKey = encryptKey;

    const [workflowRecord, err] = await workflowDB.getOneWorkflow(
      this.workflowId,
    );

    if (err) {
      return err;
    }
    this.workflow = workflowRecord;
    const workflowData: IWorkflowData = workflowRecord?.data
      ? JSON.parse(workflowRecord?.data)
      : { nodes: [], edges: [] };
    const { nodes, edges } = workflowData;

    const flowPath = getFlowPath(nodes, edges);
    let numberOfThread = workflowRecord?.numberOfThread || 1;
    let numberOfRound = workflowRecord?.numberOfRound || 1;

    // if Workflow run inside a Campaign
    if (this.campaignId) {
      const [campaign, err] = await campaignDB.getOneCampaign(this.campaignId);
      if (err) {
        return err;
      }
      this.campaign = campaign;
      numberOfThread = campaign?.numberOfThread || 1;
      numberOfRound = campaign?.numberOfRound || 1;

      const errUpdateProfile =
        await campaignProfileDB.updateListCampaignProfile(
          true,
          [],
          { isRunning: false },
          this.campaignId,
        );
      if (errUpdateProfile) {
        return errUpdateProfile;
      }
    } else {
      const firstNode = _.find(nodes, { id: flowPath[0] });
      if (
        firstNode?.data?.config?.workflowType === WORKFLOW_TYPE.GENERATE_PROFILE
      ) {
        const nodeConfig = firstNode?.data
          ?.config as IGenerateProfileNodeConfig;
        this.monitor.generateTestFlowProfile(
          nodeConfig?.listProfile,
          numberOfRound,
          nodeConfig?.sleep,
        );
      } else {
        // generate fake profile to run Script
        this.monitor.generateFakeFlowProfile(
          numberOfThread,
          numberOfRound,
          this.campaignId,
          this.workflowId,
        );
      }
    }

    const [listExtension, errExtension] =
      await extensionDB.getListExtensionByName([
        EXTENSION_NAME_SEARCH[EXTENSION.METAMASK],
        EXTENSION_NAME_SEARCH[EXTENSION.PHANTOM_WALLET],
        EXTENSION_NAME_SEARCH[EXTENSION.RABBY_WALLET],
        EXTENSION_NAME_SEARCH[EXTENSION.MARTIAN_WALLET],
      ]);
    if (errExtension) {
      return errExtension;
    }
    const mapExtensionID: { [key: string]: string } = {};
    Object?.keys(listExtension)?.forEach((extensionNameSearch: string) => {
      Object.keys(EXTENSION_NAME_SEARCH)?.forEach((extensionKey: string) => {
        if (EXTENSION_NAME_SEARCH[extensionKey] === extensionNameSearch) {
          mapExtensionID[extensionKey] = listExtension[extensionNameSearch];
        }
      });
    });

    this.monitor.setWorkflowState({
      numberOfThread,
      numberOfRound,
      mapExtensionID,
      nodes,
      edges,
      flowPath,
    });

    await this.startJob();
    return null;
  };

  private startJob = async () => {
    if (!this.campaignId || !this.workflowId) {
      return;
    }

    const [existedJob] = await jobDB.findOneJob({
      workflowId: this?.workflowId,
      campaignId: this?.campaignId,
      isRunWithSchedule: this.scheduleId !== 0,
    });
    if (existedJob === null) {
      await jobDB.createJob({
        workflowId: this?.workflowId,
        campaignId: this?.campaignId,
        isRunWithSchedule: this.scheduleId !== 0,
        onlyRunOnce: true,
        order: 0,
        isCompleted: false,
        isPending: false,
        isFirstJob: true,
        isRunning: true,
        encryptKey: this.encryptKey,
        lastRunTime: new Date().getTime(),
      });
    } else {
      await jobDB.updateJob({
        id: existedJob?.id,
        isRunning: true,
        lastRunTime: new Date().getTime(),
        encryptKey: this.encryptKey,
      });
    }
  };

  private stopJob = async () => {
    if (!this.campaignId || !this.workflowId) {
      return;
    }

    const [existedJob] = await jobDB.findOneJob({
      workflowId: this?.workflowId,
      campaignId: this?.campaignId,
      isRunWithSchedule: this.scheduleId !== 0,
    });
    if (existedJob === null) {
      return;
    }

    if (existedJob?.isRunWithSchedule) {
      await jobDB.updateJob({
        id: existedJob?.id,
        isRunning: false,
        lastEndTime: new Date().getTime(),
      });
    } else {
      await jobDB.updateJob({
        id: existedJob?.id,
        isRunning: false,
        encryptKey: "",
        lastEndTime: new Date().getTime(),
      });
    }
  };

  private markJobCompleted = async () => {
    if (!this.workflowId || !this.campaignId) {
      return;
    }

    const [existedJob] = await jobDB.findOneJob({
      workflowId: this?.workflowId,
      campaignId: this?.campaignId,
    });
    if (existedJob === null) {
      return;
    }

    await jobDB.updateJob({
      id: existedJob?.id,
      isCompleted: true,
      isRunning: false,
      lastEndTime: new Date().getTime(),
    });
  };

  private getNewFlowProfile = async (
    threadID: string,
  ): Promise<IFlowProfile | null> => {
    const { numberOfRound = 1 } = this.monitor.getWorkflowState();

    // if Workflow run inside a Campaign
    if (this.campaign) {
      // get new profile from database to run
      // use @mutex lock to prevent get the same data to run between different thread
      let profile: ICampaignProfile = {};
      await this.lock.acquire(this.lockKey, async () => {
        [profile] = await this.monitor.pickCampaignProfileToRun({
          campaignId: this.campaignId,
          workflowId: this.workflowId,
          numberOfRound,
          encryptKey: this.encryptKey,
          sortField: {
            field: this.campaign?.sortField || "",
            order: this.campaign?.sortOrder || "",
          },
        });
      });

      if (_.isEmpty(profile) || !profile) {
        logEveryWhere({
          campaignId: this.campaignId,
          workflowId: this.workflowId,
          campaignName: this.campaign?.name,
          workflowName: this.workflow?.name,
          threadId: threadID,
          type: LOG_TYPE.WARNING,
          message: "profile is empty",
        });
        return null;
      }

      const listVariable = getVariableFromProfile(
        profile,
        this.campaign,
        this.workflow,
      );

      const flowProfile: IFlowProfile = {
        nodeID: null,
        listVariable,
        isSaveProfile: this.campaign?.isSaveProfile,
        profile,
        threadID,
        initialTimestamp: new Date().getTime(),
        campaignConfig: {
          isUseProxy: Boolean(this.campaign?.isUseProxy),
          isUseRandomUserAgent: this.campaign?.isUseRandomUserAgent,
          userAgentCategory: this.campaign?.userAgentCategory,
          windowWidth: this.campaign?.windowWidth,
          windowHeight: this.campaign?.windowHeight,
          isFullScreen: this.campaign?.isFullScreen,
          totalScreen: this.campaign?.numberOfThread || 1,
          numberOfRound: this.campaign?.numberOfRound || 1,
          workflowId: this.workflowId,
          campaignId: this.campaignId,
          isUseBrowser: this.campaign?.isUseBrowser,
        },
      };

      return flowProfile;
    }

    // if Workflow run without a Campaign
    let flowProfile: any = null;
    await this.lock.acquire(this.lockKey, async () => {
      flowProfile = await this.monitor.getFakeFlowProfileToRun(
        numberOfRound,
        this.workflowId,
        true,
      );
    });
    if (!flowProfile) {
      return null;
    }

    flowProfile = flowProfile as IFlowProfile;
    const listVariable = getVariableFromProfile(null, null, this.workflow);
    return {
      ...flowProfile,
      listVariable,
      initialTimestamp: new Date().getTime(),
      threadID,
      campaignConfig: {
        ...flowProfile?.campaignConfig,
        windowWidth: this.workflow?.windowWidth,
        windowHeight: this.workflow?.windowHeight,
        isFullScreen: this.workflow?.isFullScreen,
        totalScreen: this.workflow?.numberOfThread || 1,
        numberOfRound: this.workflow?.numberOfRound || 1,
        isUseBrowser: true,
      },
    };
  };
}
