import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { workflowManager } from "@/electron/simulator/workflow";
import { safeStringify } from "@/electron/appAgent/utils";

const schema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  workflowId: z.number().describe("Workflow ID"),
});

export const stopWorkflowTool = () =>
  new DynamicStructuredTool({
    name: "stop_workflow",
    description:
      "Stop a currently running workflow on a campaign using their IDs.",
    schema: schema as any,
    func: async ({
      campaignId,
      workflowId,
    }: {
      campaignId: number;
      workflowId: number;
    }) => {
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
