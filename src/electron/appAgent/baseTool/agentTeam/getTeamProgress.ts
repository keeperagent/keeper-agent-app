import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { agentTeamStore } from "@/electron/appAgent/agentTeam/store";
import { agentRegistryDB } from "@/electron/database/agentRegistry";
import { agentTaskDB } from "@/electron/database/agentTask";
import { AgentTaskStatus } from "@/electron/type";
import { safeStringify } from "@/electron/appAgent/utils";

const schema = z.object({
  teamId: z.number().describe("Team ID returned by create_agent_team"),
});

export const getTeamProgressTool = () =>
  new DynamicStructuredTool({
    name: "get_team_progress",
    description:
      "Get current progress of an agent team: agent stats, task statuses, and overall completion percentage.",
    schema: schema as any,
    func: async ({ teamId }: { teamId: number }) => {
      const team = agentTeamStore.getTeam(teamId);
      if (!team) {
        throw new Error(`Team not found: ${teamId}`);
      }

      const agentDetails = await Promise.all(
        team.agentIds.map(async (agentId) => {
          const [agent] = await agentRegistryDB.getOneAgentRegistry(agentId);
          return agent;
        }),
      );

      const [allTasks] = await agentTaskDB.getListAgentTask();
      const teamTasks = (allTasks || []).filter(
        (task) =>
          team.taskIds.includes(task.id!) ||
          team.agentIds.includes(task.assignedAgentId!),
      );

      const statusCounts: Record<string, number> = {};
      for (const task of teamTasks) {
        const status = task.status || "unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }

      const doneCount = statusCounts[AgentTaskStatus.DONE] || 0;
      const totalCount = teamTasks.length;
      const overallProgress =
        totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

      const agents = agentDetails.filter(Boolean).map((agent) => {
        const agentTasks = teamTasks.filter(
          (task) => task.assignedAgentId === agent!.id,
        );
        return {
          id: agent!.id,
          name: agent!.name,
          tasksTotal: agentTasks.length,
          tasksDone: agentTasks.filter(
            (task) => task.status === AgentTaskStatus.DONE,
          ).length,
          tasksInProgress: agentTasks.filter(
            (task) => task.status === AgentTaskStatus.IN_PROGRESS,
          ).length,
          tasksFailed: agentTasks.filter(
            (task) => task.status === AgentTaskStatus.FAILED,
          ).length,
        };
      });

      return safeStringify({
        teamId: team.id,
        name: team.name,
        goal: team.goal,
        overallProgress,
        taskSummary: { total: totalCount, ...statusCounts },
        agents,
        tasks: teamTasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assignedAgentId: task.assignedAgentId,
        })),
      });
    },
  });
