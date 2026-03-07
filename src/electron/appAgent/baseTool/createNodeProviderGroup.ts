import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { nodeEndpointGroupDB } from "@/electron/database/nodeEndpointGroup";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { logEveryWhere } from "@/electron/service/util";
import { CHAIN_TYPE } from "@/electron/constant";
import {
  findNodeEndpointGroupByName,
  normalizeChainType,
  safeStringify,
} from "@/electron/appAgent/utils";

export const createNodeProviderGroupTool = () =>
  new DynamicStructuredTool({
    name: "create_node_provider_group",
    description:
      "Create a node provider group and populate it with endpoints. Provide groupName, chainType (EVM, SOLANA, APTOS, SUI), and a comma-separated list of endpoints. The tool stores endpoints locally without sending them to external services.",
    schema: z.object({
      groupName: z.string().min(1, "groupName is required"),
      chainType: z.string().min(1, "chainType is required"),
      endpoints: z
        .string()
        .min(1, "endpoints must not be empty (comma separated list)")
        .transform((value) => value.trim()),
    }),
    func: async ({ groupName, chainType, endpoints }) => {
      const normalizedName = groupName.trim();
      const existingGroup = await findNodeEndpointGroupByName(normalizedName);
      if (existingGroup) {
        logEveryWhere({
          message: `[Agent] Node provider group "${normalizedName}" already exists (id=${existingGroup.id})`,
        });
        return safeStringify({
          status: "exists",
          group: existingGroup,
        });
      }

      const resolvedChainType = normalizeChainType(chainType);
      if (!resolvedChainType) {
        throw new Error(
          `Unsupported chainType "${chainType}". Supported values: ${Object.values(
            CHAIN_TYPE
          ).join(", ")}`
        );
      }

      const endpointList = endpoints
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (endpointList.length === 0) {
        throw new Error(
          "No valid endpoints found. Provide a comma-separated list of URLs."
        );
      }

      const [createdGroup, err] =
        await nodeEndpointGroupDB.createNodeEndpointGroup({
          name: normalizedName,
          chainType: resolvedChainType,
          note: "Auto-created via agent",
        });
      if (err) {
        throw err;
      }
      if (!createdGroup?.id) {
        throw new Error("Failed to create node provider group");
      }

      const bulkError = await nodeEndpointDB.createBulkNodeEndpoint(
        endpointList.map((endpoint: string) => ({
          groupId: createdGroup.id!,
          endpoint,
          isActive: true,
        }))
      );
      if (bulkError) {
        throw bulkError;
      }

      logEveryWhere({
        message: `[Agent] Created node provider group "${createdGroup.name}" with ${endpointList.length} endpoint(s)`,
      });

      return safeStringify({
        status: "created",
        group: createdGroup,
        numberOfEndpoints: endpointList.length,
      });
    },
  });
