import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { agentTeamStore } from "@/electron/appAgent/agentTeam/store";
import { agentProfileDB } from "@/electron/database/agentProfile";
import { agentTaskDB } from "@/electron/database/agentTask";
import { agentTaskDispatcher } from "@/electron/service/agentTaskDispatcher";
import { sendToRenderer } from "@/electron/main";
import { MESSAGE } from "@/electron/constant";
import {
  AgentTaskStatus,
  AgentTaskPriority,
  AgentTaskCreatorType,
  AgentTaskSource,
} from "@/electron/type";
import { safeStringify } from "@/electron/appAgent/utils";
import type { ToolContext } from "@/electron/appAgent/toolContext";

const PRIORITY_MAP: Record<string, AgentTaskPriority> = {
  low: AgentTaskPriority.LOW,
  medium: AgentTaskPriority.MEDIUM,
  high: AgentTaskPriority.HIGH,
  urgent: AgentTaskPriority.URGENT,
};

const schema = z.object({
  teamId: z.number().describe("Team ID returned by create_agent_team"),
  title: z.string().describe("Task title"),
  description: z.string().optional().describe("Task description"),
  preferredAgentId: z
    .number()
    .optional()
    .describe(
      "Agent ID from the team to assign the task to. Omit for auto-assignment via dispatcher.",
    ),
  priority: z
    .enum(["low", "medium", "high", "urgent"])
    .optional()
    .describe("Task priority (default: medium)"),
  dueDate: z
    .number()
    .optional()
    .describe("Due date as Unix timestamp in milliseconds"),
});

export const delegateTaskTool = (toolContext: ToolContext) =>
  new DynamicStructuredTool({
    name: "delegate_task",
    description:
      "Delegate a task to an agent in the team. The task is created in the task pool and auto-dispatched. Use preferredAgentId to target a specific team member.",
    schema: schema as any,
    func: async ({
      teamId,
      title,
      description,
      preferredAgentId,
      priority,
      dueDate,
    }: {
      teamId: number;
      title: string;
      description?: string;
      preferredAgentId?: number;
      priority?: string;
      dueDate?: number;
    }) => {
      const team = agentTeamStore.getTeam(teamId);
      if (!team) {
        throw new Error(`Team not found: ${teamId}`);
      }

      if (
        preferredAgentId !== undefined &&
        !team.agentIds.includes(preferredAgentId)
      ) {
        throw new Error(
          `Agent ${preferredAgentId} is not a member of team ${teamId}. Team agents: ${team.agentIds.join(", ")}`,
        );
      }

      let assignedAgentId = preferredAgentId;
      if (assignedAgentId === undefined) {
        const [activeAgents] = await agentProfileDB.getActiveAgentProfiles();
        const teamActiveAgents = (activeAgents || []).filter((agent) =>
          team.agentIds.includes(agent.id!),
        );
        if (teamActiveAgents.length === 0) {
          throw new Error(`No active agents available in team ${teamId}`);
        }
        const inProgressCounts = await Promise.all(
          teamActiveAgents.map(async (agent) => {
            const [count] = await agentTaskDB.countInProgressByAgent(agent.id!);
            return { agentId: agent.id!, count: count || 0 };
          }),
        );
        assignedAgentId = inProgressCounts.reduce((least, current) =>
          current.count < least.count ? current : least,
        ).agentId;
      }

      const [task, err] = await agentTaskDB.createAgentTask({
        title,
        description,
        priority:
          PRIORITY_MAP[priority || "medium"] || AgentTaskPriority.MEDIUM,
        assignedAgentId,
        dueAt: dueDate,
        status: AgentTaskStatus.INIT,
        creatorType: AgentTaskCreatorType.AGENT,
        creatorAgentId: toolContext.agentProfileId,
        source: AgentTaskSource.INTERNAL,
        retryCount: 0,
        metadata: { teamId },
      });

      if (err || !task) {
        throw new Error(`Failed to delegate task: ${err?.message}`);
      }

      agentTeamStore.addTask(teamId, task.id!);
      agentTaskDispatcher.dispatch();
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);

      return safeStringify({
        success: true,
        taskId: task.id,
        assignedAgentId: task.assignedAgentId,
        status: task.status,
      });
    },
  });
