export enum BaseToolGroup {
  APP_MANAGEMENT = "app_management",
  TRANSACTION = "transaction",
  CODE_EXECUTION = "code_execution",
  WORKFLOW = "workflow",
}

export type BaseToolRegistryItem = {
  key: string;
  name: string;
  description: string;
  group: BaseToolGroup;
};

export const BASE_TOOL_KEYS = {
  CREATE_WALLET_GROUP: "create_wallet_group",
  GENERATE_WALLETS_FOR_GROUP: "generate_wallets_for_group",
  CREATE_PROFILE_GROUP_WITH_PROFILES: "create_profile_group_with_profiles",
  CREATE_CAMPAIGN_FOR_PROFILE_GROUP: "create_campaign_for_profile_group",
  CREATE_NODE_PROVIDER_GROUP: "create_node_provider_group",
  GET_SOLANA_TOKEN_BALANCE: "get_solana_token_balance",
  GET_EVM_TOKEN_BALANCE: "get_evm_token_balance",
  GET_TOKEN_PRICE: "get_token_price",
  SWAP_ON_JUPITER: "swap_on_jupiter",
  SWAP_ON_KYBERSWAP: "swap_on_kyberswap",
  TRANSFER_SOLANA_TOKEN: "transfer_solana_token",
  LAUNCH_PUMPFUN_TOKEN: "launch_pumpfun_token",
  LAUNCH_BONKFUN_TOKEN: "launch_bonkfun_token",
  EXECUTE_JAVASCRIPT: "execute_javascript",
  EXECUTE_PYTHON: "execute_python",
  SEARCH_CAMPAIGNS: "search_campaigns",
  SEARCH_WORKFLOWS: "search_workflows",
  RUN_WORKFLOW: "run_workflow",
  STOP_WORKFLOW: "stop_workflow",
  CHECK_WORKFLOW_STATUS: "check_workflow_status",
} as const;

export const BASE_TOOL_REGISTRY: BaseToolRegistryItem[] = [
  // App Management Tools
  {
    key: BASE_TOOL_KEYS.CREATE_WALLET_GROUP,
    name: "Create wallet group",
    description:
      "Set up a new wallet group to organize and manage your wallets in one place",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  {
    key: BASE_TOOL_KEYS.GENERATE_WALLETS_FOR_GROUP,
    name: "Generate wallets for group",
    description:
      "Automatically generate and assign multiple wallets to an existing wallet group",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  {
    key: BASE_TOOL_KEYS.CREATE_PROFILE_GROUP_WITH_PROFILES,
    name: "Create profile group with profiles",
    description:
      "Create a profile group and bulk-provision browser profiles inside it",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  {
    key: BASE_TOOL_KEYS.CREATE_CAMPAIGN_FOR_PROFILE_GROUP,
    name: "Create campaign for profile group",
    description:
      "Create a new campaign and attach it to a profile group for execution",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  {
    key: BASE_TOOL_KEYS.CREATE_NODE_PROVIDER_GROUP,
    name: "Create node provider group",
    description:
      "Create a node provider group and register RPC endpoints for on-chain access",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
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
    key: BASE_TOOL_KEYS.LAUNCH_BONKFUN_TOKEN,
    name: "Launch Bonk.fun token",
    description:
      "Deploy and launch a new token on Bonk.fun directly from the agent",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: BASE_TOOL_KEYS.TRANSFER_SOLANA_TOKEN,
    name: "Transfer Solana token",
    description:
      "Send SOL or SPL tokens from one wallet to multiple target wallets",
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
  // Code Execution Tools
  {
    key: BASE_TOOL_KEYS.EXECUTE_JAVASCRIPT,
    name: "Execute JavaScript",
    description:
      "Run JavaScript / Node.js code to call APIs or automate custom logic",
    group: BaseToolGroup.CODE_EXECUTION,
  },
  {
    key: BASE_TOOL_KEYS.EXECUTE_PYTHON,
    name: "Execute Python",
    description:
      "Run Python scripts to call APIs, process data, or automate any custom logic",
    group: BaseToolGroup.CODE_EXECUTION,
  },
];

export const BASE_TOOL_GROUP_LABELS: Record<BaseToolGroup, string> = {
  [BaseToolGroup.APP_MANAGEMENT]: "App Management",
  [BaseToolGroup.TRANSACTION]: "Transaction",
  [BaseToolGroup.CODE_EXECUTION]: "Code Execution",
  [BaseToolGroup.WORKFLOW]: "Workflow",
};
