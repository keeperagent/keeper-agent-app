import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MemorySaver } from "@langchain/langgraph";
import { createMiddleware } from "langchain";
import {
  createDeepAgent,
  FilesystemBackend,
  CompositeBackend,
} from "deepagents";
import type { DeepAgent, SubAgent } from "deepagents";
import path from "path";
import fs from "fs-extra";
import {
  getSkillRootDir,
  getWorkspaceDir,
  getMemoryDir,
} from "@/electron/service/agentSkill";
import { agentSkillDB } from "@/electron/database/agentSkill";
import {
  createCampaignForProfileGroupTool,
  createProfileGroupWithProfilesTool,
  createWalletGroupTool,
  generateWalletsForGroupTool,
  createNodeProviderGroupTool,
  getSolanaTokenBalanceTool,
  getEvmTokenBalanceTool,
  swapOnJupiterTool,
  swapOnKyberswapTool,
  transferSolanaTokenTool,
  getTokenPriceTool,
  launchPumpfunTokenTool,
  launchBonkfunTokenTool,
  executeJavaScriptTool,
  executePythonTool,
} from "./baseTool";
import { BASE_TOOL_KEYS } from "./baseTool/registry";
import { mcpToolLoader } from "./mcpTool";
import {
  getOpenAIKey,
  getAnthropicKey,
  getGoogleGeminiKey,
  getOpenAIModel,
  getAnthropicModel,
  getGoogleGeminiModel,
} from "./utils";
import { preferenceDB } from "@/electron/database/preference";
import { LLMProvider } from "@/electron/type";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { ToolContext } from "./toolContext";

const MEMORY_FILE = "AGENT.md";
const MEMORY_TEMPLATE = "# Agent Memory\n";

const ensureAgentMemoryFile = async (): Promise<void> => {
  const memoryDir = getMemoryDir();
  const memoryPath = path.join(memoryDir, MEMORY_FILE);
  await fs.ensureDir(memoryDir);
  if (!(await fs.pathExists(memoryPath))) {
    await fs.writeFile(memoryPath, MEMORY_TEMPLATE);
  }
};

const MEMORY_VIRTUAL_PATH = `/memories/${MEMORY_FILE}`;

const buildSystemPrompt = (subagents: SubAgent[]) => {
  const workspacePath = getWorkspaceDir();
  const subagentNames = subagents.map((s) => s.name);
  const allowedAgents = subagentNames.map((n) => `"${n}"`).join(", ");
  const subagentList = subagents
    .map((s) => `- **${s.name}**: ${s.description}`)
    .join("\n");
  return `You are Keeper Agent, an AI assistant for crypto wallets, campaigns, profiles, and on-chain operations.

## Memory
Read \`${MEMORY_VIRTUAL_PATH}\` at conversation start. Save user preferences there when told.

## Priority: skills → subagents → tools
1. Check \`/skills/\` first; read the relevant SKILL.md and follow it.
2. Use \`task\` tool (subagents) or other tools only when no skill applies.

## Subagents
${subagentList}

## Files
Workspace: \`${workspacePath}\`. Use relative paths for read_file/write_file (e.g. \`/javascript/file.js\`). For local filesystem or binary files, delegate to "Code execution agent".

## CRITICAL: task tool + skills
- \`task\` accepts ONLY \`subagent_type\` = one of: ${allowedAgents}. Skill names will error.
- Skills are SKILL.md docs under \`/skills/\`, NOT agents. To use: read_file the SKILL.md → follow it → if code needed, delegate to "Code execution agent".

## Solana wallet address and transaction hash format
Render addresses/txhashes as Solscan links using the format for the platformId in CURRENT CONTEXT:
- TELEGRAM: HTML — \`<a href="https://solscan.io/account/<full_address>">first6...last4</a>\` for wallets; \`<a href="https://solscan.io/tx/<full_hash>">first6...last4</a>\` for tx hashes.
- KEEPER/others: Markdown — \`[first6...last4](https://solscan.io/account/<full_address>)\` for wallets; \`[first6...last4](https://solscan.io/tx/<full_hash>)\` for tx hashes.
Always shorten the display text.

## Swap strategy rules
- "buy total X" / "buy total $X" → TOTAL_SPLIT_RANDOM (split total randomly across wallets)
- "buy randomly" / "buy random" → RANDOM_PER_WALLET
- Default (no keyword) → EQUAL_PER_WALLET (same amount per wallet)

## USD to native conversion for swaps
When the user wants to BUY tokens with a USD amount (e.g. "buy $0.2 this token"):
1. First delegate to transaction_agent to call get_token_price with tokenAddress='' (empty) to get the native token price (SOL/ETH/BNB).
2. Calculate: nativeAmount = usdAmount / nativePrice. Example: $0.2 / $85 SOL = 0.00235 SOL.
3. Then delegate the swap to transaction_agent with the NATIVE amount AND the correct strategy (see rules above). NEVER pass USD amounts to the transaction agent.

When the user wants to SELL tokens for a USD amount (e.g. "sell $10 worth"):
1. Delegate to transaction_agent to call get_token_price with the token's address.
2. Calculate: tokenAmount = usdAmount / tokenPrice.
3. Then delegate the sell with the token amount.

## Rules
- On tool failure: try ONE alternative, then report to user.
- Swap/transfer confirmations MUST use structured format, not bullet points: TELEGRAM uses bold-labeled fields (<b>Field:</b> Value, one per line); KEEPER/others use a Markdown table.
- CRITICAL: After the user confirms a swap/transfer, you MUST delegate execution to the transaction subagent via the \`task\` tool. NEVER pretend the transaction is executing or generate fake results — always call the actual tool. Include the current platformId in the task description when delegating to transaction_agent (e.g. "platformId=TELEGRAM").
- When the user asks how to use any capability: delegate to the relevant subagent to explain the tool's parameters and usage. Do NOT answer from general knowledge — describe YOUR tools, not external websites or UIs.
- When displaying results from subagents, always apply the Solana link format rules above. Reformat any raw addresses or tx hashes into shortened Solscan links using the format for the current platformId.
- Keep responses concise.

## Output format
Adapt output based on the "platformId" field in the CURRENT CONTEXT of each message:
- TELEGRAM: Use Telegram HTML tags only — never use Markdown syntax.
- KEEPER: Use Markdown. Prefer markdown tables over long lists or bullet points when presenting structured information.`;
};

/**
 * When the agent passes a skill name (or other invalid value) as task
 * subagent_type, rewrite it to "Code execution agent" so the task runs
 * instead of throwing. The description is kept so the code execution agent
 * still knows what to do.
 */
const createTaskSkillRedirectMiddleware = (allowedSubagentNames: string[]) => {
  const allowedSet = new Set(
    allowedSubagentNames.map((n) => n.toLowerCase().trim()),
  );
  return createMiddleware({
    name: "TaskSkillRedirect",
    wrapToolCall: async (request, handler) => {
      const toolName = (request as any).toolCall?.name;
      if (toolName !== "task") return handler(request);

      const args =
        (request as any).toolCall?.args || (request as any).toolCall?.kwargs;
      const requestedType = args?.subagent_type;
      if (typeof requestedType !== "string") return handler(request);

      const key = requestedType.trim().toLowerCase();
      if (allowedSet.has(key)) return handler(request);

      const codeExecutionAgent = allowedSubagentNames.find(
        (n) => n.toLowerCase() === "code_execution_agent",
      );
      if (!codeExecutionAgent) return handler(request);

      const normalizedRequest = {
        ...request,
        toolCall: {
          ...(request as any).toolCall,
          args: {
            ...args,
            subagent_type: codeExecutionAgent,
          },
        },
      };
      return handler(normalizedRequest);
    },
  });
};

const buildBaseSubAgents = (
  toolContext: ToolContext,
  disabledTools: Set<string>,
): SubAgent[] => {
  const isEnabled = (key: string) => !disabledTools.has(key);

  const appManagementTools = [
    isEnabled(BASE_TOOL_KEYS.CREATE_WALLET_GROUP) && createWalletGroupTool(),
    isEnabled(BASE_TOOL_KEYS.GENERATE_WALLETS_FOR_GROUP) &&
      generateWalletsForGroupTool(),
    isEnabled(BASE_TOOL_KEYS.CREATE_PROFILE_GROUP_WITH_PROFILES) &&
      createProfileGroupWithProfilesTool(),
    isEnabled(BASE_TOOL_KEYS.CREATE_CAMPAIGN_FOR_PROFILE_GROUP) &&
      createCampaignForProfileGroupTool(),
    isEnabled(BASE_TOOL_KEYS.CREATE_NODE_PROVIDER_GROUP) &&
      createNodeProviderGroupTool(),
  ].filter((tool): any => Boolean(tool));

  const transactionTools = [
    isEnabled(BASE_TOOL_KEYS.GET_EVM_TOKEN_BALANCE) &&
      getEvmTokenBalanceTool(toolContext),
    isEnabled(BASE_TOOL_KEYS.GET_SOLANA_TOKEN_BALANCE) &&
      getSolanaTokenBalanceTool(toolContext),
    isEnabled(BASE_TOOL_KEYS.GET_TOKEN_PRICE) && getTokenPriceTool(),
    isEnabled(BASE_TOOL_KEYS.LAUNCH_BONKFUN_TOKEN) &&
      launchBonkfunTokenTool(toolContext),
    isEnabled(BASE_TOOL_KEYS.LAUNCH_PUMPFUN_TOKEN) &&
      launchPumpfunTokenTool(toolContext),
    isEnabled(BASE_TOOL_KEYS.SWAP_ON_JUPITER) && swapOnJupiterTool(toolContext),
    isEnabled(BASE_TOOL_KEYS.SWAP_ON_KYBERSWAP) &&
      swapOnKyberswapTool(toolContext),
    isEnabled(BASE_TOOL_KEYS.TRANSFER_SOLANA_TOKEN) &&
      transferSolanaTokenTool(toolContext),
  ].filter((tool): any => Boolean(tool));

  const codeExecutionTools = [
    isEnabled(BASE_TOOL_KEYS.EXECUTE_JAVASCRIPT) && executeJavaScriptTool(),
    isEnabled(BASE_TOOL_KEYS.EXECUTE_PYTHON) && executePythonTool(),
  ].filter((tool): any => Boolean(tool));

  const agents = [];

  if (appManagementTools.length > 0) {
    agents.push({
      name: "app_management_agent",
      description:
        "Manages Campaign, Profile, Wallet, and Node Provider of this application",
      systemPrompt:
        "You are a subagent responsible for managing application resources including Campaigns, Profiles, Wallets, and Node Providers. Use the available tools to complete the user's task. Return results directly.",
      tools: appManagementTools as any,
    });
  }

  if (transactionTools.length > 0) {
    agents.push({
      name: "transaction_agent",
      description:
        "Handles on-chain operations: checking balances, token prices, swaps, transfers, and token launches on Solana and EVM chains",
      systemPrompt:
        "You are a subagent for on-chain operations (balances, prices, swaps, transfers, token launch on Pump.fun and Bonk.fun). Follow these rules exactly.\n\n" +
        "## Platform detection\n" +
        "Check the task description for 'platformId=TELEGRAM'. If found, use HTML formatting; otherwise use Markdown.\n\n" +
        "## Swap/Transfer procedure\n" +
        "1. Show confirmation and STOP. Wait for user approval.\n" +
        "2. After user confirms, IMMEDIATELY call the swap/transfer tool. Do NOT output text — just call the tool.\n\n" +
        "## Confirmation — TELEGRAM (bold-labeled fields):\n" +
        "<b>Action:</b> BUY or SELL\n<b>Token:</b> [mint address]\n<b>Amount:</b> [amount in native token, e.g. 0.00235 SOL]\n<b>Wallets:</b> [count]\n<b>Strategy:</b> [strategy name]\n\n" +
        "## Confirmation — KEEPER/others (Markdown table):\n" +
        "| Field | Value |\n|-------|-------|\n| Action | BUY or SELL |\n| Token | [mint address] |\n| Amount | [amount in native token, e.g. 0.00235 SOL] |\n| Wallets | [count] |\n| Strategy | [strategy name] |\n\n" +
        "No extra fields. No wallet balance. No token price. No estimated tokens. No bullet points.\n\n" +
        "## FORBIDDEN\n" +
        "- Do NOT call get_token_price on the output/target token when buying.\n" +
        "- Do NOT estimate tokens the user will receive.\n" +
        "- Do NOT comment on token liquidity, price, or whether it is newly launched.\n" +
        "- Do NOT check wallet balance before swaps.\n\n" +
        "## Displaying results\n" +
        "When the tool returns a 'results' array (wallets <= 5):\n" +
        "- TELEGRAM: one entry per wallet using bold-labeled fields — <b>Wallet:</b> <a href='https://solscan.io/account/[address]'>[first6...last4]</a> <b>Amount:</b> [amount] <b>Tx:</b> <a href='https://solscan.io/tx/[hash]'>[first6...last4]</a> (or error text).\n" +
        "- KEEPER/others: Markdown table — | Wallet | Amount | Tx Hash | with Markdown links [first6...last4](https://solscan.io/account/[address]) and [first6...last4](https://solscan.io/tx/[hash]) (or error text).\n\n" +
        "## General\n" +
        "- Keep responses short.\n" +
        "## On tool failure\n" +
        "Try ONE alternative, then report the error.",
      tools: transactionTools as any,
    });
  }

  if (codeExecutionTools.length > 0) {
    agents.push({
      name: "code_execution_agent",
      description:
        "Executes JavaScript or Python code to fetch data from external APIs, process data, or run any custom logic. Use this for tasks that require code execution, API calls, or data processing.",
      systemPrompt:
        "You are a subagent that executes code. Use execute_javascript for JS code or execute_python for Python code. " +
        "Pass the ENTIRE code as a single STRING to the tool input. Do NOT use write_file — you don't have it. " +
        "For JS: use console.log() to output results. For Python: use print() to output results. Only stdout is returned. " +
        "When generating files, ALWAYS use relative paths (e.g. 'output.pdf', NOT '/output.pdf'). The working directory is already writable. Print the filename when done. " +
        "You MUST await all async calls. npm/pip packages are auto-installed on first use. " +
        "When making HTTP requests, always set a User-Agent header (e.g. 'Mozilla/5.0') to avoid being blocked by APIs. " +
        "If a request fails, try fixing the code (add headers, change endpoint, etc.) before giving up. " +
        "Do NOT retry with the exact same code. Do NOT say you cannot do something — you have full Node.js/Python capabilities. " +
        "Report the result back.",
      tools: codeExecutionTools as any,
    });
  }

  return agents;
};

type CreateAgentOptions = {
  temperature?: number;
  checkpointer?: MemorySaver;
  provider?: LLMProvider;
  /** Shared mutable context injected into all tools (nodeEndpointGroupId, encryptKey). */
  toolContext?: ToolContext;
};

type KeeperAgent = {
  agent: DeepAgent;
  cleanup: () => Promise<void>;
  toolContext: ToolContext;
  subAgentsCount: number;
  toolsCount: number;
  skillsCount: number;
};

const createLLM = async (provider: LLMProvider, temperature = 0) => {
  switch (provider) {
    case LLMProvider.CLAUDE: {
      const [apiKey] = await getAnthropicKey();
      if (!apiKey) {
        throw new Error(
          "Anthropic API key is not found, please set it in the Settings page",
        );
      }
      const preferredModel = await getAnthropicModel();
      const modelName = preferredModel || DEFAULT_LLM_MODELS[provider];
      return new ChatAnthropic({
        anthropicApiKey: apiKey,
        model: modelName,
        temperature,
        streaming: true,
      });
    }

    case LLMProvider.GEMINI: {
      const [apiKey] = await getGoogleGeminiKey();
      if (!apiKey) {
        throw new Error(
          "Google Gemini API key is not found, please set it in the Settings page",
        );
      }
      const preferredModel = await getGoogleGeminiModel();
      const modelName = preferredModel || DEFAULT_LLM_MODELS[provider];
      return new ChatGoogleGenerativeAI({
        apiKey,
        model: modelName,
        temperature,
        streaming: true,
      });
    }

    case LLMProvider.OPENAI:
    default: {
      const [apiKey] = await getOpenAIKey();
      if (!apiKey) {
        throw new Error(
          "OpenAI API key is not found, please set it in the Settings page",
        );
      }
      const preferredModel = await getOpenAIModel();
      const modelName = preferredModel || DEFAULT_LLM_MODELS[provider];
      return new ChatOpenAI({
        apiKey,
        model: modelName,
        temperature,
        streaming: true,
      });
    }
  }
};

const createKeeperAgent = async (
  options?: CreateAgentOptions,
): Promise<KeeperAgent> => {
  const provider = options?.provider || LLMProvider.OPENAI;
  const llm = await createLLM(provider, options?.temperature || 0);

  // Reuse the provided ToolContext (from the session) or create a new one.
  // The caller (controller) is responsible for updating it before each run.
  const toolContext = options?.toolContext || new ToolContext();

  const [preference] = await preferenceDB.getOnePreference();
  const disabledTools = new Set<string>(preference?.disabledTools || []);

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

  await ensureAgentMemoryFile();
  const subagentNames = subagents.map((s) => s.name);
  const allowedTaskTypes = ["general-purpose", ...subagentNames];
  const taskSkillRedirectMiddleware =
    createTaskSkillRedirectMiddleware(allowedTaskTypes);

  // Only expose enabled skills to the agent
  const [enabledSkills] = await agentSkillDB.getEnabledAgentSkills();
  const enabledFolders = new Set(
    (enabledSkills || [])
      .map((s) => s.folderName)
      .filter((f): f is string => !!f),
  );

  const rawSkillsBackend = new FilesystemBackend({
    rootDir: skillRootDir,
    virtualMode: true,
  });
  const skillsBackend = new Proxy(rawSkillsBackend, {
    get(target, prop, receiver) {
      if (prop === "lsInfo") {
        return async (dirPath: string) => {
          const items = await target.lsInfo(dirPath);
          return items.filter((item) => {
            const folder = item.path.replace(/\/$/, "").split("/").pop() || "";
            return enabledFolders.has(folder);
          });
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });

  const backend = new CompositeBackend(
    new FilesystemBackend({ rootDir: workspaceDir, virtualMode: true }),
    {
      "/skills/": skillsBackend,
      "/memories/": new FilesystemBackend({
        rootDir: memoryDir,
        virtualMode: true,
      }),
    },
  );

  const agent = createDeepAgent({
    model: llm,
    systemPrompt: buildSystemPrompt(subagents),
    backend,
    skills: ["/skills/"],
    memory: [MEMORY_VIRTUAL_PATH],
    subagents,
    checkpointer: options?.checkpointer || false,
    middleware: [taskSkillRedirectMiddleware],
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

const hasApiKey = async (provider: LLMProvider): Promise<boolean> => {
  switch (provider) {
    case LLMProvider.CLAUDE: {
      const [apiKey] = await getAnthropicKey();
      return !!apiKey;
    }
    case LLMProvider.GEMINI: {
      const [apiKey] = await getGoogleGeminiKey();
      return !!apiKey;
    }
    case LLMProvider.OPENAI:
    default: {
      const [apiKey] = await getOpenAIKey();
      return !!apiKey;
    }
  }
};

export { createKeeperAgent, createLLM, hasApiKey, type KeeperAgent };
export { ToolContext, type IAttachedFileContext } from "./toolContext";
