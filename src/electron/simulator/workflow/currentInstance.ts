import { licenseService } from "@/electron/service/licenseService";

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
    let retries = 0;
    while (!licenseService.isReady && retries < 20) {
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      retries++;
    }
    this.isFreeTier = licenseService.isFreeTier;
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
