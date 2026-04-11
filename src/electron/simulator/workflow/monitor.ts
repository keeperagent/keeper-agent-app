import _ from "lodash";
import {
  IFlowProfile,
  IFakeProfile,
  ICampaignProfile,
  IExecutionSession,
  ISorter,
  INodeConfig,
} from "@/electron/type";
import { sendToRenderer } from "@/electron/main";
import { MESSAGE, PROFILE_TYPE, SORT_ORDER } from "@/electron/constant";
import { sleep } from "@/electron/simulator/util";
import { campaignDB } from "@/electron/database/campaign";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { decryptCampaignProfile } from "@/electron/service/campaignProfile";
import { Executor } from "./executor";
import { CurrentInstance } from "./currentInstance";
import { updateItemInList } from "./util";
import { IWorkflowState } from "./common";

const initialWorkflowState = {
  numberOfThread: 0,
  numberOfRound: 0,
  mapExtensionID: {},
  nodes: [],
  edges: [],
};

export class Monitor {
  private _isRunning: boolean;
  mapThread: {
    [threadID: string]: IFlowProfile;
  } = {};
  private _mapThreadError: {
    [threadID: string]: Error;
  };
  private mapNodeError: {
    [nodeID: string]: { timestamp: number; message: string };
  };
  private mapMinMaxDuration: {
    [nodeID: string]: {
      min: number;
      max: number;
    };
  };
  private _isThreadStarted: {
    [theadID: string]: boolean;
  };
  private isSleeping: boolean;
  private listFakeFlowProfile: IFlowProfile[];
  private workflowState: IWorkflowState;
  private executor: Executor;
  currentRound = 0;
  private currentInstance: CurrentInstance;
  private workflowKey: string;
  private mapOpenProfileId: { [key: number]: { [key: number]: boolean } }; // campaignId -> profileId -> isOpen
  private campaignId: number;
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private hasPendingUpdates = false;
  private sleepTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    executor: Executor,
    currentInstance: CurrentInstance,
    workflowId: number,
    campaignId: number,
    scheduleId: number,
  ) {
    this._isRunning = false;
    this._isThreadStarted = {};
    this._mapThreadError = {};
    this.mapThread = {};
    this.mapMinMaxDuration = {};
    this.listFakeFlowProfile = [];
    this.mapNodeError = {};
    this.workflowState = initialWorkflowState;
    this.isSleeping = false;
    this.executor = executor;
    this.currentRound = 0;
    this.currentInstance = currentInstance;
    this.workflowKey = currentInstance.getWorkflowKey(
      workflowId,
      campaignId,
      scheduleId,
    );
    this.mapOpenProfileId = {};
    this.campaignId = campaignId;
  }

  public get isRunning() {
    return this._isRunning;
  }

  public get mapThreadError() {
    return this._mapThreadError;
  }

  public get isThreadStarted() {
    return this._isThreadStarted;
  }

  syncDataToUI = () => {
    if (!this.mapOpenProfileId[this.campaignId]) {
      this.mapOpenProfileId[this.campaignId] = {};
    }

    return {
      mapThread: this.mapThread,
      mapNodeError: this.mapNodeError,
      isRunning: this.isRunning,
      mapMinMaxDuration: this.mapMinMaxDuration,
      currentRound: this.currentRound,
      isSleeping: this.isSleeping,
      mapOpenProfileId: this.mapOpenProfileId[this.campaignId],
    };
  };

  setProfileIdOpenInBrowser = (profileId: number, isOpen: boolean) => {
    if (!this.mapOpenProfileId[this.campaignId]) {
      this.mapOpenProfileId[this.campaignId] = {};
    }

    if (!isOpen) {
      const isCloseAllProfile = !profileId;
      if (isCloseAllProfile) {
        this.mapOpenProfileId[this.campaignId] = {};
      } else {
        delete this.mapOpenProfileId[this.campaignId][profileId];
      }
      return;
    }

    this.mapOpenProfileId[this.campaignId][profileId] = true;
  };

  setWorkflowState = (workflowState: IWorkflowState) => {
    this.workflowState = { ...this.workflowState, ...workflowState };
  };

  getWorkflowState = (): IWorkflowState => {
    return this.workflowState;
  };

  setIsRunning = (value: boolean) => {
    this._isRunning = value;

    // reset list profile to run new workflow
    if (value) {
      this.listFakeFlowProfile = [];
      this.currentRound = 0;
      this.startSyncInterval();
    } else {
      this.stopSyncInterval();
    }
  };

  private startSyncInterval = () => {
    if (this.syncIntervalId) {
      return;
    }

    this.syncIntervalId = setInterval(() => {
      this.flushPendingUpdates();
    }, 500);
  };

  private stopSyncInterval = () => {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    // flush any remaining updates
    this.flushPendingUpdates();
  };

  private flushPendingUpdates = () => {
    if (!this.hasPendingUpdates || !this.shouldSyncWithUI()) {
      return;
    }

    this.hasPendingUpdates = false;
    sendToRenderer(MESSAGE.WORKFLOW_BATCH_UPDATE, {
      mapThread: this.mapThread,
      mapNodeError: this.mapNodeError,
      mapMinMaxDuration: this.mapMinMaxDuration,
      isRunning: this.isRunning,
      currentRound: this.currentRound,
      isSleeping: this.isSleeping,
    });
  };

  private markPendingUpdate = () => {
    this.hasPendingUpdates = true;
  };

  stopAllThread = () => {
    this._isRunning = false;
    this.stopSyncInterval();
    this.mapThread = {};
    this.mapMinMaxDuration = {};
    this._isThreadStarted = {};
    this._mapThreadError = {};
    this.mapNodeError = {};
    this.workflowState = initialWorkflowState;

    if (this.sleepTimeoutId) {
      clearTimeout(this.sleepTimeoutId);
      this.sleepTimeoutId = null;
    }
  };

  private shouldSyncWithUI = (): boolean => {
    return this.workflowKey === this.currentInstance.getCurrentRunningKey();
  };

  cleanUpThread = (threadID?: string) => {
    if (threadID !== undefined) {
      delete this.mapThread[threadID];
      delete this._isThreadStarted[threadID];
      delete this._mapThreadError[threadID];
    } else {
      this.mapThread = {};
      this._isThreadStarted = {};
      this._mapThreadError = {};
    }

    if (this.shouldSyncWithUI()) {
      sendToRenderer(MESSAGE.WORKFLOW_THREAD_STOPPED, {
        threadID,
      });
    }
  };

  addFlowProfileToThread = ({
    threadID,
    flowProfile,
  }: {
    threadID: string;
    flowProfile: IFlowProfile;
  }) => {
    this.mapThread[threadID] = flowProfile;
    this.markPendingUpdate();
  };

  setMinMaxDuration = ({
    nodeID,
    duration,
  }: {
    nodeID: string;
    duration: number;
  }) => {
    if (!this.mapMinMaxDuration?.[nodeID]) {
      this.mapMinMaxDuration[nodeID] = {
        min: duration,
        max: duration,
      };

      return;
    }

    let min = this.mapMinMaxDuration[nodeID]?.min;
    let max = this.mapMinMaxDuration[nodeID]?.max;
    if (duration < min) {
      min = duration;
    }
    if (duration > max) {
      max = duration;
    }

    min = min > 0 ? min : 0;
    max = max > 0 ? max : 0;
    this.mapMinMaxDuration[nodeID] = {
      min,
      max,
    };
    this.markPendingUpdate();
  };

  setIsThreadStarted = (threadID: string, value: boolean) => {
    this._isThreadStarted[threadID] = value;
  };

  generateFakeFlowProfile = (
    numberOfThread: number,
    numberOfRound: number,
    campaignId: number,
    workflowId: number,
  ): IFlowProfile[] => {
    if (this.listFakeFlowProfile?.length > 0) {
      return this.listFakeFlowProfile;
    }

    for (let i = 0; i < numberOfThread; i++) {
      this.listFakeFlowProfile.push({
        nodeID: null,
        edgeID: null,
        threadID: "-1",
        isSaveProfile: false,
        listVariable: [],
        campaignConfig: {
          numberOfRound,
          totalScreen: numberOfThread,
          totalProfileInWorkflow: numberOfThread,
          isUseBrowser: true,
          campaignId,
          workflowId,
        },
        profile: {
          id: i,
          round: 0,
          isRunning: false,
          name: "Seed Profile",
        },
      });
    }

    return this.listFakeFlowProfile;
  };

  generateTestFlowProfile = (
    listProfile: IFakeProfile[],
    numberOfRound: number,
    sleepTime: number,
  ): IFlowProfile[] => {
    if (this.listFakeFlowProfile?.length > 0) {
      return this.listFakeFlowProfile;
    }

    for (let i = 0; i < listProfile.length; i++) {
      const currentTime = new Date().getTime();
      const fakeProfile: IFlowProfile = {
        nodeID: null,
        edgeID: null,
        threadID: "-1",
        isSaveProfile: false,
        listVariable: listProfile[i],
        nextRunTimestamp: currentTime + sleepTime * 1000,
        campaignConfig: {
          isUseProxy: false,
          numberOfRound,
          totalProfileInWorkflow: listProfile?.length,
          isUseBrowser: true,
        },
        profile: {
          id: i,
          round: 0,
          isRunning: false,
        },
        config: {
          sleep: sleepTime,
        } as INodeConfig,
      };

      this.listFakeFlowProfile.push(fakeProfile);
    }

    return this.listFakeFlowProfile;
  };

  updateFakeFlowProfile = (profile: ICampaignProfile) => {
    const index = _.findIndex(this.listFakeFlowProfile, {
      profile: { id: profile?.id },
    });
    if (index === -1) {
      return;
    }

    const updatedProfile = {
      ...this.listFakeFlowProfile[index].profile,
      ...profile,
    };
    const updatedFlowProfile = {
      ...this.listFakeFlowProfile[index],
      profile: updatedProfile,
    };
    this.listFakeFlowProfile = updateItemInList(
      index,
      this.listFakeFlowProfile,
      updatedFlowProfile,
    );
  };

  checkAllFakeFlowProfileCompleted = async (
    workflowId: number,
    numberOfRound: number,
  ): Promise<boolean> => {
    const flowProfileToRun = await this.getFakeFlowProfileToRun(
      numberOfRound,
      workflowId,
      false,
    );

    return (
      flowProfileToRun === null &&
      this.listFakeFlowProfile?.filter(
        (flowProfile) => flowProfile?.profile?.isRunning,
      )?.length === 0
    );
  };

  checkFakeFlowProfileStatus = (numberOfRound: number): [number, number] => {
    const totalProfile = this.listFakeFlowProfile?.length;
    const totalUnFinishedProfile = this.listFakeFlowProfile?.filter(
      (flowProfile) => flowProfile?.profile?.round! < numberOfRound,
    )?.length;
    return [totalProfile, totalUnFinishedProfile];
  };

  setThreadError = (threadID: string, error: Error) => {
    this._mapThreadError[threadID] = error;
  };

  clearThreadError = (threadID: string) => {
    delete this._mapThreadError[threadID];
  };

  setNodeError = ({ nodeID, error }: { nodeID: string; error: Error }) => {
    this.mapNodeError[nodeID] = {
      timestamp: Date.now(),
      message: error.message,
    };
    this.markPendingUpdate();
  };

  private waitForSleep = async () => {
    while (this.isSleeping) {
      await sleep(100);
    }
  };

  pickCampaignProfileToRun = async ({
    campaignId,
    workflowId,
    numberOfRound,
    encryptKey,
    sortField,
  }: {
    campaignId: number;
    workflowId: number;
    numberOfRound: number;
    encryptKey: string;
    sortField: ISorter;
  }): Promise<ICampaignProfile[]> => {
    let listCampaignProfileId: number[] = [];
    const [campaign] = await campaignDB.getOneCampaign(campaignId);
    // if only select some profile to run
    if (campaign?.profileType === PROFILE_TYPE.CUSTOM_SELECT) {
      listCampaignProfileId = campaign?.listCampaignProfileId || [];
    }

    const [res] = await campaignProfileDB.getListCampaignProfile({
      page: 1,
      pageSize: 1,
      isRunning: false,
      isActive: true,
      campaignId,
      numberOfRound,
      listId: listCampaignProfileId,
      sortField,
    });
    let listCampaignProfile = res?.data as ICampaignProfile[];
    if (encryptKey) {
      listCampaignProfile = listCampaignProfile?.map(
        (profile: ICampaignProfile) =>
          decryptCampaignProfile(profile, encryptKey),
      );
    }

    const listUpdatedProfile: ICampaignProfile[] = [];
    for (let i = 0; i < listCampaignProfile.length; i++) {
      const updatedProfile = {
        ...listCampaignProfile[i],
        isRunning: true,
      };
      await campaignProfileDB.updateCampaignProfile({
        id: listCampaignProfile[i]?.id,
        campaignId,
        isRunning: updatedProfile?.isRunning,
      });

      listUpdatedProfile.push(updatedProfile);
    }

    if (listUpdatedProfile?.length === 0) {
      return [];
    }

    // check whether is run new round
    let isNewRound = false;
    const isRoundUseAscendOrder = sortField?.order !== SORT_ORDER.DESC;
    const campaignProfile = listUpdatedProfile[0];
    const round = campaignProfile?.round || 0;
    if (
      (isRoundUseAscendOrder && round > this.currentRound) ||
      (!isRoundUseAscendOrder && round < this.currentRound)
    ) {
      this.currentRound = round;
      if (this.shouldSyncWithUI()) {
        sendToRenderer(MESSAGE.WORKFLOW_HAS_NEW_ROUND, {
          round,
        });
      }

      isNewRound = true;
    }
    if (isNewRound) {
      const sleepBetweenRound = campaign?.sleepBetweenRound || 0;
      this.handleNewRound(sleepBetweenRound, campaignId, workflowId);
    }

    await this.waitForSleep();
    return listUpdatedProfile;
  };

  pickFlowProfileFromSession = async (
    session: IExecutionSession,
  ): Promise<IFlowProfile | null> => {
    for (const [profileId, flowProfile] of session.flowProfiles.entries()) {
      const profile = flowProfile.profile;
      if (!profile || profile.isRunning) {
        continue;
      }

      // consume from session — the previous job passed this profile here via handoffToNext=true
      // this job now owns it and removes it from session to prevent double-incrementing by session.destroy()
      session.flowProfiles.delete(profileId);

      // mark as running in DB using profile's own campaignId
      await campaignProfileDB.updateCampaignProfile({
        id: profile.id,
        campaignId: profile.campaignId!,
        isRunning: true,
      });

      return {
        ...flowProfile,
        profile: { ...profile, isRunning: true },
      };
    }

    return null;
  };

  getFakeFlowProfileToRun = async (
    numberOfRound: number,
    workflowId: number,
    shouldMarkRunning?: boolean,
  ): Promise<IFlowProfile | null> => {
    let flowProfile: IFlowProfile | null = null;
    for (let i = 0; i < this.listFakeFlowProfile.length; i++) {
      const item = this.listFakeFlowProfile[i];
      if (item?.profile?.round! < numberOfRound && !item?.profile?.isRunning) {
        if (shouldMarkRunning) {
          this.updateFakeFlowProfile({
            ...item?.profile,
            isRunning: true,
          });
        }
        flowProfile = this.listFakeFlowProfile[i];
        break;
      }
    }

    let isNewRound = false;
    if (flowProfile?.profile?.round! > this.currentRound) {
      this.currentRound = flowProfile?.profile?.round!;
      if (this.shouldSyncWithUI()) {
        sendToRenderer(MESSAGE.WORKFLOW_HAS_NEW_ROUND, {
          round: this.currentRound,
        });
      }

      isNewRound = true;
    }
    if (isNewRound) {
      await this.handleNewRound(
        0,
        flowProfile?.campaignConfig?.campaignId,
        workflowId,
      );
    }

    return flowProfile;
  };

  private handleNewRound = async (
    sleepBetweenRound: number,
    campaignId: number = 0,
    workflowId: number = 0,
  ) => {
    if (sleepBetweenRound > 0) {
      this.isSleeping = true;
      if (this.shouldSyncWithUI()) {
        sendToRenderer(MESSAGE.WORKFLOW_SLEEPING_STATUS, {
          isSleeping: true,
        });
      }

      this.sleepTimeoutId = setTimeout(() => {
        this.isSleeping = false;
        this.sleepTimeoutId = null;
        if (this.shouldSyncWithUI()) {
          sendToRenderer(MESSAGE.WORKFLOW_SLEEPING_STATUS, {
            isSleeping: false,
          });
        }
      }, sleepBetweenRound * 1000);
    }

    await this.executor.threadManager.clearOldestEventFromContractSniper(
      campaignId,
      workflowId,
    );

    await this.executor.threadManager.clearOldestMessageFromTelegramSniper(
      campaignId,
      workflowId,
    );
  };
}
