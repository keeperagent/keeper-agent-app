import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ResourceGroupSource } from "@/electron/type";
import { resourceDB } from "@/electron/database/resource";
import { safeStringify } from "@/electron/appAgent/utils";
import { groupToColumns, resolveResourceGroup } from "./utils";
import { TOOL_KEYS } from "@/electron/constant";

const schema = z
  .object({
    groupId: z.number().optional().describe("ID of the resource group"),
    groupName: z.string().optional().describe("Name of the resource group"),
    rows: z
      .array(
        z.record(z.any()).refine((row) => typeof row.id === "number", {
          message: "Each row must include an 'id' field (from query_resources)",
        }),
      )
      .min(1)
      .describe(
        "Partial row objects — each must include 'id' (from query_resources) " +
          "plus only the columns to update. Omitted columns are preserved.",
      ),
  })
  .refine((value) => Boolean(value.groupId || value.groupName), {
    message: "groupId or groupName is required",
  });

export const bulkUpdateResourcesTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.BULK_UPDATE_RESOURCES,
    description:
      "Partially update existing rows in an agent-created resource group. " +
      "Each row must include 'id' (obtained from query_resources) plus only the columns to change. " +
      "Columns not included are preserved. Only works on agent-created groups (source=agent).",
    schema: schema as any,
    func: async ({
      groupId,
      groupName,
      rows,
    }: {
      groupId?: number;
      groupName?: string;
      rows: Record<string, any>[];
    }) => {
      const group = await resolveResourceGroup({ groupId, groupName });
      if (group.source !== ResourceGroupSource.AGENT) {
        throw new Error(
          `Cannot write to group "${group.name}" — only agent-created groups can be modified`,
        );
      }

      const columns = groupToColumns(group);
      const dbRows = rows.map((row) => ({
        id: row.id as number,
        update: Object.fromEntries(
          columns
            .map((col, index) => [col.name, index] as const)
            .filter(([colName]) => colName in row)
            .map(([colName, index]) => {
              const value = row[colName];
              return [
                `col${index + 1}`,
                value !== undefined && value !== null ? String(value) : null,
              ];
            }),
        ),
      }));

      const err = await resourceDB.bulkUpdateResourceByKey(group.id!, dbRows);
      if (err) {
        throw new Error(`Failed to update resources: ${err.message}`);
      }
      return safeStringify({
        groupId: group.id,
        groupName: group.name,
        updated: rows.length,
      });
    },
  });
