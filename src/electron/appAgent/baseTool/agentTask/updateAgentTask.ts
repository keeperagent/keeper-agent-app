import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { AgentTaskStatus, AgentTaskPriority } from "@/electron/type";
import { agentTaskDB } from "@/electron/database/agentTask";
import { sendToRenderer } from "@/electron/main";
import { MESSAGE } from "@/electron/constant";
import { safeStringify } from "@/electron/appAgent/utils";

const PRIORITY_MAP: Record<string, AgentTaskPriority> = {
  low: AgentTaskPriority.LOW,
  medium: AgentTaskPriority.MEDIUM,
  high: AgentTaskPriority.HIGH,
  urgent: AgentTaskPriority.URGENT,
};

const STATUS_MAP: Record<string, AgentTaskStatus> = {
  init: AgentTaskStatus.INIT,
  done: AgentTaskStatus.DONE,
  failed: AgentTaskStatus.FAILED,
  cancelled: AgentTaskStatus.CANCELLED,
};

const schema = z.object({
  id: z.number().describe("Task ID to update"),
  title: z.string().optional().describe("New task title"),
  description: z.string().optional().describe("New task description"),
  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .optional()
    .describe("New priority"),
  status: z
    .enum(["init", "done", "failed", "cancelled"])
    .optional()
    .describe(
      "New status. Use init to re-queue, done/failed/cancelled to close the task.",
    ),
  assignedAgentId: z
    .number()
    .optional()
    .describe("Reassign task to a different agent registry ID"),
  isPinned: z.boolean().optional().describe("Pin or unpin the task"),
  result: z
    .string()
    .optional()
    .describe("Task result as a JSON string or plain text"),
  errorMessage: z.string().optional().describe("Error details if task failed"),
});

export const updateAgentTaskTool = () =>
  new DynamicStructuredTool({
    name: "update_agent_task",
    description:
      "Update an agent task. Can change title, description, priority, status, assigned agent, pin state, result, or error message. " +
      "Status can be set to init (re-queue), done, failed, or cancelled.",
    schema: schema as any,
    func: async ({
      id,
      title,
      description,
      priority,
      status,
      assignedAgentId,
      isPinned,
      result,
      errorMessage,
    }: {
      id: number;
      title?: string;
      description?: string;
      priority?: string;
      status?: string;
      assignedAgentId?: number;
      isPinned?: boolean;
      result?: string;
      errorMessage?: string;
    }) => {
      const now = Date.now();
      const updateData: Record<string, any> = {};

      if (title !== undefined) {
        updateData.title = title;
      }
      if (description !== undefined) {
        updateData.description = description;
      }
      if (priority !== undefined) {
        const mappedPriority = PRIORITY_MAP[priority];
        if (mappedPriority !== undefined) {
          updateData.priority = mappedPriority;
        }
      }
      if (assignedAgentId !== undefined) {
        updateData.assignedAgentId = assignedAgentId;
      }
      if (isPinned !== undefined) {
        updateData.isPinned = isPinned;
      }
      if (result !== undefined) {
        try {
          updateData.result = JSON.parse(result);
        } catch {
          updateData.result = { value: result };
        }
      }
      if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage;
      }
      if (status !== undefined) {
        const mappedStatus = STATUS_MAP[status];
        if (mappedStatus !== undefined) {
          updateData.status = mappedStatus;
          if (status === "done" || status === "failed") {
            updateData.completedAt = now;
          } else if (status === "cancelled") {
            updateData.cancelledAt = now;
          }
        }
      }

      const [updated, err] = await agentTaskDB.updateAgentTask(id, updateData);
      if (err) {
        throw new Error(`Failed to update agent task: ${err.message}`);
      }

      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);

      return safeStringify({ success: true, task: updated });
    },
  });
