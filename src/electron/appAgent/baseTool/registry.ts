export enum BaseToolGroup {
  APP_MANAGEMENT = "app_management",
  TRANSACTION = "transaction",
  CODE_EXECUTION = "code_execution",
}

export type BaseToolRegistryItem = {
  key: string;
  name: string;
  description: string;
  group: BaseToolGroup;
};

export const BASE_TOOL_REGISTRY: BaseToolRegistryItem[] = [
  // App Management Tools
  {
    key: "create_wallet_group",
    name: "Create wallet group",
    description:
      "Set up a new wallet group to organize and manage your wallets in one place",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  {
    key: "generate_wallets_for_group",
    name: "Generate wallets for group",
    description:
      "Automatically generate and assign multiple wallets to an existing wallet group",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  {
    key: "create_profile_group_with_profiles",
    name: "Create profile group with profiles",
    description:
      "Create a profile group and bulk-provision browser profiles inside it",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  {
    key: "create_campaign_for_profile_group",
    name: "Create campaign for profile group",
    description:
      "Create a new campaign and attach it to a profile group for execution",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  {
    key: "create_node_provider_group",
    name: "Create node provider group",
    description:
      "Create a node provider group and register RPC endpoints for on-chain access",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  // Transaction Tools
  {
    key: "get_solana_token_balance",
    name: "Get Solana token balance",
    description:
      "Fetch SOL and SPL token balances across all wallets in a Solana campaign",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "get_evm_token_balance",
    name: "Get EVM token balance",
    description:
      "Fetch native and ERC-20 token balances across all wallets in an EVM campaign",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "get_token_price",
    name: "Get token price",
    description:
      "Look up the current USD price of any token using live on-chain data",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "swap_on_jupiter",
    name: "Swap on Jupiter",
    description:
      "Execute token swaps on Solana through Jupiter — buy or sell any SPL token",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "swap_on_kyberswap",
    name: "Swap on Kyberswap",
    description:
      "Execute token swaps on EVM chains through Kyberswap — buy or sell any ERC-20 token",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "launch_pumpfun_token",
    name: "Launch Pump.fun token",
    description:
      "Deploy and launch a new token on Pump.fun directly from the agent",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "launch_bonkfun_token",
    name: "Launch Bonk.fun token",
    description:
      "Deploy and launch a new token on Bonk.fun directly from the agent",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "transfer_solana_token",
    name: "Transfer Solana token",
    description:
      "Send SOL or SPL tokens from one wallet to multiple target wallets",
    group: BaseToolGroup.TRANSACTION,
  },
  // Code Execution Tools
  {
    key: "execute_javascript",
    name: "Execute JavaScript",
    description:
      "Run JavaScript / Node.js code to call APIs or automate custom logic",
    group: BaseToolGroup.CODE_EXECUTION,
  },
  {
    key: "execute_python",
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
};
