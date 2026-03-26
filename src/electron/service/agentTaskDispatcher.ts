import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  AgentTaskStatus,
  IAgentTask,
  IAgentRegistry,
  IAgentSkill,
  IMcpServer,
  IPreference,
  LLMProvider,
} from "@/electron/type";
import { agentTaskDB } from "@/electron/database/agentTask";
import { agentRegistryDB } from "@/electron/database/agentRegistry";
import { agentSkillDB } from "@/electron/database/agentSkill";
import { mcpServerDB } from "@/electron/database/mcpServer";
import { preferenceDB } from "@/electron/database/preference";
import { logEveryWhere } from "@/electron/service/util";
import { sendToRenderer } from "@/electron/main";
import { MESSAGE } from "@/electron/constant";
import { agentTaskExecutor } from "@/electron/service/agentTaskExecutor";

const LLM_MATCH_TIMEOUT_MS = 15_000;

interface UnassignedDispatchContext {
  preference: IPreference;
  activeAgents: IAgentRegistry[];
  allSkills: IAgentSkill[];
  allMcpServers: IMcpServer[];
}

class TaskDispatcher {
  private staleIntervalId: ReturnType<typeof setInterval> | null = null;
  private isDispatching = false;
  private pendingDispatch = false;

  dispatch = async (): Promise<void> => {
    if (this.isDispatching) {
      this.pendingDispatch = true;
      return;
    }
    this.isDispatching = true;

    try {
      await this.runDispatch();
    } catch (err: any) {
      logEveryWhere({
        message: `TaskDispatcher.dispatch() error: ${err?.message}`,
      });
    } finally {
      this.isDispatching = false;
      if (this.pendingDispatch) {
        this.pendingDispatch = false;
        setImmediate(() => this.dispatch());
      }
    }
  };

  startStaleWorker = (): void => {
    if (this.staleIntervalId) {
      return;
    }

    this.staleIntervalId = setInterval(() => {
      this.requeueAndDispatch().catch((err) => {
        logEveryWhere({
          message: `requeueAndDispatch() error: ${err?.message}`,
        });
      });
    }, 60 * 1000);
  };

  recoverOnStartup = async (): Promise<void> => {
    const [count] = await agentTaskDB.requeueAllInProgressTasks();
    if (count > 0) {
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
      await this.dispatch();
    }
  };

  stopStaleWorker = (): void => {
    if (this.staleIntervalId) {
      clearInterval(this.staleIntervalId);
      this.staleIntervalId = null;
    }
  };

  private runDispatch = async (): Promise<void> => {
    const [tasks, tasksErr] = await agentTaskDB.getTasksByStatus(
      AgentTaskStatus.INIT,
    );
    if (tasksErr || !tasks || tasks.length === 0) {
      return;
    }

    const hasUnassigned = tasks.some((task) => !task.assignedAgentId);
    let unassignedContext: UnassignedDispatchContext | null = null;

    if (hasUnassigned) {
      unassignedContext = await this.buildUnassignedContext();
    }

    for (const task of tasks) {
      if (!task.id) {
        continue;
      }

      if (task.assignedAgentId) {
        const maxConcurrent = await this.getAgentMaxConcurrent(
          task.assignedAgentId,
        );
        const [runningCount, runningCountErr] =
          await agentTaskDB.countInProgressByAgent(task.assignedAgentId);
        if (runningCountErr) {
          continue;
        }
        if (runningCount >= maxConcurrent) {
          continue;
        }

        const [claimed] = await agentTaskDB.claimAgentTask(
          task.id,
          task.assignedAgentId,
          maxConcurrent,
        );
        if (claimed) {
          agentTaskExecutor.execute(task.id, task.assignedAgentId, () =>
            this.dispatch(),
          );
          sendToRenderer(MESSAGE.AGENT_TASK_ASSIGNED, {
            taskId: task.id,
            agentId: task.assignedAgentId,
          });
          sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
        }
      } else if (unassignedContext) {
        await this.claimForAvailableAgent(task, unassignedContext);
      }
    }
  };

  private buildUnassignedContext =
    async (): Promise<UnassignedDispatchContext | null> => {
      const [preference, prefErr] = await preferenceDB.getOnePreference();
      if (prefErr || !preference?.llmProvider) {
        return null;
      }

      const llmConfig = this.getLLMConfig(preference);
      if (!llmConfig) {
        return null;
      }

      const [activeAgents, agentsErr] =
        await agentRegistryDB.getActiveAgentRegistries();
      if (agentsErr || !activeAgents || activeAgents.length === 0) {
        return null;
      }

      const [allSkills] = await agentSkillDB.getEnabledAgentSkills();
      const [allMcpResult] = await mcpServerDB.getListMcpServer(1, 1000);
      const allMcpServers = allMcpResult?.data || [];

      return {
        preference,
        activeAgents,
        allSkills: allSkills || [],
        allMcpServers,
      };
    };

  private claimForAvailableAgent = async (
    task: IAgentTask,
    context: UnassignedDispatchContext,
  ): Promise<void> => {
    const { preference, activeAgents, allSkills, allMcpServers } = context;

    const candidates = this.textPreFilter(task, activeAgents);
    const candidateIds = new Set(candidates.map((agent) => agent.id));
    const agentsToCheck = [
      ...candidates,
      ...activeAgents.filter((agent) => !candidateIds.has(agent.id)),
    ];

    const chosenAgentId = await this.llmMatchAgent(
      task,
      agentsToCheck,
      allSkills,
      allMcpServers,
      preference,
    );
    if (!chosenAgentId) {
      return;
    }

    const chosenAgent = agentsToCheck.find(
      (agent) => agent.id === chosenAgentId,
    );
    if (!chosenAgent?.id) {
      return;
    }

    const maxConcurrent = chosenAgent.maxConcurrentTasks || 1;
    const [runningCount, runningCountErr] =
      await agentTaskDB.countInProgressByAgent(chosenAgent.id);
    if (runningCountErr || runningCount >= maxConcurrent) {
      return;
    }

    const [claimed] = await agentTaskDB.claimAgentTask(
      task.id!,
      chosenAgent.id,
      maxConcurrent,
    );
    if (claimed) {
      agentTaskExecutor.execute(task.id!, chosenAgent.id, () =>
        this.dispatch(),
      );
      sendToRenderer(MESSAGE.AGENT_TASK_ASSIGNED, {
        taskId: task.id,
        agentId: chosenAgent.id,
      });
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
    }
  };

  private textPreFilter = (
    task: IAgentTask,
    agents: IAgentRegistry[],
  ): IAgentRegistry[] => {
    const rawText = `${task.title || ""} ${task.description || ""}`;
    const words = rawText
      .split(/\s+/)
      .filter((word) => word.length > 2 || /^[A-Z]{2,}$/.test(word))
      .map((word) => word.toLowerCase());
    if (words.length === 0) {
      return [];
    }

    return agents.filter((agent) => {
      const agentText =
        `${agent.name || ""} ${agent.description || ""}`.toLowerCase();
      return words.some((word) => agentText.includes(word));
    });
  };

  private llmMatchAgent = async (
    task: IAgentTask,
    agents: IAgentRegistry[],
    allSkills: IAgentSkill[],
    allMcpServers: IMcpServer[],
    preference: IPreference,
  ): Promise<number | null> => {
    const llmConfig = this.getLLMConfig(preference);
    if (!llmConfig) {
      return null;
    }

    const candidateIds = new Set(agents.map((agent) => agent.id));

    const agentPayloads = agents.map((agent) => {
      const skills = (agent.allowedSkillIds || [])
        .map((skillId) => allSkills.find((skill) => skill.id === skillId))
        .filter(Boolean)
        .map((skill) => ({
          name: skill!.name,
          description: skill!.description || "",
        }));

      const mcpServers = (agent.allowedMcpServerIds || [])
        .map((mcpId) => allMcpServers.find((mcp) => mcp.id === mcpId))
        .filter(Boolean)
        .map((mcp) => ({
          name: mcp!.name,
          description: mcp!.description || "",
        }));

      return {
        id: agent.id,
        name: agent.name,
        description: agent.description || "",
        tools: agent.allowedBaseTools || [],
        skills,
        mcpServers,
      };
    });

    const payload = {
      task: {
        id: task.id,
        title: task.title,
        description: task.description || "",
      },
      agents: agentPayloads,
    };

    const prompt = `You are a task router. Given a task and a list of agents, return the ID of the most suitable agent.

Input:
${JSON.stringify(payload, null, 2)}

Reply with a JSON object in this exact format: { "agentId": <number> }
Use agentId 0 if no agent is suitable. Return only the JSON object, no other text.`;

    try {
      const provider = preference.llmProvider as LLMProvider;
      let responseContent: string;

      const abortController = new AbortController();
      let timeoutId: any = null;
      const timeoutPromise = new Promise<any>((_, reject) => {
        timeoutId = setTimeout(() => {
          abortController.abort();
          reject(
            new Error(
              `llmMatchAgent timed out after ${LLM_MATCH_TIMEOUT_MS}ms`,
            ),
          );
        }, LLM_MATCH_TIMEOUT_MS);
      });

      switch (provider) {
        case LLMProvider.CLAUDE: {
          const llm = new ChatAnthropic({
            anthropicApiKey: llmConfig.apiKey,
            model: llmConfig.model,
            temperature: 0,
          });
          const result = await Promise.race([
            llm.invoke([{ role: "user", content: prompt }], {
              signal: abortController.signal,
            }),
            timeoutPromise,
          ]);
          clearTimeout(timeoutId!);
          responseContent = String(result.content).trim();
          break;
        }
        case LLMProvider.GEMINI: {
          const llm = new ChatGoogleGenerativeAI({
            apiKey: llmConfig.apiKey,
            model: llmConfig.model,
            temperature: 0,
          });
          const result = await Promise.race([
            llm.invoke([{ role: "user", content: prompt }], {
              signal: abortController.signal,
            }),
            timeoutPromise,
          ]);
          clearTimeout(timeoutId!);
          responseContent = String(result.content).trim();
          break;
        }
        default: {
          const llm = new ChatOpenAI({
            apiKey: llmConfig.apiKey,
            model: llmConfig.model,
            temperature: 0,
          });
          const result = await Promise.race([
            llm.invoke([{ role: "user", content: prompt }], {
              signal: abortController.signal,
            }),
            timeoutPromise,
          ]);
          clearTimeout(timeoutId!);
          responseContent = String(result.content).trim();
          break;
        }
      }

      const parsed = JSON.parse(responseContent);
      const agentId = parsed?.agentId;
      if (!agentId || !candidateIds.has(agentId)) {
        return null;
      }
      return agentId;
    } catch (err: any) {
      logEveryWhere({
        message: `llmMatchAgent() error: ${err?.message}`,
      });
      return null;
    }
  };

  private getLLMConfig = (
    preference: IPreference,
  ): { apiKey: string; model: string } | null => {
    const provider = preference.llmProvider as LLMProvider;
    switch (provider) {
      case LLMProvider.CLAUDE: {
        if (!preference.anthropicApiKey || !preference.anthropicModel) {
          return null;
        }
        return {
          apiKey: preference.anthropicApiKey,
          model: preference.anthropicModel,
        };
      }
      case LLMProvider.OPENAI: {
        if (!preference.openAIApiKey || !preference.openAIModel) {
          return null;
        }
        return {
          apiKey: preference.openAIApiKey,
          model: preference.openAIModel,
        };
      }
      case LLMProvider.GEMINI: {
        if (!preference.googleGeminiApiKey || !preference.googleGeminiModel) {
          return null;
        }
        return {
          apiKey: preference.googleGeminiApiKey,
          model: preference.googleGeminiModel,
        };
      }
      default:
        return null;
    }
  };

  private getAgentMaxConcurrent = async (agentId: number): Promise<number> => {
    const [agent] = await agentRegistryDB.getOneAgentRegistry(agentId);
    return agent?.maxConcurrentTasks || 1;
  };

  private requeueAndDispatch = async (): Promise<void> => {
    const now = new Date().getTime();

    const [expiredCount] = await agentTaskDB.expireOverdueTasks(now);
    if (expiredCount > 0) {
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
    }

    const [requeuedCount] = await agentTaskDB.requeueStaleTasks(now);
    if (requeuedCount > 0) {
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
      await this.dispatch();
    }
  };
}

const agentTaskDispatcher = new TaskDispatcher();
export { agentTaskDispatcher };
