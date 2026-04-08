import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { agentTeamStore } from "@/electron/appAgent/agentTeam/store";
import { agentProfileDB } from "@/electron/database/agentProfile";
import { safeStringify } from "@/electron/appAgent/utils";

const schema = z.object({
  name: z.string().describe("Team name"),
  goal: z.string().describe("High-level goal the team is working towards"),
  agentIds: z
    .array(z.number())
    .min(1)
    .describe("Agent profile IDs to include in the team"),
});

export const createAgentTeamTool = () =>
  new DynamicStructuredTool({
    name: "create_agent_team",
    description:
      "Create an agent team with a shared goal. Returns a teamId used with get_team_progress and delegate_task. Teams are in-memory and reset on app restart.",
    schema: schema as any,
    func: async ({
      name,
      goal,
      agentIds,
    }: {
      name: string;
      goal: string;
      agentIds: number[];
    }) => {
      const agentInfos: { id: number; name: string }[] = [];
      for (const agentId of agentIds) {
        const [agent, err] = await agentProfileDB.getOneAgentProfile(agentId);
        if (err) {
          throw new Error(`Failed to load agent ${agentId}: ${err.message}`);
        }
        if (!agent) {
          throw new Error(`Agent not found: ${agentId}`);
        }
        agentInfos.push({ id: agent.id!, name: agent.name });
      }

      const team = agentTeamStore.createTeam(name, goal, agentIds);
      return safeStringify({
        teamId: team.id,
        name: team.name,
        goal: team.goal,
        agents: agentInfos,
      });
    },
  });
