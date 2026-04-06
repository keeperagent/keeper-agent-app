import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { safeStringify } from "@/electron/appAgent/utils";
import { ToolContext, PlanState } from "@/electron/appAgent/toolContext";

export const submitPlanTool = (toolContext: ToolContext) =>
  new DynamicStructuredTool({
    name: "submit_plan",
    description:
      "Present your execution plan to the user and wait for approval before proceeding. " +
      "Must be called after draft_plan and before running any transaction, code, or workflow. " +
      "Include in the plan: what will be executed, which wallets/amounts/tokens/scripts/workflows are involved, and the expected outcome. " +
      "All execution tools remain blocked until the user approves.",
    schema: z.object({
      plan: z
        .string()
        .min(1)
        .describe(
          "Clear summary of what will be executed: operations, wallets, amounts, tokens, expected outcome.",
        ),
    }),
    func: async ({ plan }) => {
      const requestApproval = toolContext.requestPlanApproval;

      if (requestApproval) {
        // Desktop app: send IPC to wait for user approval
        const approved = await requestApproval(plan);
        if (!approved) {
          return safeStringify({
            status: "rejected",
            message:
              "User rejected the plan. Planning mode remains active. You may revise and submit a new plan.",
          });
        }
        toolContext.update({ planState: PlanState.APPROVED });
        return safeStringify({
          status: "approved",
          message:
            "User approved the plan. You may now execute the operations.",
        });
      }

      // Non-IPC platforms (Telegram, WhatsApp): auto-approve and proceed
      toolContext.update({ planState: PlanState.APPROVED });
      return safeStringify({
        status: "plan_presented",
        plan,
        message:
          "Plan presented to user. Planning mode exited. Proceed with execution after user confirms.",
      });
    },
  });
