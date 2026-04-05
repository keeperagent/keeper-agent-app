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
import { restore } from "@keeperagent/crypto-key-guard";
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
  broadcastTransactionEvmTool,
  broadcastTransactionSolanaTool,
  executeJavaScriptTool,
  executePythonTool,
  webSearchTavilyTool,
  webSearchExaTool,
  webExtractTavilyTool,
  findSimilarExaTool,
  searchCampaignsTool,
  searchWorkflowsTool,
  runWorkflowTool,
  stopWorkflowTool,
  checkWorkflowStatusTool,
  draftPlanTool,
  submitPlanTool,
} from "./baseTool";
import {
  createAgentScheduleTool,
  listAgentSchedulesTool,
  updateAgentScheduleTool,
  deleteAgentScheduleTool,
  pauseAgentScheduleTool,
  resumeAgentScheduleTool,
  runAgentScheduleNowTool,
} from "./baseTool/scheduler";
import {
  listAgentTasksTool,
  getAgentTaskTool,
  createAgentTaskTool,
  updateAgentTaskTool,
  deleteAgentTaskTool,
} from "./baseTool/agentTask";
import {
  sendMessageTool,
  readMessagesTool,
  acknowledgeMessageTool,
} from "./baseTool/agentMailbox";
import {
  createAgentTeamTool,
  getTeamProgressTool,
  delegateTaskTool,
} from "./baseTool/agentTeam";
import { searchToolsTool } from "./baseTool/toolDiscovery";
import { BASE_TOOL_KEYS } from "./baseTool/registry";
import { mcpToolLoader } from "./mcpTool";
import {
  getOpenAIKey,
  getAnthropicKey,
  getGoogleGeminiKey,
  getOpenAIModel,
  getAnthropicModel,
  getGoogleGeminiModel,
  getOpenAIBackgroundModel,
  getAnthropicBackgroundModel,
  getGoogleGeminiBackgroundModel,
} from "./utils";
import { preferenceDB } from "@/electron/database/preference";
import { IAgentRegistry, LLMProvider } from "@/electron/type";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { ToolContext } from "./toolContext";

const DEFAULT_MEMORY_FILE = "AGENT.md";
const MEMORY_TEMPLATE =
  "# Agent Memory\n\n" +
  "## User Profile\n\n" +
  "## Working Preferences\n\n" +
  "## Durable Facts\n\n" +
  "## Feedback & Corrections\n";

const ensureAgentMemoryFile = async (memoryFile: string): Promise<void> => {
  const memoryDir = getMemoryDir();
  const memoryPath = path.join(memoryDir, memoryFile);
  await fs.ensureDir(memoryDir);
  if (!(await fs.pathExists(memoryPath))) {
    await fs.writeFile(memoryPath, MEMORY_TEMPLATE);
  }
};

const buildSystemPrompt = (
  subagents: SubAgent[],
  memoryVirtualPath: string,
) => {
  const workspacePath = getWorkspaceDir();
  const subagentNames = subagents.map((s) => s.name);
  const allowedAgents = subagentNames.map((n) => `"${n}"`).join(", ");
  const subagentList = subagents
    .map((s) => `- **${s.name}**: ${s.description}`)
    .join("\n");
  return `You are Keeper Agent, an AI assistant for crypto wallets, campaigns, profiles, and on-chain operations.

## Memory
Read \`${memoryVirtualPath}\` at conversation start.
When you learn something new about the user — their preferences, working style, or stable facts about how they operate — write it to \`${memoryVirtualPath}\` immediately. Do not wait to be asked.

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
- WHATSAPP: Plain text — \`first6...last4 (https://solscan.io/account/<full_address>)\` for wallets; \`first6...last4 (https://solscan.io/tx/<full_hash>)\` for tx hashes.
- KEEPER/others: Markdown — \`[first6...last4](https://solscan.io/account/<full_address>)\` for wallets; \`[first6...last4](https://solscan.io/tx/<full_hash>)\` for tx hashes.
Always shorten the display text.

## Planning mode
When the user requests any of the following, you MUST use planning mode:
- On-chain execution: swaps, transfers, token launches, broadcasting transactions
- Code execution: running JavaScript or Python scripts
- Workflow runs

Steps:
1. Call \`draft_plan\` to enter planning mode
2. Research: check balances, get token prices, web search — read-only tools work normally
3. Call \`submit_plan\` with a clear summary: what will execute, which wallets/amounts/tokens/scripts/workflows are involved, expected outcome
4. After user approves, execute the operations

All execution tools are BLOCKED during planning mode — they return an error until \`submit_plan\` is called and approved.
Skip planning mode only for simple read operations (balance check, price lookup, web search).

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

## Workflow execution
- Before running a workflow: show campaign name, workflow name, variables (if any), and ask the user for their encryptKey (secret key). Users rarely provide it upfront — always ask.
- NEVER echo encryptKey back in your response. Once received, delegate to workflow_agent immediately with all details including encryptKey in the task description.

## Rules
- On tool failure: try ONE alternative, then report to user.
- Swap/transfer confirmations MUST use structured format, not bullet points: TELEGRAM uses bold-labeled fields (<b>Field:</b> Value, one per line); WHATSAPP uses *bold* labels (*Field:* Value, one per line); KEEPER/others use a Markdown table.
- CRITICAL: After the user confirms a swap/transfer, you MUST delegate execution to the transaction subagent via the \`task\` tool. NEVER pretend the transaction is executing or generate fake results — always call the actual tool.
- When the user asks how to use any capability: delegate to the relevant subagent to explain the tool's parameters and usage. Do NOT answer from general knowledge — describe YOUR tools, not external websites or UIs.
- When displaying results from subagents, always apply the Solana link format rules above. Reformat any raw addresses or tx hashes into shortened Solscan links using the format for the current platformId.
- Keep responses concise.

## Output format
Adapt output based on the "platformId" field in the CURRENT CONTEXT of each message:
- TELEGRAM: Use Telegram HTML tags only — never use Markdown syntax.
- WHATSAPP: Use WhatsApp formatting only — *bold*, _italic_, ~strikethrough~, \`monospace\`, \`\`\`code block\`\`\`. No HTML tags, no Markdown links.
- KEEPER: Use Markdown. Prefer markdown tables over long lists or bullet points when presenting structured information.

CRITICAL: When delegating to ANY subagent via \`task\`, you MUST append the following to the task description:
"Output format: [TELEGRAM=HTML | WHATSAPP=WhatsApp formatting | KEEPER=Markdown tables]. Use tables instead of bullet lists for structured data."
This ensures all subagents format their responses correctly for the current platform.`;
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

/**
 * Middleware that restores redacted crypto secret tokens (e.g. [EVM_KEY_1])
 * back to their real values inside tool call arguments, so tools receive
 * actual keys while the LLM only ever sees safe placeholders.
 */
const createSecretRestoreMiddleware = (toolContext: ToolContext) =>
  createMiddleware({
    name: "SecretRestore",
    wrapToolCall: async (request: any = {}, handler: any) => {
      if (toolContext.secrets.size === 0) {
        return handler(request);
      }

      const args = request?.toolCall?.args || request?.toolCall?.kwargs || {};
      if (!args) {
        return handler(request);
      }

      const argsStr = JSON.stringify(args);
      const restored = restore(argsStr, toolContext.secrets);
      if (restored === argsStr) {
        return handler(request);
      }

      try {
        const restoredArgs = JSON.parse(restored);
        return handler({
          ...request,
          toolCall: {
            ...request?.toolCall,
            args: restoredArgs,
          },
        });
      } catch {
        return handler(request);
      }
    },
  });

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
    isEnabled(BASE_TOOL_KEYS.BROADCAST_TRANSACTION_EVM) &&
      broadcastTransactionEvmTool(toolContext),
    isEnabled(BASE_TOOL_KEYS.BROADCAST_TRANSACTION_SOLANA) &&
      broadcastTransactionSolanaTool(toolContext),
  ].filter((tool): any => Boolean(tool));

  const codeExecutionTools = [
    isEnabled(BASE_TOOL_KEYS.EXECUTE_JAVASCRIPT) &&
      executeJavaScriptTool(toolContext),
    isEnabled(BASE_TOOL_KEYS.EXECUTE_PYTHON) && executePythonTool(toolContext),
  ].filter((tool): any => Boolean(tool));

  const agents = [];

  if (appManagementTools.length > 0) {
    agents.push({
      name: "app_management_agent",
      description:
        "Creates new Campaigns, Profiles, Wallets, and Node Providers. Use this only for creating new resources, NOT for listing or searching.",
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
        "Check the task description for platformId. TELEGRAM=HTML formatting, WHATSAPP=WhatsApp formatting (*bold*, plain text links), KEEPER=Markdown.\n\n" +
        "## Swap/Transfer procedure\n" +
        "1. Show confirmation and STOP. Wait for user approval.\n" +
        "2. After user confirms, IMMEDIATELY call the swap/transfer tool. Do NOT output text — just call the tool.\n\n" +
        "## Confirmation — TELEGRAM (bold-labeled fields):\n" +
        "<b>Action:</b> BUY or SELL\n<b>Token:</b> [mint address]\n<b>Amount:</b> [amount in native token, e.g. 0.00235 SOL]\n<b>Wallets:</b> [count]\n<b>Strategy:</b> [strategy name]\n\n" +
        "## Confirmation — WHATSAPP (*bold* labels):\n" +
        "*Action:* BUY or SELL\n*Token:* [mint address]\n*Amount:* [amount in native token, e.g. 0.00235 SOL]\n*Wallets:* [count]\n*Strategy:* [strategy name]\n\n" +
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
        "- WHATSAPP: one entry per wallet — *Wallet:* first6...last4 (https://solscan.io/account/[address]) *Amount:* [amount] *Tx:* first6...last4 (https://solscan.io/tx/[hash]) (or error text).\n" +
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

  const researchTools = [
    isEnabled(BASE_TOOL_KEYS.WEB_SEARCH_TAVILY) && webSearchTavilyTool(),
    isEnabled(BASE_TOOL_KEYS.WEB_SEARCH_EXA) && webSearchExaTool(),
    isEnabled(BASE_TOOL_KEYS.WEB_EXTRACT_TAVILY) && webExtractTavilyTool(),
    isEnabled(BASE_TOOL_KEYS.FIND_SIMILAR_EXA) && findSimilarExaTool(),
  ].filter((tool): any => Boolean(tool));

  if (researchTools.length > 0) {
    agents.push({
      name: "research_agent",
      description:
        "Searches the web for current information, news, facts, and research. " +
        "Can also extract full page content from URLs and find similar pages.",
      systemPrompt:
        "You are a research subagent with web search and content extraction capabilities. " +
        "You have four tools:\n" +
        "- **web_search_tavily**: Best for factual lookups, current events, news, prices, and general queries.\n" +
        "- **web_search_exa**: Best for semantic search — finding conceptually similar content, research papers, related projects, and deep topic exploration.\n" +
        "- **web_extract_tavily**: Extract and read the full content of web pages by URL. Use after searching to read a specific result in detail.\n" +
        "- **find_similar_exa**: Find web pages similar to a given URL. Use to discover related projects, competitors, or similar content.\n\n" +
        "Choose the right tool based on the query type. You can chain tools — e.g. search first, then extract a result page for details.\n" +
        "Return results clearly with source URLs. Keep responses concise and relevant.",
      tools: researchTools as any,
    });
  }

  const workflowTools = [
    isEnabled(BASE_TOOL_KEYS.SEARCH_CAMPAIGNS) && searchCampaignsTool(),
    isEnabled(BASE_TOOL_KEYS.SEARCH_WORKFLOWS) && searchWorkflowsTool(),
    isEnabled(BASE_TOOL_KEYS.RUN_WORKFLOW) && runWorkflowTool(toolContext),
    isEnabled(BASE_TOOL_KEYS.STOP_WORKFLOW) && stopWorkflowTool(),
    isEnabled(BASE_TOOL_KEYS.CHECK_WORKFLOW_STATUS) &&
      checkWorkflowStatusTool(),
  ].filter((tool): any => Boolean(tool));

  if (workflowTools.length > 0) {
    agents.push({
      name: "workflow_agent",
      description:
        "Lists and searches campaigns and workflows, runs workflows on campaigns, and stops running workflows. Use this for any campaign/workflow lookup or execution.",
      systemPrompt:
        "1. Search by name to get IDs.\n" +
        "2. If exactly 1 campaign and 1 workflow match, execute immediately.\n" +
        "3. If multiple campaigns or multiple workflows in a campaign, return the full list — never pick one yourself.\n" +
        "4. Never include encryptKey in response text.",
      tools: workflowTools as any,
    });
  }

  const schedulerTools = [
    isEnabled(BASE_TOOL_KEYS.CREATE_AGENT_SCHEDULE) &&
      createAgentScheduleTool(toolContext),
    isEnabled(BASE_TOOL_KEYS.LIST_AGENT_SCHEDULES) && listAgentSchedulesTool(),
    isEnabled(BASE_TOOL_KEYS.UPDATE_AGENT_SCHEDULE) &&
      updateAgentScheduleTool(),
    isEnabled(BASE_TOOL_KEYS.DELETE_AGENT_SCHEDULE) &&
      deleteAgentScheduleTool(),
    isEnabled(BASE_TOOL_KEYS.PAUSE_AGENT_SCHEDULE) && pauseAgentScheduleTool(),
    isEnabled(BASE_TOOL_KEYS.RESUME_AGENT_SCHEDULE) &&
      resumeAgentScheduleTool(),
    isEnabled(BASE_TOOL_KEYS.RUN_AGENT_SCHEDULE_NOW) &&
      runAgentScheduleNowTool(),
  ].filter((tool): any => Boolean(tool));

  if (schedulerTools.length > 0) {
    agents.push({
      name: "scheduler_agent",
      description:
        "Creates, lists, updates, deletes, pauses, resumes, and manually triggers agent schedules. " +
        "Use this when the user wants to automate recurring tasks (e.g. 'check SOL price every 30 minutes', 'send portfolio summary every morning at 6AM').",
      systemPrompt:
        "You are a scheduling subagent. You manage agent task schedules.\n\n" +
        "## Rules\n" +
        "- Always confirm your understanding in plain language before creating (e.g. 'I'll run this every day at 6AM'). Never show the raw cron expression to the user.\n" +
        "- For conditionType='llm': only use for deciding whether to send a notification, never for execution gating.\n" +
        "- Return schedule IDs so the user can reference them.\n" +
        "- Keep responses concise.",
      tools: schedulerTools as any,
    });
  }

  const agentTaskTools = [
    isEnabled(BASE_TOOL_KEYS.LIST_AGENT_TASKS) && listAgentTasksTool(),
    isEnabled(BASE_TOOL_KEYS.GET_AGENT_TASK) && getAgentTaskTool(),
    isEnabled(BASE_TOOL_KEYS.CREATE_AGENT_TASK) && createAgentTaskTool(),
    isEnabled(BASE_TOOL_KEYS.UPDATE_AGENT_TASK) && updateAgentTaskTool(),
    isEnabled(BASE_TOOL_KEYS.DELETE_AGENT_TASK) && deleteAgentTaskTool(),
  ].filter((tool): any => Boolean(tool));

  if (agentTaskTools.length > 0) {
    agents.push({
      name: "task_management_agent",
      description:
        "Creates, lists, retrieves, updates, and deletes tasks in the agent task pool. " +
        "Use this when the user wants to manage work items for agents — creating tasks, checking status, reassigning, or closing tasks.",
      systemPrompt:
        "You are a task management subagent. You manage the agent task pool.\n\n" +
        "## Rules\n" +
        "- When creating a task, omit assignedAgentId unless the user specifies an agent — the dispatcher will auto-assign.\n" +
        "- Prefer setting status to cancelled over deleting, unless the user explicitly wants permanent removal.\n" +
        "- Return task IDs so the user can reference them later.\n" +
        "- Keep responses concise.",
      tools: agentTaskTools as any,
    });
  }

  const mailboxTools = [
    sendMessageTool(toolContext),
    readMessagesTool(toolContext),
    acknowledgeMessageTool(),
  ];

  agents.push({
    name: "team_mailbox_agent",
    description:
      "Send messages to other registry agents, read your mailbox, and acknowledge processed messages. " +
      "Use for agent-to-agent coordination within a team.",
    systemPrompt:
      "You are a mailbox subagent for agent-to-agent communication.\n\n" +
      "## Tools\n" +
      "- **send_message**: Send a direct message to a specific agent (by ID) or broadcast to all agents (to='*').\n" +
      "- **read_messages**: Read unread messages. Pass includeAcknowledged=true to see all.\n" +
      "- **acknowledge_message**: Mark a message as acknowledged after you have processed it.\n\n" +
      "## Rules\n" +
      "- Always acknowledge messages after processing them so they are excluded from future reads.\n" +
      "- Keep message subjects short and descriptive.\n" +
      "- Return results concisely.",
    tools: mailboxTools as any,
  });

  return agents;
};

type CreateAgentOptions = {
  temperature?: number;
  checkpointer?: MemorySaver;
  provider?: LLMProvider;
  /* Shared mutable context injected into all tools (nodeEndpointGroupId, encryptKey). */
  toolContext?: ToolContext;
  /*
   * Memory file name (relative, no path). Defaults to "AGENT.md".
   * Scheduled agent tasks pass a per-schedule file (e.g. "AGENT_SCHEDULED_1.md")
   * to keep their memory isolated from the desktop chat session.
   */
  memoryFile?: string;
};

type CreateRegistryAgentOptions = {
  registry: IAgentRegistry;
  checkpointer?: MemorySaver;
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

const createLLM = async (
  provider: LLMProvider,
  temperature = 0,
  modelOverride?: string,
) => {
  switch (provider) {
    case LLMProvider.CLAUDE: {
      const [apiKey] = await getAnthropicKey();
      if (!apiKey) {
        throw new Error(
          "Anthropic API key is not found, please set it in the Settings page",
        );
      }
      let preferredModel = modelOverride || null;
      if (!preferredModel) {
        preferredModel = await getAnthropicModel();
      }
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
      let preferredModel = modelOverride || null;
      if (!preferredModel) {
        preferredModel = await getGoogleGeminiModel();
      }
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
      let preferredModel = modelOverride || null;
      if (!preferredModel) {
        preferredModel = await getOpenAIModel();
      }
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

const createBackgroundLLM = async (provider: LLMProvider) => {
  let backgroundModel: string | null = null;
  if (provider === LLMProvider.CLAUDE) {
    backgroundModel = await getAnthropicBackgroundModel();
  } else if (provider === LLMProvider.GEMINI) {
    backgroundModel = await getGoogleGeminiBackgroundModel();
  } else if (provider === LLMProvider.OPENAI) {
    backgroundModel = await getOpenAIBackgroundModel();
  }
  return createLLM(provider, 0, backgroundModel || undefined);
};

const createKeeperAgent = async (
  options?: CreateAgentOptions,
): Promise<KeeperAgent> => {
  const provider = options?.provider || LLMProvider.OPENAI;
  const llm = await createLLM(provider, options?.temperature || 0);

  const memoryFile = options?.memoryFile || DEFAULT_MEMORY_FILE;
  const MEMORY_VIRTUAL_PATH = `/memories/${memoryFile}`;

  // Reuse the provided ToolContext (from the session) or create a new one.
  // The caller (controller) is responsible for updating it before each run.
  const toolContext = options?.toolContext || new ToolContext();

  const [preference] = await preferenceDB.getOnePreference();
  const disabledTools = new Set<string>(preference?.disabledTools || []);

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
  const subagentNames = subagents.map((s) => s.name);
  const allowedTaskTypes = ["general-purpose", ...subagentNames];
  const taskSkillRedirectMiddleware =
    createTaskSkillRedirectMiddleware(allowedTaskTypes);
  const secretRestoreMiddleware = createSecretRestoreMiddleware(toolContext);

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
    searchToolsTool(),
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
    middleware: [taskSkillRedirectMiddleware, secretRestoreMiddleware],
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

/**
 * Creates a KeeperAgent scoped to an AgentRegistry config.
 * Respects allowedBaseTools whitelist, custom systemPrompt, llmProvider/model overrides,
 * and uses an isolated memory file keyed by registry ID.
 */
const createRegistryKeeperAgent = async (
  options: CreateRegistryAgentOptions,
): Promise<KeeperAgent> => {
  const { registry, checkpointer, toolContext: providedToolContext } = options;

  const provider = (registry.llmProvider as LLMProvider) || LLMProvider.CLAUDE;
  const llm = await createLLM(provider, 0, registry.llmModel || undefined);

  const memoryFile = `AGENT_REGISTRY_${registry.id}.md`;
  const MEMORY_VIRTUAL_PATH = `/memories/${memoryFile}`;

  const toolContext = providedToolContext || new ToolContext();
  toolContext.update({ llmProvider: provider, agentRegistryId: registry.id });

  // Parse whitelist — empty array = allow all base tools (same as default agent)
  let allowedBaseToolsSet: Set<string> | null = null;
  if (
    Array.isArray(registry.allowedBaseTools) &&
    registry.allowedBaseTools.length > 0
  ) {
    allowedBaseToolsSet = new Set(registry.allowedBaseTools);
  }

  const isEnabled = (key: string): boolean =>
    allowedBaseToolsSet === null || allowedBaseToolsSet.has(key);

  const baseSubAgents = buildBaseSubAgents(toolContext, new Set<string>());
  // Filter subagents based on whether any of their tools pass the whitelist
  const filteredSubAgents = baseSubAgents.filter((subagent) => {
    if (allowedBaseToolsSet === null) {
      return true;
    }
    const tools = (subagent.tools || []) as any[];
    return tools.some((tool) => {
      const toolKey = tool?.name || "";
      return isEnabled(toolKey);
    });
  });

  // Load only allowed MCP servers
  let allowedMcpServerIds: Set<number> | null = null;
  if (registry.allowedMcpServerIds !== undefined) {
    // Empty array = no MCP servers (same behavior as previous JSON-parse logic)
    allowedMcpServerIds = new Set<number>(registry.allowedMcpServerIds || []);
  }

  const { subAgents: mcpSubAgentInfos, closeClients } =
    await mcpToolLoader.loadMcpSubAgents();

  const mcpSubAgents = mcpSubAgentInfos
    .filter((info) => {
      if (allowedMcpServerIds === null) {
        return true;
      }
      return allowedMcpServerIds.has(info.id || -1);
    })
    .map((info) => ({
      name: info.name,
      description: info.description,
      systemPrompt: `You are a subagent with access to tools from the "${info.name}" MCP server. Use the available tools to complete the user's task. Return results directly.`,
      tools: info.tools as any,
    }));

  const subagents = [...filteredSubAgents, ...mcpSubAgents];

  const skillRootDir = getSkillRootDir();
  const workspaceDir = getWorkspaceDir();
  const memoryDir = getMemoryDir();

  await ensureAgentMemoryFile(memoryFile);

  // Treat `[]` as "no restriction" (allow all), matching the existing behavior
  // pattern used for other whitelists in this app.
  const allowedSkillIdSet: Set<number> | null =
    Array.isArray(registry.allowedSkillIds) &&
    registry.allowedSkillIds.length > 0
      ? new Set<number>(registry.allowedSkillIds)
      : null;

  const [enabledSkillsResult] = await agentSkillDB.getEnabledAgentSkills();
  const enabledSkills = enabledSkillsResult || [];
  const enabledFolders = new Set(
    enabledSkills
      .filter((skill) =>
        allowedSkillIdSet === null
          ? true
          : allowedSkillIdSet.has(skill.id || -1),
      )
      .map((skill) => skill.folderName)
      .filter((folderName): folderName is string => !!folderName),
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

  const subagentNames = subagents.map((subagent) => subagent.name);
  const allowedTaskTypes = ["general-purpose", ...subagentNames];
  const taskSkillRedirectMiddleware =
    createTaskSkillRedirectMiddleware(allowedTaskTypes);
  const secretRestoreMiddleware = createSecretRestoreMiddleware(toolContext);

  const systemPrompt =
    registry.systemPrompt || buildSystemPrompt(subagents, MEMORY_VIRTUAL_PATH);

  const registryPlanningTools = [
    draftPlanTool(toolContext),
    submitPlanTool(toolContext),
  ];

  const agent = createDeepAgent({
    model: llm,
    systemPrompt,
    backend,
    tools: registryPlanningTools as any,
    skills: ["/skills/"],
    memory: [MEMORY_VIRTUAL_PATH],
    subagents,
    checkpointer: checkpointer || false,
    middleware: [taskSkillRedirectMiddleware, secretRestoreMiddleware],
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

export {
  createKeeperAgent,
  createRegistryKeeperAgent,
  createLLM,
  createBackgroundLLM,
  hasApiKey,
  MEMORY_TEMPLATE,
  type KeeperAgent,
};
export { ToolContext, type IAttachedFileContext } from "./toolContext";
