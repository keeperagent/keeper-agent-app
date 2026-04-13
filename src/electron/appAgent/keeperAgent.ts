import type { SubAgent } from "deepagents";
import { agentSkillDB } from "@/electron/database/agentSkill";
import { LLMProvider } from "@/electron/type";
import {
  getSkillRootDir,
  getWorkspaceDir,
  getMemoryDir,
} from "@/electron/service/agentSkill";
import { mcpToolLoader } from "./mcpTool";
import { ToolContext } from "./toolContext";
import { createLLM } from "./llm";
import { getLlmSetting } from "./utils";
import { draftPlanTool, submitPlanTool } from "./baseTool";
import {
  createAgentTeamTool,
  getTeamProgressTool,
  delegateTaskTool,
} from "./baseTool/agentTeam";
import { BASE_TOOL_KEYS } from "./baseTool/registry";
import {
  DEFAULT_MEMORY_FILE,
  KeeperAgent,
  CreateAgentOptions,
  buildBaseSubAgents,
  buildSystemPrompt,
  buildSkillsBackend,
  buildAgentBackend,
  ensureAgentMemoryFile,
  createDeepAgent,
} from "./agentBuilder";
import {
  createTaskSkillRedirectMiddleware,
  createSecretRestoreMiddleware,
  createMemoryWriteGuardMiddleware,
} from "./middleware";

export const createKeeperAgent = async (
  options?: CreateAgentOptions,
): Promise<KeeperAgent> => {
  const provider = options?.provider || LLMProvider.CLAUDE;
  const llm = await createLLM(provider, options?.temperature || 0);

  const memoryFile = options?.memoryFile || DEFAULT_MEMORY_FILE;
  const MEMORY_VIRTUAL_PATH = `/memories/${memoryFile}`;
  const toolContext = options?.toolContext || new ToolContext();

  const [llmSetting] = await getLlmSetting();
  const disabledTools = new Set<string>(llmSetting?.disabledTools || []);

  toolContext.update({ llmProvider: provider });
  const baseSubAgents = buildBaseSubAgents(toolContext, disabledTools);

  const { subAgents: mcpSubAgentInfos, closeClients } =
    await mcpToolLoader.loadMcpSubAgents();

  const mcpSubAgents: SubAgent[] = mcpSubAgentInfos.map((info) => ({
    name: info.name,
    description: info.description,
    systemPrompt: `You are a subagent with access to tools from the "${info.name}" MCP server. Use the available tools to complete the user's task. Return results directly.`,
    tools: info.tools as any,
  }));

  const subagents: SubAgent[] = [...baseSubAgents, ...mcpSubAgents];

  const skillRootDir = getSkillRootDir();
  const workspaceDir = getWorkspaceDir();
  const memoryDir = getMemoryDir();

  await ensureAgentMemoryFile(memoryFile);

  const [enabledSkills] = await agentSkillDB.getEnabledAgentSkills();
  const enabledFolders = new Set(
    (enabledSkills || [])
      .map((s) => s.folderName)
      .filter((f): f is string => !!f),
  );

  const backend = buildAgentBackend(
    workspaceDir,
    memoryDir,
    buildSkillsBackend(skillRootDir, enabledFolders),
  );

  const subagentNames = subagents.map((s) => s.name);
  const allowedTaskTypes = ["general-purpose", ...subagentNames];

  const teamCoordinationTools = [
    !disabledTools.has(BASE_TOOL_KEYS.CREATE_AGENT_TEAM) &&
      createAgentTeamTool(),
    !disabledTools.has(BASE_TOOL_KEYS.GET_TEAM_PROGRESS) &&
      getTeamProgressTool(),
    !disabledTools.has(BASE_TOOL_KEYS.DELEGATE_TASK) &&
      delegateTaskTool(toolContext),
  ].filter((tool): any => Boolean(tool));

  const planningTools = [
    draftPlanTool(toolContext),
    submitPlanTool(toolContext),
  ];

  const agent = createDeepAgent({
    model: llm,
    systemPrompt: buildSystemPrompt(subagents, MEMORY_VIRTUAL_PATH),
    backend,
    tools: [...planningTools, ...teamCoordinationTools] as any,
    skills: ["/skills/"],
    memory: [MEMORY_VIRTUAL_PATH],
    subagents,
    checkpointer: options?.checkpointer || false,
    middleware: [
      createTaskSkillRedirectMiddleware(allowedTaskTypes),
      createSecretRestoreMiddleware(toolContext),
      createMemoryWriteGuardMiddleware(),
    ],
  });

  const subAgentsCount = subagents.length;
  const toolsCount = subagents.reduce(
    (sum, s) => sum + (Array.isArray(s.tools) ? s.tools.length : 0),
    0,
  );
  const skillsCount = (enabledSkills || []).length;

  return {
    agent,
    cleanup: closeClients,
    toolContext,
    subAgentsCount,
    toolsCount,
    skillsCount,
  };
};
