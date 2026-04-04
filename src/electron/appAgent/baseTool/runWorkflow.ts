import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { campaignDB } from "@/electron/database/campaign";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { workflowManager } from "@/electron/simulator/workflow";
import { RESPONSE_CODE } from "@/electron/constant";
import { ICampaignProfile, IWorkflowVariable } from "@/electron/type";
import { safeStringify } from "@/electron/appAgent/utils";
import type { ToolContext } from "@/electron/appAgent/toolContext";

const schema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  workflowId: z.number().describe("Workflow ID"),
  encryptKey: z
    .string()
    .optional()
    .describe(
      "Secret key to decrypt profile data. Required if the workflow uses encrypted data.",
    ),
  variables: z
    .record(z.string())
    .optional()
    .describe(
      'Workflow variable overrides as key-value pairs. e.g. { "walletAddress": "0x123..." }',
    ),
});

export const runWorkflowTool = (toolContext: ToolContext) =>
  new DynamicStructuredTool({
    name: "run_workflow",
    description:
      "Run a workflow on a campaign using their IDs. Use search_campaigns or search_workflows first to get the IDs.",
    schema: schema as any,
    func: async ({
      campaignId,
      workflowId,
      encryptKey,
      variables,
    }: {
      campaignId: number;
      workflowId: number;
      encryptKey?: string;
      variables?: Record<string, string>;
    }) => {
      if (toolContext?.planningMode) {
        return safeStringify({
          error:
            "Cannot run workflow in planning mode. Call submit_plan with your execution plan first to get user approval.",
          status: "blocked_planning_mode",
        });
      }

      /* Prefer the authoritative value from toolContext (passed via secure IPC side-channel or captured by the bridge) over whatever the LLM provides, which may be a redacted placeholder like "[ENCRYPT_KEY]".
       */
      const resolvedEncryptKey = toolContext.encryptKey || encryptKey || "";
      const resolvedVariables = variables || undefined;

      const [campaign, campaignErr] =
        await campaignDB.getOneCampaign(campaignId);
      if (campaignErr || !campaign) {
        throw (
          campaignErr || new Error(`Campaign with ID ${campaignId} not found`)
        );
      }

      const targetWorkflow = (campaign.listWorkflow || []).find(
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

      if (workflow.monitor.isRunning) {
        return safeStringify({
          error: `Workflow "${targetWorkflow.name}" is already running on campaign "${campaign.name}"`,
          code: RESPONSE_CODE.DUPLICATE_ERROR,
        });
      }

      const shouldWait = await workflowManager.shouldWaitBeforeRun(campaignId);
      if (shouldWait) {
        return safeStringify({
          error:
            "Another browser workflow is currently running. Please wait for it to complete.",
          code: RESPONSE_CODE.OBJECT_EXISTED,
        });
      }

      // Build variable overrides
      let overrideListVariable: IWorkflowVariable[] | undefined;
      if (resolvedVariables && Object.keys(resolvedVariables).length > 0) {
        const baseVariables = targetWorkflow.listVariable || [];
        overrideListVariable = baseVariables.map((variable) => ({
          ...variable,
          value:
            resolvedVariables[variable.variable] !== undefined
              ? resolvedVariables[variable.variable]
              : variable.value,
        }));
      }

      // Reset all campaign profiles before running
      await campaignProfileDB.updateListCampaignProfile(
        true,
        [],
        { isRunning: false, round: 0 } as ICampaignProfile,
        campaignId,
      );

      workflowManager.currentInstance.setCurrentIntance(
        workflowId,
        campaignId,
        0,
      );
      workflow.runWorkflow(resolvedEncryptKey, overrideListVariable);

      return safeStringify({
        message: `Workflow "${targetWorkflow.name}" started on campaign "${campaign.name}"`,
        workflowId,
        campaignId,
        totalProfiles: campaign.totalProfile || 0,
      });
    },
  });
