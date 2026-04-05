export interface IAgentTeam {
  id: number;
  name: string;
  goal: string;
  agentIds: number[];
  taskIds: number[];
  createdAt: number;
}

class AgentTeamStore {
  private nextId = 1;
  private teams = new Map<number, IAgentTeam>();

  createTeam(name: string, goal: string, agentIds: number[]): IAgentTeam {
    const id = this.nextId++;
    const team: IAgentTeam = {
      id,
      name,
      goal,
      agentIds,
      taskIds: [],
      createdAt: Date.now(),
    };
    this.teams.set(id, team);
    return team;
  }

  getTeam(id: number): IAgentTeam | null {
    return this.teams.get(id) || null;
  }

  addTask(teamId: number, taskId: number): void {
    const team = this.teams.get(teamId);
    if (team) {
      team.taskIds.push(taskId);
    }
  }
}

export const agentTeamStore = new AgentTeamStore();
