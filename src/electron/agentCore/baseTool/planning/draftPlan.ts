import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { safeStringify } from "@/electron/agentCore/utils";
import { ToolContext, PlanState } from "@/electron/agentCore/toolContext";
import { TOOL_KEYS } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";

export const requestApprovalTool = (toolContext: ToolContext) =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.REQUEST_APPROVAL,
    description:
      "Enter approval mode before any on-chain transaction, code execution, or workflow run. " +
      "Read-only tools remain available. Call confirm_approval after to present the execution summary.",
    schema: z.object({}),
    func: async () => {
      toolContext.update({ planState: PlanState.DRAFTED });
      logEveryWhere({
        message: "[Approval] Request sent → waiting for confirmation",
      });
      return safeStringify({
        status: "approval_mode_active",
        message:
          "Approval mode is now active. On-chain transactions, code execution, and workflow runs are blocked. " +
          "Research the operation (balances, prices, token info, web search), then call confirm_approval with your execution summary.",
      });
    },
  });
