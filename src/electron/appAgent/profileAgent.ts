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
import { requestApprovalTool, confirmApprovalTool } from "./baseTool";
import {
  KeeperAgent,
  CreateProfileAgentOptions,
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

export const createAgentFromProfile = async (
  options: CreateProfileAgentOptions,
): Promise<KeeperAgent> => {
  const { profile, checkpointer, toolContext: providedToolContext } = options;

  const provider = (profile.llmProvider as LLMProvider) || LLMProvider.CLAUDE;
  const llm = await createLLM(provider, 0, profile.llmModel || undefined);

  const memoryFile = `AGENT_PROFILE_${profile.id}.md`;
  const MEMORY_VIRTUAL_PATH = `/memories/${memoryFile}`;

  const toolContext = providedToolContext || new ToolContext();
  toolContext.update({ llmProvider: provider, agentProfileId: profile.id });

  // Parse whitelist — empty array = allow all base tools (same as default agent)
  let allowedBaseToolsSet: Set<string> | null = null;
  if (
    Array.isArray(profile.allowedBaseTools) &&
    profile.allowedBaseTools.length > 0
  ) {
    allowedBaseToolsSet = new Set(profile.allowedBaseTools);
  }

  const isToolEnabled = (key: string): boolean =>
    allowedBaseToolsSet === null || allowedBaseToolsSet.has(key);

  const baseSubAgents = buildBaseSubAgents(toolContext, new Set<string>());
  const filteredSubAgents = baseSubAgents
    .filter((subagent) => {
      if (allowedBaseToolsSet === null) {
        return true;
      }
      const tools = subagent.tools || [];
      return tools.some((tool) => isToolEnabled(tool?.name || ""));
    })
    .map((subagent) => {
      if (allowedBaseToolsSet === null) {
        return subagent;
      }
      const prunedTools = (subagent.tools || []).filter((tool) =>
        isToolEnabled(tool?.name || ""),
      );
      return { ...subagent, tools: prunedTools };
    });

  // Load only allowed MCP servers
  let allowedMcpServerIds: Set<number> | null = null;
  if (profile.allowedMcpServerIds !== undefined) {
    allowedMcpServerIds = new Set<number>(profile.allowedMcpServerIds || []);
  }

  const { subAgents: mcpSubAgentInfos, closeClients } =
    await mcpToolLoader.loadMcpSubAgents();

  const mcpSubAgents = mcpSubAgentInfos
    .filter((info) =>
      allowedMcpServerIds === null
        ? true
        : allowedMcpServerIds.has(info.id || -1),
    )
    .map((info) => ({
      name: info.name,
      description: info.description,
      systemPrompt: `You are a subagent with access to tools from the "${info.name}" MCP server. Use the available tools to complete the user's task. Return results directly.`,
      tools: info.tools as any,
    }));

  const subagents: SubAgent[] = [...filteredSubAgents, ...mcpSubAgents];

  const skillRootDir = getSkillRootDir();
  const workspaceDir = getWorkspaceDir();
  const memoryDir = getMemoryDir();

  await ensureAgentMemoryFile(memoryFile);

  // Load only allowed skills
  const allowedSkillIdSet: Set<number> | null =
    Array.isArray(profile.allowedSkillIds) && profile.allowedSkillIds.length > 0
      ? new Set<number>(profile.allowedSkillIds)
      : null;

  const [enabledSkillsResult] = await agentSkillDB.getEnabledAgentSkills();
  const enabledFolders = new Set(
    (enabledSkillsResult || [])
      .filter((skill) =>
        allowedSkillIdSet === null
          ? true
          : allowedSkillIdSet.has(skill.id || -1),
      )
      .map((skill) => skill.folderName)
      .filter((folderName): folderName is string => !!folderName),
  );

  const backend = buildAgentBackend(
    workspaceDir,
    memoryDir,
    buildSkillsBackend(skillRootDir, enabledFolders),
  );

  const subagentNames = subagents.map((subagent) => subagent.name);
  const allowedTaskTypes = ["general-purpose", ...subagentNames];

  const systemPrompt =
    profile.systemPrompt || buildSystemPrompt(subagents, MEMORY_VIRTUAL_PATH);

  const agent = createDeepAgent({
    model: llm,
    systemPrompt,
    backend,
    tools: [
      requestApprovalTool(toolContext),
      confirmApprovalTool(toolContext),
    ] as any,
    skills: ["/skills/"],
    memory: [MEMORY_VIRTUAL_PATH],
    subagents,
    checkpointer: checkpointer || false,
    middleware: [
      createTaskSkillRedirectMiddleware(allowedTaskTypes),
      createSecretRestoreMiddleware(toolContext),
      createMemoryWriteGuardMiddleware(),
    ],
  });

  const subAgentsCount = subagents.length;
  const toolsCount = subagents.reduce(
    (sum, subagent) =>
      sum + (Array.isArray(subagent.tools) ? subagent.tools.length : 0),
    0,
  );
  const skillsCount = enabledFolders.size;

  return {
    agent,
    cleanup: closeClients,
    toolContext,
    subAgentsCount,
    toolsCount,
    skillsCount,
  };
};
