import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import {
  AgentTaskStatus,
  AgentTaskPriority,
  AgentTaskCreatorType,
  AgentTaskSource,
} from "@/electron/type";
import { agentTaskDB } from "@/electron/database/agentTask";
import { agentTaskDispatcher } from "@/electron/service/agentTaskDispatcher";
import { sendToRenderer } from "@/electron/main";
import { MESSAGE } from "@/electron/constant";
import { safeStringify } from "@/electron/agentCore/utils";
import { TOOL_KEYS } from "@/electron/constant";

const PRIORITY_MAP: Record<string, AgentTaskPriority> = {
  low: AgentTaskPriority.LOW,
  medium: AgentTaskPriority.MEDIUM,
  high: AgentTaskPriority.HIGH,
  urgent: AgentTaskPriority.URGENT,
};

const schema = z.object({
  title: z.string().describe("Task title"),
  description: z.string().optional().describe("Task description"),
  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .optional()
    .describe("Task priority (default: medium)"),
  assignedAgentId: z
    .number()
    .optional()
    .describe(
      "Agent registry ID to assign the task to. Omit for automatic dispatcher assignment.",
    ),
  dueDate: z
    .number()
    .optional()
    .describe("Due date as Unix timestamp in milliseconds"),
});

export const createAgentTaskTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.CREATE_AGENT_TASK,
    description:
      "Create a new task in the agent task pool. The dispatcher will automatically assign it to the best available agent unless assignedAgentId is specified.",
    schema: schema as any,
    func: async ({
      title,
      description,
      priority,
      assignedAgentId,
      dueDate,
    }: {
      title: string;
      description?: string;
      priority?: string;
      assignedAgentId?: number;
      dueDate?: number;
    }) => {
      const [task, err] = await agentTaskDB.createAgentTask({
        title,
        description,
        priority:
          PRIORITY_MAP[priority || "medium"] || AgentTaskPriority.MEDIUM,
        assignedAgentId,
        dueAt: dueDate,
        status: AgentTaskStatus.INIT,
        creatorType: AgentTaskCreatorType.AGENT,
        source: AgentTaskSource.INTERNAL,
        retryCount: 0,
      });

      if (err || !task) {
        throw new Error(`Failed to create agent task: ${err?.message}`);
      }

      agentTaskDispatcher.dispatch();
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);

      return safeStringify({ success: true, task });
    },
  });
