import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { campaignDB } from "@/electron/database/campaign";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { workflowManager } from "@/electron/simulator/workflow";
import { safeStringify } from "@/electron/appAgent/utils";

const schema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  workflowId: z.number().describe("Workflow ID"),
});

export const checkWorkflowStatusTool = () =>
  new DynamicStructuredTool({
    name: "check_workflow_status",
    description:
      "Check the progress and status of a workflow running on a campaign.",
    schema: schema as any,
    func: async ({
      campaignId,
      workflowId,
    }: {
      campaignId: number;
      workflowId: number;
    }) => {
      const [campaign, campaignErr] =
        await campaignDB.getOneCampaign(campaignId);
      if (campaignErr || !campaign) {
        throw (
          campaignErr || new Error(`Campaign with ID ${campaignId} not found`)
        );
      }

      const targetWorkflow = (campaign?.listWorkflow || []).find(
        (workflow) => workflow.id === workflowId,
      );
      const workflowName = targetWorkflow?.name || `ID ${workflowId}`;

      const workflow = await workflowManager.getWorkflow(
        workflowId,
        campaignId,
        0,
      );

      const monitorData = workflow.monitor.syncDataToUI();
      const { isRunning, currentRound, isSleeping } = monitorData;

      const [totalProfile, totalUnFinishedProfile, statusErr] =
        await campaignProfileDB.getCampaignProfileStatus(campaignId);
      if (statusErr) {
        throw statusErr;
      }

      const completed = (totalProfile || 0) - (totalUnFinishedProfile || 0);
      const progress =
        totalProfile > 0 ? Math.round((completed / totalProfile) * 100) : 0;

      return safeStringify({
        campaignName: campaign.name,
        workflowName,
        isRunning,
        currentRound,
        isSleeping,
        totalProfile: totalProfile || 0,
        completedProfile: completed,
        progress,
      });
    },
  });
