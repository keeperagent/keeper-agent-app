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
    name: "Create Wallet group",
    description: "Create a new wallet group to organize wallets.",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  {
    key: "generate_wallets_for_group",
    name: "Generate wallets for Wallet group",
    description: "Generate and add wallets to an existing wallet group.",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  {
    key: "create_profile_group_with_profiles",
    name: "Create Profile group with Profiles",
    description: "Create a profile group and populate it with profiles.",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  {
    key: "create_campaign_for_profile_group",
    name: "Create Campaign for Profile group",
    description: "Create a campaign and link it to a profile group.",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  {
    key: "create_node_provider_group",
    name: "Create Node provider group",
    description:
      "Create a node provider group and populate it with RPC endpoints.",
    group: BaseToolGroup.APP_MANAGEMENT,
  },
  // Transaction Tools
  {
    key: "get_solana_token_balance",
    name: "Get Solana token balance",
    description:
      "Get SOL or SPL token balances across campaign wallets on Solana.",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "get_evm_token_balance",
    name: "Get EVM token balance",
    description:
      "Get native token or ERC20 balances across campaign wallets on EVM chains.",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "get_token_price",
    name: "Get token price",
    description: "Get token price in USD from on-chain data.",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "swap_on_jupiter",
    name: "Swap on Jupiter",
    description:
      "Swap tokens on Solana via Jupiter (buy SOL → token, sell token → SOL).",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "swap_on_kyberswap",
    name: "Swap on Kyberswap",
    description:
      "Swap tokens on EVM chains via Kyberswap (buy native → ERC20, sell ERC20 → native).",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "transfer_solana_token",
    name: "Transfer Solana token",
    description:
      "Transfer native SOL or SPL tokens from a source wallet to target wallets in a campaign.",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "launch_pumpfun_token",
    name: "Launch Pump.fun Token",
    description: "Launch a new token on Pump.fun on Solana.",
    group: BaseToolGroup.TRANSACTION,
  },
  {
    key: "launch_bonkfun_token",
    name: "Launch Bonk.fun Token",
    description: "Launch a new token on Bonk.fun on Solana.",
    group: BaseToolGroup.TRANSACTION,
  },
  // Code Execution Tools
  {
    key: "execute_javascript",
    name: "Execute JavaScript",
    description:
      "Execute JavaScript/Node.js code to fetch data, process results, or run custom logic.",
    group: BaseToolGroup.CODE_EXECUTION,
  },
  {
    key: "execute_python",
    name: "Execute Python",
    description:
      "Execute Python code to fetch data, process results, or run custom logic.",
    group: BaseToolGroup.CODE_EXECUTION,
  },
];

export const BASE_TOOL_GROUP_LABELS: Record<BaseToolGroup, string> = {
  [BaseToolGroup.APP_MANAGEMENT]: "App Management",
  [BaseToolGroup.TRANSACTION]: "Transaction",
  [BaseToolGroup.CODE_EXECUTION]: "Code Execution",
};
