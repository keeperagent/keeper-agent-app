import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { agentTeamStore } from "@/electron/agentCore/agentTeam/store";
import { agentProfileDB } from "@/electron/database/agentProfile";
import { agentTaskDB } from "@/electron/database/agentTask";
import { AgentTaskStatus } from "@/electron/type";
import { safeStringify } from "@/electron/agentCore/utils";
import { TOOL_KEYS } from "@/electron/constant";

const schema = z.object({
  teamId: z.number().describe("Team ID returned by create_agent_team"),
});

export const getTeamProgressTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.GET_TEAM_PROGRESS,
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
          const [agent] = await agentProfileDB.getOneAgentProfile(agentId);
          return agent;
        }),
      );

      let [tasks] = await agentTaskDB.getListAgentTask({
        taskIds: team.taskIds,
        agentIds: team.agentIds,
      });
      tasks = tasks || [];

      const statusCounts: Record<string, number> = {};
      for (const task of tasks) {
        const status = task.status || "unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }

      const doneCount = statusCounts[AgentTaskStatus.DONE] || 0;
      const totalCount = tasks.length;
      const overallProgress =
        totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

      const agents = agentDetails.filter(Boolean).map((agent) => {
        const agentTasks = tasks.filter(
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
        tasks: tasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assignedAgentId: task.assignedAgentId,
        })),
      });
    },
  });
