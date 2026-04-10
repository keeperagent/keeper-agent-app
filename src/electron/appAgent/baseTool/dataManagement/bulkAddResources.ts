import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ResourceGroupSource } from "@/electron/type";
import { resourceDB } from "@/electron/database/resource";
import { safeStringify } from "@/electron/appAgent/utils";
import {
  groupToColumns,
  rowToResourceFields,
  resolveResourceGroup,
} from "./utils";

const schema = z
  .object({
    groupId: z.number().optional().describe("ID of the resource group"),
    groupName: z.string().optional().describe("Name of the resource group"),
    rows: z
      .array(z.record(z.any()))
      .min(1)
      .describe(
        "Array of row objects. Keys must match the group's column names.",
      ),
  })
  .refine((value) => Boolean(value.groupId || value.groupName), {
    message: "groupId or groupName is required",
  });

export const bulkAddResourcesTool = () =>
  new DynamicStructuredTool({
    name: "bulk_add_resources",
    description:
      "Insert rows into an agent-created resource group. Provide groupId or groupName. " +
      "Duplicate rows (identical values across all columns) are silently skipped.",
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
      if (columns.length === 0) {
        throw new Error("Resource group has no columns defined");
      }

      const resolvedGroupId = group.id!;
      const resourceRows = rows.map((row) =>
        rowToResourceFields(row, columns, resolvedGroupId),
      );
      const err = await resourceDB.createBulkResource(resourceRows as any);
      if (err) {
        throw new Error(`Failed to add resources: ${err.message}`);
      }
      return safeStringify({
        groupId: resolvedGroupId,
        groupName: group.name,
        added: rows.length,
      });
    },
  });
