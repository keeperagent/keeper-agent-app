import { uid } from "uid/secure";
import { ipcMain } from "electron";
import { MESSAGE } from "@/electron/constant";
import { sendToRenderer } from "@/electron/main";

const WORKFLOW_WITHOUT_CAMPAIGN_ID = "WORKFLOW_WITHOUT_CAMPAIGN_ID"; // when Script run without inside Campaign
const CAMPAIGN_PROFILE_WITHOUT_WITHOUT_SCRIPT =
  "CAMPAIGN_PROFILE_WITHOUT_WITHOUT_SCRIPT"; // when open Campaign Profile' browser manually

// @CurrentInstance class manage current running workflow, campaign, schedule

export class CurrentInstance {
  private currentWorkflowId: number;
  private currentCampaignId: number;
  private currentScheduleId: number;
  isFreeTier: boolean;

  constructor() {
    this.currentWorkflowId = 0;
    this.currentCampaignId = 0;
    this.currentScheduleId = 0;
    this.isFreeTier = false;
  }

  getIsFreeTier = async () => {
    // use interval to retry sending until renderer is ready to respond
    await new Promise<void>((resolve) => {
      const uniqueID = uid(25);
      let interval: any = null;

      const handler = (_event: any, payload: any) => {
        if (payload?.requestId !== uniqueID) {
          return;
        }

        ipcMain.removeListener(MESSAGE.GET_USER_PERMISSIONS_RES, handler);
        if (interval) {
          clearInterval(interval);
        }

        this.isFreeTier = payload?.data || false;
        resolve();
      };

      ipcMain.on(MESSAGE.GET_USER_PERMISSIONS_RES, handler);

      interval = setInterval(() => {
        sendToRenderer(MESSAGE.GET_USER_PERMISSIONS, { requestId: uniqueID });
      }, 1000);
    });
  };

  setCurrentIntance = (
    workflowId: number,
    campaignId: number,
    scheduleId: number,
  ) => {
    this.currentWorkflowId = workflowId;
    this.currentCampaignId = campaignId;
    this.currentScheduleId = scheduleId;
  };

  getCurrentRunningKey = (): string | null => {
    if (this.currentCampaignId === 0 && this.currentWorkflowId === 0) {
      return null;
    }

    return this.getWorkflowKey(
      this.currentWorkflowId,
      this.currentCampaignId,
      this.currentScheduleId,
    );
  };

  getWorkflowKey = (
    workflowId: number = 0,
    campaignId: number = 0,
    scheduleId: number = 0,
  ): string => {
    if (campaignId && workflowId) {
      return [
        workflowId?.toString(),
        campaignId?.toString(),
        scheduleId?.toString(),
      ]?.toString();
    }

    if (workflowId) {
      return [WORKFLOW_WITHOUT_CAMPAIGN_ID, "0", "0"]?.toString();
    }

    return ["0", CAMPAIGN_PROFILE_WITHOUT_WITHOUT_SCRIPT, "0"]?.toString();
  };
}

const currentInstance = new CurrentInstance();
export { currentInstance };
