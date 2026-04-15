import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { campaignDB } from "@/electron/database/campaign";
import { safeStringify } from "@/electron/appAgent/utils";
import { TOOL_KEYS } from "@/electron/constant";

const schema = z.object({
  searchText: z
    .string()
    .optional()
    .describe(
      "Optional search text to filter campaigns by name (partial match). Omit to list all campaigns.",
    ),
});

export const searchCampaignsTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.SEARCH_CAMPAIGNS,
    description:
      "Search and list campaigns. Returns campaign IDs, names, profile counts, and their attached workflows with IDs and variables.\n" +
      "Use this to find the campaignId and workflowId needed by run_workflow / stop_workflow.",
    schema: schema as any,
    func: async ({ searchText }: { searchText?: string }) => {
      const [result, err] = await campaignDB.getListCampaign(
        1,
        15,
        searchText || undefined,
      );
      if (err) {
        throw err;
      }

      const campaigns = result?.data || [];
      return safeStringify({
        campaigns: campaigns.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          totalProfiles: campaign.totalProfile || 0,
          workflows:
            campaign?.listWorkflow?.map((workflow) => ({
              id: workflow.id,
              name: workflow.name,
              listVariable:
                workflow?.listVariable?.map((variable) => ({
                  variable: variable.variable,
                  label: variable.label,
                  value: variable.value,
                })) || [],
            })) || [],
        })),
      });
    },
  });
