import { createMiddleware } from "langchain";
import { ToolMessage } from "@langchain/core/messages";
import { logEveryWhere } from "@/electron/service/util";
import { ToolContext, PlanState } from "@/electron/agentCore/toolContext";

// Blocks confirm_approval if request_approval hasn't been called first (planState not DRAFTED).
export const createConfirmApprovalGuardMiddleware = (
  toolContext: ToolContext,
) =>
  createMiddleware({
    name: "ConfirmApprovalGuard",
    wrapToolCall: async (request: any, handler: any) => {
      if (request?.toolCall?.name !== "confirm_approval") {
        return handler(request);
      }
      if (toolContext.planState !== PlanState.DRAFTED) {
        logEveryWhere({
          message: `[ConfirmApprovalGuard] Blocked confirm_approval — planState="${toolContext.planState}"`,
        });
        return new ToolMessage({
          content:
            "Error: You must call `request_approval` before `confirm_approval`. Call `request_approval` now to enter approval mode, then call `confirm_approval`.",
          tool_call_id: request?.toolCall?.id || "",
          status: "error",
        });
      }
      return handler(request);
    },
  });

// Blocks the deepagents built-in `execute` shell tool unless planning mode has been approved
export const createExecuteGuardMiddleware = (toolContext: ToolContext) =>
  createMiddleware({
    name: "ExecuteGuard",
    wrapToolCall: async (request: any, handler: any) => {
      if (request?.toolCall?.name !== "execute") {
        return handler(request);
      }
      if (toolContext.planState !== PlanState.APPROVED) {
        logEveryWhere({
          message: `[ExecuteGuard] Blocked execute — planState="${toolContext.planState}"`,
        });
        return new ToolMessage({
          content:
            "Error: Shell execution requires user approval. Call `request_approval` first, then `confirm_approval`, and only after approval is granted proceed with execution.",
          tool_call_id: request?.toolCall?.id || "",
          status: "error",
        });
      }
      return handler(request);
    },
  });
