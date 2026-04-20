import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { resourceGroupDB } from "@/electron/database/resourceGroup";
import { ResourceGroupSource } from "@/electron/type";
import { safeStringify } from "@/electron/agentCore/utils";
import { columnsToGroupFields, groupToColumns } from "./utils";
import { TOOL_KEYS } from "@/electron/constant";

const schema = z.object({
  name: z.string().min(1).describe("Name for the resource group"),
  note: z
    .string()
    .optional()
    .describe("Description of what data this group stores"),
  columns: z
    .array(
      z.object({
        name: z
          .string()
          .describe("Column key in snake_case (e.g. wallet_address)"),
        type: z.enum(["text", "number", "boolean"]).describe("Data type"),
        description: z.string().optional().describe("Human-readable label"),
      }),
    )
    .min(1)
    .max(30)
    .describe("Column schema (max 30 columns)"),
});

export const createResourceGroupTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.CREATE_RESOURCE_GROUP,
    description:
      "Create a new resource group with a custom column schema to store structured data collected by the agent. " +
      "Use this before bulk_add_resources to define where data will be stored. " +
      "Examples: top token holders (wallet_address, token_balance), KOL list (kol_name, wallet_address, twitter_handle).",
    schema: schema as any,
    func: async ({
      name,
      note,
      columns,
    }: {
      name: string;
      note?: string;
      columns: {
        name: string;
        type: "text" | "number" | "boolean";
        description?: string;
      }[];
    }) => {
      const [group, err] = await resourceGroupDB.createResourceGroup({
        name,
        note,
        source: ResourceGroupSource.AGENT,
        ...columnsToGroupFields(columns),
      } as any);
      if (err || !group) {
        throw new Error(`Failed to create resource group: ${err?.message}`);
      }
      return safeStringify({
        groupId: group.id,
        name: group.name,
        columns: groupToColumns(group),
      });
    },
  });
