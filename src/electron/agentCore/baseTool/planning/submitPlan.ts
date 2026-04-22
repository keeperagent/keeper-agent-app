import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { safeStringify } from "@/electron/agentCore/utils";
import { ToolContext, PlanState } from "@/electron/agentCore/toolContext";
import { TOOL_KEYS } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";

export const confirmApprovalTool = (toolContext: ToolContext) =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.CONFIRM_APPROVAL,
    description:
      "Present your execution summary to the user and wait for approval before proceeding. " +
      "Must be called after request_approval and before running any transaction, code, or workflow. " +
      "Include: what will be executed, which wallets/amounts/tokens/scripts/workflows are involved, and the expected outcome. " +
      "All execution tools remain blocked until the user approves.",
    schema: z.object({
      summary: z
        .string()
        .min(1)
        .describe(
          "Clear summary of what will be executed: operations, wallets, amounts, tokens, expected outcome.",
        ),
    }),
    func: async ({ summary }) => {
      const plan = summary;
      if (toolContext.planState !== PlanState.DRAFTED) {
        return safeStringify({
          status: "error",
          message: "You must call request_approval first before confirming.",
        });
      }

      const requestApproval = toolContext.requestPlanApproval;

      if (requestApproval) {
        // Desktop app: send IPC to wait for user approval
        const approved = await requestApproval(plan);
        if (!approved) {
          logEveryWhere({
            message: `[Approval] Rejected by user | plan: ${plan.slice(0, 500)}`,
          });
          return safeStringify({
            status: "rejected",
            message:
              "User rejected the plan. Planning mode remains active. You may revise and submit a new plan.",
          });
        }

        toolContext.update({
          planState: PlanState.APPROVED,
          approvedPlan: plan,
        });
        logEveryWhere({
          message: `[Approval] Confirmed → execution unlocked | plan: ${plan.slice(0, 500)}`,
        });
        return safeStringify({
          status: "approved",
          message:
            "User approved the plan. You may now execute the operations.",
        });
      }

      // Non-IPC platforms (Telegram, WhatsApp): auto-approve and proceed
      toolContext.update({ planState: PlanState.APPROVED, approvedPlan: plan });
      return safeStringify({
        status: "plan_presented",
        plan,
        message:
          "Plan presented to user. Planning mode exited. Proceed with execution after user confirms.",
      });
    },
  });
