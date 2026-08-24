export enum BaseToolGroup {
  TRANSACTION = "transaction",
  CODE_EXECUTION = "code_execution",
  WORKFLOW = "workflow",
  SCHEDULER = "scheduler",
  RESEARCH = "research",
  AGENT_TASK_MANAGEMENT = "agent_task_management",
  AGENT_ORCHESTRATION = "agent_orchestration",
  DATA_MANAGEMENT = "data_management",
  VISUALIZATION = "visualization",
}

export type BaseToolRegistryItem = {
  key: string;
  name: string;
  description: string;
  group: BaseToolGroup;
  locked?: boolean;
};

export const BASE_TOOL_KEYS = {
  GET_SOLANA_TOKEN_BALANCE: "get_solana_token_balance",
  GET_EVM_TOKEN_BALANCE: "get_evm_token_balance",
  GET_TOKEN_PRICE: "get_token_price",
  SWAP_ON_JUPITER: "swap_on_jupiter",
  SWAP_ON_KYBERSWAP: "swap_on_kyberswap",
  TRANSFER_SOLANA_TOKEN: "transfer_solana_token",
  LAUNCH_PUMPFUN_TOKEN: "launch_pumpfun_token",
  BROADCAST_TRANSACTION_EVM: "broadcast_transaction_evm",
  BROADCAST_TRANSACTION_SOLANA: "broadcast_transaction_solana",
  WRITE_JAVASCRIPT: "write_javascript",
  EXECUTE_JAVASCRIPT: "execute_javascript",
  SEARCH_CAMPAIGNS: "search_campaigns",
  SEARCH_WORKFLOWS: "search_workflows",
  RUN_WORKFLOW: "run_workflow",
  STOP_WORKFLOW: "stop_workflow",
  CHECK_WORKFLOW_STATUS: "check_workflow_status",
  WEB_SEARCH_TAVILY: "web_search_tavily",
  WEB_SEARCH_EXA: "web_search_exa",
  WEB_EXTRACT_TAVILY: "web_extract_tavily",
  FIND_SIMILAR_EXA: "find_similar_exa",
  CREATE_AGENT_SCHEDULE: "create_agent_schedule",
  LIST_AGENT_SCHEDULES: "list_agent_schedules",
  UPDATE_AGENT_SCHEDULE: "update_agent_schedule",
  DELETE_AGENT_SCHEDULE: "delete_agent_schedule",
  PAUSE_AGENT_SCHEDULE: "pause_agent_schedule",
  RESUME_AGENT_SCHEDULE: "resume_agent_schedule",
  RUN_AGENT_SCHEDULE_NOW: "run_agent_schedule_now",
  LIST_AGENT_TASKS: "list_agent_tasks",
  GET_AGENT_TASK: "get_agent_task",
  CREATE_AGENT_TASK: "create_agent_task",
  UPDATE_AGENT_TASK: "update_agent_task",
  DELETE_AGENT_TASK: "delete_agent_task",
  REQUEST_APPROVAL: "request_approval",
  CONFIRM_APPROVAL: "confirm_approval",
  RENDER_CHART: "render_chart",
  CALCULATE: "calculate",
};

export const BASE_TOOL_REGISTRY: BaseToolRegistryItem[] = [
  // Transaction Tools
  {
    key: BASE_TOOL_KEYS.GET_SOLANA_TOKEN_BALANCE,
    name: "Get Solana token balance",
    description:
      "Fetch SOL and SPL token balances across all wallets in a Solana campaign",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: BASE_TOOL_KEYS.GET_EVM_TOKEN_BALANCE,
    name: "Get EVM token balance",
    description:
      "Fetch native and ERC-20 token balances across all wallets in an EVM campaign",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: BASE_TOOL_KEYS.GET_TOKEN_PRICE,
    name: "Get token price",
    description:
      "Look up the current USD price of any token using live on-chain data",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: BASE_TOOL_KEYS.SWAP_ON_JUPITER,
    name: "Swap on Jupiter",
    description:
      "Execute token swaps on Solana through Jupiter — buy or sell any SPL token",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: BASE_TOOL_KEYS.SWAP_ON_KYBERSWAP,
    name: "Swap on Kyberswap",
    description:
      "Execute token swaps on EVM chains through Kyberswap — buy or sell any ERC-20 token",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: BASE_TOOL_KEYS.LAUNCH_PUMPFUN_TOKEN,
    name: "Launch Pump.fun token",
    description:
      "Deploy and launch a new token on Pump.fun directly from the agent",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: BASE_TOOL_KEYS.TRANSFER_SOLANA_TOKEN,
    name: "Transfer Solana token",
    description:
      "Send SOL or SPL tokens from one wallet to multiple target wallets",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: BASE_TOOL_KEYS.BROADCAST_TRANSACTION_EVM,
    name: "Broadcast EVM transaction",
    description:
      "Broadcast a raw transaction to an EVM chain using campaign wallets",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: BASE_TOOL_KEYS.BROADCAST_TRANSACTION_SOLANA,
    name: "Broadcast Solana transaction",
    description:
      "Broadcast a serialized transaction to Solana using campaign wallets",
    group: BaseToolGroup.TRANSACTION,
  },
  // Workflow Tools
  {
    key: BASE_TOOL_KEYS.SEARCH_CAMPAIGNS,
    name: "Search campaigns",
    description: "Search and list campaigns with their attached workflows",
    group: BaseToolGroup.WORKFLOW,
  },
  {
    key: BASE_TOOL_KEYS.SEARCH_WORKFLOWS,
    name: "Search workflows",
    description: "Search and list workflows with their associated campaigns",
    group: BaseToolGroup.WORKFLOW,
  },
  {
    key: BASE_TOOL_KEYS.RUN_WORKFLOW,
    name: "Run workflow",
    description: "Run a workflow on a campaign using campaign and workflow IDs",
    group: BaseToolGroup.WORKFLOW,
  },
  {
    key: BASE_TOOL_KEYS.STOP_WORKFLOW,
    name: "Stop workflow",
    description: "Stop a currently running workflow on a campaign",
    group: BaseToolGroup.WORKFLOW,
  },
  {
    key: BASE_TOOL_KEYS.CHECK_WORKFLOW_STATUS,
    name: "Check workflow status",
    description:
      "Check the progress and status of a workflow running on a campaign",
    group: BaseToolGroup.WORKFLOW,
  },
  // Scheduler (agent schedules)
  {
    key: BASE_TOOL_KEYS.CREATE_AGENT_SCHEDULE,
    name: "Create agent schedule",
    description:
      "Create a recurring agent task from natural language (cron runs in the background)",
    group: BaseToolGroup.SCHEDULER,
  },
  {
    key: BASE_TOOL_KEYS.LIST_AGENT_SCHEDULES,
    name: "List agent schedules",
    description: "List agent task schedules with optional search text",
    group: BaseToolGroup.SCHEDULER,
  },
  {
    key: BASE_TOOL_KEYS.UPDATE_AGENT_SCHEDULE,
    name: "Update agent schedule",
    description: "Update schedule name, cron, note, active state, or jobs",
    group: BaseToolGroup.SCHEDULER,
  },
  {
    key: BASE_TOOL_KEYS.DELETE_AGENT_SCHEDULE,
    name: "Delete agent schedule",
    description: "Delete an agent schedule by id or name",
    group: BaseToolGroup.SCHEDULER,
  },
  {
    key: BASE_TOOL_KEYS.PAUSE_AGENT_SCHEDULE,
    name: "Pause agent schedule",
    description: "Pause a schedule so cron no longer triggers it",
    group: BaseToolGroup.SCHEDULER,
  },
  {
    key: BASE_TOOL_KEYS.RESUME_AGENT_SCHEDULE,
    name: "Resume agent schedule",
    description: "Resume a paused schedule",
    group: BaseToolGroup.SCHEDULER,
  },
  {
    key: BASE_TOOL_KEYS.RUN_AGENT_SCHEDULE_NOW,
    name: "Run agent schedule now",
    description: "Trigger an agent schedule immediately (manual run)",
    group: BaseToolGroup.SCHEDULER,
  },
  // Research Tools
  {
    key: BASE_TOOL_KEYS.WEB_SEARCH_TAVILY,
    name: "Web search (Tavily)",
    description:
      "Search the web for current information, news, and facts using Tavily",
    group: BaseToolGroup.RESEARCH,
  },
  {
    key: BASE_TOOL_KEYS.WEB_SEARCH_EXA,
    name: "Web search (Exa)",
    description:
      "Semantic web search for finding conceptually related content using Exa",
    group: BaseToolGroup.RESEARCH,
  },
  {
    key: BASE_TOOL_KEYS.WEB_EXTRACT_TAVILY,
    name: "Web extract (Tavily)",
    description:
      "Extract and read full content from web pages by URL using Tavily",
    group: BaseToolGroup.RESEARCH,
  },
  {
    key: BASE_TOOL_KEYS.FIND_SIMILAR_EXA,
    name: "Find similar (Exa)",
    description:
      "Find web pages similar to a given URL using Exa semantic search",
    group: BaseToolGroup.RESEARCH,
  },
  // Agent Task Management Tools
  {
    key: BASE_TOOL_KEYS.LIST_AGENT_TASKS,
    name: "List agent tasks",
    description:
      "List tasks in the agent task pool with optional filters by status, agent, or keyword",
    group: BaseToolGroup.AGENT_TASK_MANAGEMENT,
  },
  {
    key: BASE_TOOL_KEYS.GET_AGENT_TASK,
    name: "Get agent task",
    description: "Get full details of a specific agent task by ID",
    group: BaseToolGroup.AGENT_TASK_MANAGEMENT,
  },
  {
    key: BASE_TOOL_KEYS.CREATE_AGENT_TASK,
    name: "Create agent task",
    description: "Create a new task in the agent task pool",
    group: BaseToolGroup.AGENT_TASK_MANAGEMENT,
  },
  {
    key: BASE_TOOL_KEYS.UPDATE_AGENT_TASK,
    name: "Update agent task",
    description:
      "Update a task's title, description, priority, status, assigned agent, or result",
    group: BaseToolGroup.AGENT_TASK_MANAGEMENT,
  },
  {
    key: BASE_TOOL_KEYS.DELETE_AGENT_TASK,
    name: "Delete agent task",
    description: "Permanently delete an agent task by ID",
    group: BaseToolGroup.AGENT_TASK_MANAGEMENT,
  },
  // Approval Gate Tools
  {
    key: BASE_TOOL_KEYS.REQUEST_APPROVAL,
    name: "Request approval",
    description:
      "Enter approval mode before running any transaction, code, or workflow",
    group: BaseToolGroup.AGENT_ORCHESTRATION,
    locked: true,
  },
  {
    key: BASE_TOOL_KEYS.CONFIRM_APPROVAL,
    name: "Confirm approval",
    description:
      "Present execution summary to the user and wait for approval before any execution",
    group: BaseToolGroup.AGENT_ORCHESTRATION,
    locked: true,
  },
  // Code Execution Tools
  {
    key: BASE_TOOL_KEYS.WRITE_JAVASCRIPT,
    name: "Write JavaScript",
    description:
      "Draft JavaScript / Node.js code for user review before execution",
    group: BaseToolGroup.CODE_EXECUTION,
  },
  {
    key: BASE_TOOL_KEYS.EXECUTE_JAVASCRIPT,
    name: "Execute JavaScript",
    description:
      "Run JavaScript / Node.js code to call APIs or automate custom logic",
    group: BaseToolGroup.CODE_EXECUTION,
  },
  // Visualization Tools
  {
    key: BASE_TOOL_KEYS.RENDER_CHART,
    name: "Render chart",
    description:
      "Render an interactive ECharts chart directly in the UI from an option object",
    group: BaseToolGroup.VISUALIZATION,
  },
  // Calculator
  {
    key: BASE_TOOL_KEYS.CALCULATE,
    name: "Calculator",
    description:
      "Evaluates math expressions: USD→native, token values, percentages, and any arithmetic",
    group: BaseToolGroup.TRANSACTION,
    locked: true,
  },
];

export const BASE_TOOL_GROUP_LABELS: Record<BaseToolGroup, string> = {
  [BaseToolGroup.DATA_MANAGEMENT]: "Data management",
  [BaseToolGroup.TRANSACTION]: "Transaction",
  [BaseToolGroup.CODE_EXECUTION]: "Code Execution",
  [BaseToolGroup.WORKFLOW]: "Workflow",
  [BaseToolGroup.SCHEDULER]: "Scheduler",
  [BaseToolGroup.RESEARCH]: "Research",
  [BaseToolGroup.AGENT_TASK_MANAGEMENT]: "Agent task management",
  [BaseToolGroup.AGENT_ORCHESTRATION]: "Agent orchestration",
  [BaseToolGroup.VISUALIZATION]: "Visualization",
};
