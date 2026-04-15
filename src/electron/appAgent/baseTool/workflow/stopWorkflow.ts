import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { campaignDB } from "@/electron/database/campaign";
import { workflowManager } from "@/electron/simulator/workflow";
import { safeStringify } from "@/electron/appAgent/utils";
import { TOOL_KEYS } from "@/electron/constant";

const schema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  workflowId: z.number().describe("Workflow ID"),
});

export const stopWorkflowTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.STOP_WORKFLOW,
    description:
      "Stop a currently running workflow on a campaign using their IDs.",
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

      const targetWorkflow = campaign?.listWorkflow?.find(
        (workflow) => workflow.id === workflowId,
      );
      if (!targetWorkflow) {
        return safeStringify({
          error: `Workflow with ID ${workflowId} not found in campaign "${campaign.name}"`,
          availableWorkflows:
            campaign?.listWorkflow?.map((workflow) => ({
              id: workflow.id,
              name: workflow.name,
            })) || [],
        });
      }

      const workflow = await workflowManager.getWorkflow(
        workflowId,
        campaignId,
        0,
      );

      if (!workflow.monitor.isRunning) {
        return safeStringify({
          error: `Workflow "${targetWorkflow.name}" is not running on campaign "${campaign.name}"`,
        });
      }

      await workflow.stopWorkflow();
      return safeStringify({
        message: `Workflow "${targetWorkflow.name}" stopped on campaign "${campaign.name}"`,
      });
    },
  });
