import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { safeStringify } from "@/electron/appAgent/utils";
import { ToolContext, PlanState } from "@/electron/appAgent/toolContext";
import { TOOL_KEYS } from "@/electron/constant";

export const requestApprovalTool = (toolContext: ToolContext) =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.REQUEST_APPROVAL,
    description:
      "Enter approval mode before running any on-chain transaction, code, or workflow. " +
      "In approval mode, all execution tools are blocked — on-chain transactions, code execution (JS/Python), and workflow runs. " +
      "Read-only tools remain available (balances, token prices, web search, wallet info). " +
      "Use this tool first, then research and prepare your execution summary, then call confirm_approval.",
    schema: z.object({}),
    func: async () => {
      toolContext.update({ planState: PlanState.DRAFTED });
      return safeStringify({
        status: "approval_mode_active",
        message:
          "Approval mode is now active. On-chain transactions, code execution, and workflow runs are blocked. " +
          "Research the operation (balances, prices, token info, web search), then call confirm_approval with your execution summary.",
      });
    },
  });
