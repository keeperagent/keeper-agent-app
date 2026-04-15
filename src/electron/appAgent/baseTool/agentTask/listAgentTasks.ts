import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { AgentTaskStatus } from "@/electron/type";
import { agentTaskDB } from "@/electron/database/agentTask";
import { safeStringify } from "@/electron/appAgent/utils";
import { TOOL_KEYS } from "@/electron/constant";

const STATUS_MAP: Record<string, AgentTaskStatus> = {
  init: AgentTaskStatus.INIT,
  in_progress: AgentTaskStatus.IN_PROGRESS,
  done: AgentTaskStatus.DONE,
  failed: AgentTaskStatus.FAILED,
  cancelled: AgentTaskStatus.CANCELLED,
  expired: AgentTaskStatus.EXPIRED,
};

const schema = z.object({
  status: z
    .array(
      z.enum(["init", "in_progress", "done", "failed", "cancelled", "expired"]),
    )
    .optional()
    .describe("Filter by one or more task statuses"),
  assignedAgentId: z
    .number()
    .optional()
    .describe("Filter by assigned agent registry ID"),
  keyword: z
    .string()
    .optional()
    .describe("Filter by keyword in task title or description"),
  page: z.number().optional().describe("Page number (default 1)"),
  pageSize: z
    .number()
    .optional()
    .describe("Tasks per page (default 20, max 100)"),
});

export const listAgentTasksTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.LIST_AGENT_TASKS,
    description:
      "List agent tasks from the task pool. Supports filtering by status, assigned agent, or keyword. " +
      "Returns id, title, status, priority, assignedAgentId, and createdAt for each task.",
    schema: schema as any,
    func: async ({
      status,
      assignedAgentId,
      keyword,
      page,
      pageSize,
    }: {
      status?: string[];
      assignedAgentId?: number;
      keyword?: string;
      page?: number;
      pageSize?: number;
    }) => {
      const [allTasks, err] = await agentTaskDB.getListAgentTask();
      if (err || !allTasks) {
        throw new Error("Failed to fetch agent tasks");
      }

      let tasks = allTasks;

      if (status && status.length > 0) {
        const statusValues = status
          .map((statusKey) => STATUS_MAP[statusKey])
          .filter(Boolean);
        tasks = tasks.filter((task) => statusValues.includes(task.status!));
      }

      if (assignedAgentId !== undefined) {
        tasks = tasks.filter(
          (task) => task.assignedAgentId === assignedAgentId,
        );
      }

      if (keyword) {
        const lower = keyword.toLowerCase();
        tasks = tasks.filter(
          (task) =>
            task.title?.toLowerCase().includes(lower) ||
            task.description?.toLowerCase().includes(lower),
        );
      }

      const resolvedPage = Math.max(1, page || 1);
      const resolvedPageSize = Math.min(100, Math.max(1, pageSize || 20));
      const start = (resolvedPage - 1) * resolvedPageSize;
      const paginated = tasks.slice(start, start + resolvedPageSize);

      return safeStringify({
        total: tasks.length,
        page: resolvedPage,
        pageSize: resolvedPageSize,
        tasks: paginated.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignedAgentId: task.assignedAgentId,
          createdAt: task.createAt,
        })),
      });
    },
  });
