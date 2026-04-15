import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { resourceGroupDB } from "@/electron/database/resourceGroup";
import { safeStringify } from "@/electron/appAgent/utils";
import { groupToColumns } from "./utils";
import { TOOL_KEYS } from "@/electron/constant";

export const listResourceGroupsTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.LIST_RESOURCE_GROUPS,
    description:
      "List all resource groups with their column schema and row counts. " +
      "Use this to discover existing groups before querying or adding resources.",
    schema: z.object({}) as any,
    func: async () => {
      const [result, err] = await resourceGroupDB.getListResourceGroup(1, 100);
      if (err || !result) {
        throw new Error(`Failed to list resource groups: ${err?.message}`);
      }

      return safeStringify(
        result.data.map((group) => ({
          id: group.id,
          name: group.name,
          note: group.note,
          source: (group as any).source,
          columns: groupToColumns(group),
          rowCount: group.totalResource || 0,
        })),
      );
    },
  });
