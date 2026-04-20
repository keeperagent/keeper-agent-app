import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { resourceDB } from "@/electron/database/resource";
import { safeStringify } from "@/electron/agentCore/utils";
import { groupToColumns, resourceToRow, resolveResourceGroup } from "./utils";
import { TOOL_KEYS } from "@/electron/constant";

const schema = z
  .object({
    groupId: z
      .number()
      .optional()
      .describe("ID of the resource group to query"),
    groupName: z
      .string()
      .optional()
      .describe("Name of the resource group to query"),
    page: z.number().optional().describe("Page number (default 1)"),
    pageSize: z
      .number()
      .optional()
      .describe("Rows per page (default 100, max 500)"),
  })
  .refine((value) => Boolean(value.groupId || value.groupName), {
    message: "groupId or groupName is required",
  });

export const queryResourcesTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.QUERY_RESOURCES,
    description:
      "Read rows from a resource group with pagination. Works on all groups (agent and user created). " +
      "Provide groupId or groupName.",
    schema: schema as any,
    func: async ({
      groupId,
      groupName,
      page,
      pageSize,
    }: {
      groupId?: number;
      groupName?: string;
      page?: number;
      pageSize?: number;
    }) => {
      const group = await resolveResourceGroup({ groupId, groupName });

      const columns = groupToColumns(group);
      const resolvedPage = Math.max(1, page || 1);
      const resolvedPageSize = Math.min(500, Math.max(1, pageSize || 100));
      const resolvedGroupId = group.id!;

      const [result, err] = await resourceDB.getListResource({
        page: resolvedPage,
        pageSize: resolvedPageSize,
        groupId: resolvedGroupId,
      });
      if (err || !result) {
        throw new Error(`Failed to query resources: ${err?.message}`);
      }

      return safeStringify({
        groupId: resolvedGroupId,
        groupName: group.name,
        columns,
        total: result.totalData,
        page: resolvedPage,
        pageSize: resolvedPageSize,
        rows: result.data.map((resource) => ({
          id: resource?.id,
          ...resourceToRow(resource, columns),
        })),
      });
    },
  });
