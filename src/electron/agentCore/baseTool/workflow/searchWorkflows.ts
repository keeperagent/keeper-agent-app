import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { campaignDB } from "@/electron/database/campaign";
import { workflowDB } from "@/electron/database/workflow";
import { ICampaign } from "@/electron/type";
import { safeStringify } from "@/electron/agentCore/utils";
import { TOOL_KEYS } from "@/electron/constant";

const schema = z.object({
  searchText: z
    .string()
    .optional()
    .describe(
      "Optional search text to filter workflows by name (partial match). Omit to list all workflows.",
    ),
});

export const searchWorkflowsTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.SEARCH_WORKFLOWS,
    description:
      "Search and list workflows. Returns workflow IDs, names, variables, and which campaigns they belong to.\n" +
      "Use this to find the workflowId and campaignId needed by run_workflow / stop_workflow.",
    schema: schema as any,
    func: async ({ searchText }: { searchText?: string }) => {
      const [workflowResult, err] = await workflowDB.getListWorkflow(
        1,
        15,
        searchText || undefined,
      );
      if (err) {
        throw err;
      }

      const matchedWorkflows = workflowResult?.data || [];
      const workflowIds = matchedWorkflows
        .map((workflow) => workflow.id!)
        .filter(Boolean);

      const [listCampaign, listCampaignErr] =
        await campaignDB.getListCampaignByWorkflowId(workflowIds);
      if (listCampaignErr) {
        throw listCampaignErr;
      }

      const campaignsByWorkflowId = new Map<number, ICampaign[]>();
      for (const campaign of listCampaign || []) {
        for (const workflow of campaign?.listWorkflow || []) {
          if (workflowIds.includes(workflow.id!)) {
            const existing = campaignsByWorkflowId.get(workflow.id!) || [];
            existing.push(campaign);
            campaignsByWorkflowId.set(workflow.id!, existing);
          }
        }
      }

      return safeStringify({
        workflows: matchedWorkflows.map((workflow) => ({
          id: workflow.id,
          name: workflow.name,
          listVariable:
            workflow?.listVariable?.map((variable) => ({
              variable: variable.variable,
              label: variable.label,
              value: variable.value,
            })) || [],
          campaigns:
            campaignsByWorkflowId.get(workflow.id!)?.map((campaign) => ({
              id: campaign.id,
              name: campaign.name,
              totalProfiles: campaign.totalProfile || 0,
            })) || [],
        })),
      });
    },
  });
