import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { workflowManager } from "@/electron/simulator/workflow";
import { safeStringify } from "@/electron/appAgent/utils";

const schema = z.object({
  campaignId: z
    .number()
    .describe("Campaign ID (get from search_campaigns or search_workflows)"),
  workflowId: z
    .number()
    .describe("Workflow ID (get from search_campaigns or search_workflows)"),
});

export const stopWorkflowTool = () =>
  new DynamicStructuredTool({
    name: "stop_workflow",
    description:
      "Stop a currently running workflow on a campaign using their IDs.",
    schema,
    func: async ({ campaignId, workflowId }) => {
      const workflow = await workflowManager.getWorkflow(
        workflowId,
        campaignId,
        0,
      );

      if (!workflow.monitor.isRunning) {
        return safeStringify({
          error: `Workflow (ID: ${workflowId}) is not running on campaign (ID: ${campaignId})`,
        });
      }

      await workflow.stopWorkflow();
      return safeStringify({
        message: `Workflow (ID: ${workflowId}) stopped on campaign (ID: ${campaignId})`,
      });
    },
  });
