import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { safeStringify } from "@/electron/appAgent/utils";
import { ToolContext, PlanState } from "@/electron/appAgent/toolContext";

export const draftPlanTool = (toolContext: ToolContext) =>
  new DynamicStructuredTool({
    name: "draft_plan",
    description:
      "Enter planning mode before running any on-chain transaction, code, or workflow. " +
      "In planning mode, all execution tools are blocked — on-chain transactions, code execution (JS/Python), and workflow runs. " +
      "Read-only tools remain available (balances, token prices, web search, wallet info). " +
      "Use this tool first, then research and prepare your plan, then call submit_plan.",
    schema: z.object({}),
    func: async () => {
      toolContext.update({ planState: PlanState.DRAFTED });
      return safeStringify({
        status: "planning_mode_active",
        message:
          "Planning mode is now active. On-chain transactions, code execution, and workflow runs are blocked. " +
          "Research the operation (balances, prices, token info, web search), then call submit_plan with your execution summary.",
      });
    },
  });
