import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { containsSecret } from "@keeperagent/crypto-key-guard";
import { IMcpToken } from "@/electron/type";
import { showApprovalDialog, ApprovalResult } from "../approvalDialog";
import { ToolContext } from "@/electron/appAgent/toolContext";
import {
  createWalletGroupTool,
  generateWalletsForGroupTool,
  stopWorkflowTool,
  runWorkflowTool,
  executeJavaScriptTool,
  swapOnJupiterTool,
  swapOnKyberswapTool,
  transferSolanaTokenTool,
  launchPumpfunTokenTool,
  launchBonkfunTokenTool,
  broadcastTransactionEvmTool,
  broadcastTransactionSolanaTool,
} from "@/electron/appAgent/baseTool";
import {
  createAgentScheduleTool,
  updateAgentScheduleTool,
  deleteAgentScheduleTool,
  pauseAgentScheduleTool,
  resumeAgentScheduleTool,
  runAgentScheduleNowTool,
} from "@/electron/appAgent/baseTool/scheduler";
import { registerAgentTaskWriteTools } from "./agentTaskTools";

const wrapText = (text: string) => ({
  content: [{ type: "text" as const, text }],
});

const DENIED_RESPONSE = wrapText("Action denied by user.");

const SENSITIVE_KEY_PATTERN = /(key|secret|token|password|encrypt|phrase)/i;

const shouldRedactArg = (key: string, value: unknown): boolean => {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return true;
  }
  if (typeof value === "string" && containsSecret(value)) {
    return true;
  }
  return false;
};

const formatArgs = (args: Record<string, unknown>) =>
  Object.entries(args)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${key}: ${shouldRedactArg(key, value) ? "REDACTED" : JSON.stringify(value)}`,
    )
    .join("\n");

const buildToolContext = (params: {
  campaignId?: number;
  encryptKey?: string;
  nodeEndpointGroupId?: number;
  isAllWallet?: boolean;
  listCampaignProfileId?: number[];
  chainKey?: string;
  llmProvider?: string;
}) => {
  const toolCtx = new ToolContext();
  toolCtx.update({ ...params, isAllWallet: params.isAllWallet !== false });
  return toolCtx;
};

/**
 * ToolContext params added to all write tools that operate on campaign wallets.
 * These provide wallet selection and decryption context that the base tools
 * normally receive through the agent session's shared ToolContext.
 */
const walletContextSchema = {
  campaignId: z.number().describe("Campaign ID containing the wallets to use"),
  nodeEndpointGroupId: z
    .number()
    .describe("Node endpoint group ID for RPC connections"),
  encryptKey: z
    .string()
    .describe("Encryption key to decrypt wallet private keys"),
  isAllWallet: z
    .boolean()
    .optional()
    .describe("Use all wallets in the campaign (default true)"),
  listCampaignProfileId: z
    .array(z.number())
    .optional()
    .describe(
      "Specific campaign profile IDs to use (when isAllWallet is false)",
    ),
};

/**
 * Register write tools onto the MCP server.
 * Every tool shows an approval dialog before executing.
 * Only registered for MCP tokens with read-write permission.
 */
const registerWriteTools = (server: McpServer, mcpToken: IMcpToken) => {
  const displayName = mcpToken.name || "External agent";
  const createWalletGroupInstance = createWalletGroupTool();
  server.registerTool(
    "create_wallet_group",
    {
      description: createWalletGroupInstance.description,
      inputSchema: createWalletGroupInstance.schema.shape,
    },
    async (args: any) => {
      const approval = await showApprovalDialog(
        displayName,
        "create_wallet_group",
        createWalletGroupInstance.description,
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      return wrapText(
        (await createWalletGroupInstance.invoke(args)).toString(),
      );
    },
  );

  const generateWalletsInstance = generateWalletsForGroupTool();
  server.registerTool(
    "generate_wallets_for_group",
    {
      description: generateWalletsInstance.description,
      inputSchema: generateWalletsInstance.schema._def.schema.shape,
    },
    async (args: any) => {
      const approval = await showApprovalDialog(
        displayName,
        "generate_wallets_for_group",
        generateWalletsInstance.description,
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      return wrapText((await generateWalletsInstance.invoke(args)).toString());
    },
  );

  const stopWorkflowInstance = stopWorkflowTool();
  server.registerTool(
    "stop_workflow",
    {
      description: stopWorkflowInstance.description,
      inputSchema: {
        campaignId: z.number().describe("Campaign ID"),
        workflowId: z.number().describe("Workflow ID to stop"),
      },
    },
    async (args) => {
      const approval = await showApprovalDialog(
        displayName,
        "stop_workflow",
        stopWorkflowInstance.description,
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      return wrapText((await stopWorkflowInstance.invoke(args)).toString());
    },
  );

  server.registerTool(
    "run_workflow",
    {
      description:
        "Run a workflow on a campaign. Use search_campaigns or search_workflows first to get the IDs.",
      inputSchema: {
        campaignId: z.number().describe("Campaign ID"),
        workflowId: z.number().describe("Workflow ID to run"),
        encryptKey: z
          .string()
          .optional()
          .describe(
            "Encryption key to decrypt profile data (required if the workflow uses wallets)",
          ),
        variables: z
          .record(z.string())
          .optional()
          .describe(
            'Workflow variable overrides as key-value pairs (e.g. { "TOKEN_ADDRESS": "0x123..." })',
          ),
      },
    },
    async (args) => {
      const { campaignId, workflowId, encryptKey, variables } = args;
      const approval = await showApprovalDialog(
        displayName,
        "run_workflow",
        "Run a workflow on a campaign",
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      const toolCtx = new ToolContext();
      toolCtx.update({ encryptKey });
      const result = await runWorkflowTool(toolCtx).invoke({
        campaignId,
        workflowId,
        encryptKey,
        variables,
      });
      return wrapText(result.toString());
    },
  );

  const executeJsInstance = executeJavaScriptTool();
  server.registerTool(
    "execute_javascript",
    {
      description: executeJsInstance.description,
      inputSchema: {
        code: z
          .string()
          .describe(
            "JavaScript code to execute in Node.js. Use console.log() to output results.",
          ),
      },
    },
    async ({ code }) => {
      const approval = await showApprovalDialog(
        displayName,
        "execute_javascript",
        "Execute JavaScript code in Node.js",
        `code: ${code}`,
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      return wrapText((await executeJsInstance.invoke({ code })).toString());
    },
  );

  server.registerTool(
    "create_agent_schedule",
    {
      description:
        "Create a new agent schedule with one or more jobs. Jobs can be AI prompt jobs ('agent' type) or workflow execution jobs ('workflow' type).",
      inputSchema: {
        name: z.string().describe("Human-readable name for the schedule"),
        cronExpr: z
          .string()
          .describe(
            "5-field cron expression (e.g. '0 6 * * *' for every day at 6AM)",
          ),
        note: z.string().optional().describe("Optional description"),
        llmProvider: z
          .string()
          .optional()
          .describe(
            "LLM provider for agent jobs: 'CLAUDE', 'OPENAI', 'GEMINI'. Uses app default if omitted.",
          ),
        jobs: z
          .array(
            z.object({
              type: z
                .enum(["agent", "workflow"])
                .default("agent")
                .describe(
                  "Job type: 'agent' runs a prompt, 'workflow' executes a workflow",
                ),
              order: z
                .number()
                .describe("Execution order (1-based, lower runs first)"),
              prompt: z
                .string()
                .optional()
                .describe(
                  "Task prompt for agent jobs (required when type is 'agent')",
                ),
              notifyPlatform: z
                .enum(["telegram"])
                .optional()
                .describe("Platform to send the result to"),
              notifyOnlyIfAgentSays: z
                .boolean()
                .optional()
                .describe("Let agent decide whether to notify"),
              useOutputFromPrev: z
                .boolean()
                .optional()
                .describe("Inject previous job output as context"),
              conditionType: z
                .enum(["none", "skip_if_prev_failed", "llm"])
                .optional()
                .describe("Condition to run this job"),
              conditionPrompt: z
                .string()
                .optional()
                .describe("Required when conditionType is 'llm'"),
              maxRetries: z
                .number()
                .optional()
                .describe("Max retry attempts on failure (default 0)"),
              retryDelayMinutes: z
                .number()
                .optional()
                .describe("Minutes between retries (default 5)"),
              campaignName: z
                .string()
                .optional()
                .describe("Campaign name (required for workflow jobs)"),
              workflowName: z
                .string()
                .optional()
                .describe("Workflow name to run (required for workflow jobs)"),
              workflowVariables: z
                .array(z.object({ variable: z.string(), value: z.string() }))
                .optional()
                .describe("Variable overrides for the workflow"),
            }),
          )
          .min(1)
          .describe("List of jobs to run in sequence"),
      },
    },
    async (args) => {
      const { llmProvider, ...scheduleArgs } = args;
      const approval = await showApprovalDialog(
        displayName,
        "create_agent_schedule",
        "Create a new agent schedule",
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      const toolCtx = new ToolContext();
      toolCtx.update({ llmProvider });
      return wrapText(
        (
          await createAgentScheduleTool(toolCtx).invoke(scheduleArgs)
        ).toString(),
      );
    },
  );

  const updateScheduleInstance = updateAgentScheduleTool();
  server.registerTool(
    "update_agent_schedule",
    {
      description: updateScheduleInstance.description,
      inputSchema: updateScheduleInstance.schema.shape,
    },
    async (args: any) => {
      const approval = await showApprovalDialog(
        displayName,
        "update_agent_schedule",
        updateScheduleInstance.description,
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      return wrapText((await updateScheduleInstance.invoke(args)).toString());
    },
  );

  const deleteScheduleInstance = deleteAgentScheduleTool();
  server.registerTool(
    "delete_agent_schedule",
    {
      description: deleteScheduleInstance.description,
      inputSchema: deleteScheduleInstance.schema.shape,
    },
    async (args: any) => {
      const approval = await showApprovalDialog(
        displayName,
        "delete_agent_schedule",
        deleteScheduleInstance.description,
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      return wrapText((await deleteScheduleInstance.invoke(args)).toString());
    },
  );

  const pauseScheduleInstance = pauseAgentScheduleTool();
  server.registerTool(
    "pause_agent_schedule",
    {
      description: pauseScheduleInstance.description,
      inputSchema: pauseScheduleInstance.schema.shape,
    },
    async (args: any) => {
      const approval = await showApprovalDialog(
        displayName,
        "pause_agent_schedule",
        pauseScheduleInstance.description,
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      return wrapText((await pauseScheduleInstance.invoke(args)).toString());
    },
  );

  const resumeScheduleInstance = resumeAgentScheduleTool();
  server.registerTool(
    "resume_agent_schedule",
    {
      description: resumeScheduleInstance.description,
      inputSchema: resumeScheduleInstance.schema.shape,
    },
    async (args: any) => {
      const approval = await showApprovalDialog(
        displayName,
        "resume_agent_schedule",
        resumeScheduleInstance.description,
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      return wrapText((await resumeScheduleInstance.invoke(args)).toString());
    },
  );

  const runScheduleNowInstance = runAgentScheduleNowTool();
  server.registerTool(
    "run_agent_schedule_now",
    {
      description: runScheduleNowInstance.description,
      inputSchema: runScheduleNowInstance.schema.shape,
    },
    async (args: any) => {
      const approval = await showApprovalDialog(
        displayName,
        "run_agent_schedule_now",
        runScheduleNowInstance.description,
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      return wrapText((await runScheduleNowInstance.invoke(args)).toString());
    },
  );

  server.registerTool(
    "swap_on_jupiter",
    {
      description:
        "Swap SOL ↔ SPL token on Jupiter for all wallets in a campaign on Solana",
      inputSchema: {
        ...walletContextSchema,
        swapDirection: z
          .enum(["BUY", "SELL"])
          .describe("BUY = SOL → token, SELL = token → SOL"),
        outputTokenAddress: z
          .string()
          .optional()
          .describe("SPL mint address of the token to buy (BUY only)"),
        inputTokenAddress: z
          .string()
          .optional()
          .describe("SPL mint address of the token to sell (SELL only)"),
        amountStrategy: z
          .enum(["EQUAL_PER_WALLET", "RANDOM_PER_WALLET", "TOTAL_SPLIT_RANDOM"])
          .optional()
          .describe("Amount distribution strategy across wallets"),
        amount: z
          .number()
          .optional()
          .describe("Per-wallet amount (for EQUAL_PER_WALLET)"),
        totalAmount: z
          .number()
          .optional()
          .describe("Total amount to split (for TOTAL_SPLIT_RANDOM)"),
        minAmount: z
          .number()
          .optional()
          .describe("Min per-wallet amount (for RANDOM_PER_WALLET)"),
        maxAmount: z
          .number()
          .optional()
          .describe("Max per-wallet amount (for RANDOM_PER_WALLET)"),
        sellPercentage: z
          .union([z.enum(["all", "half"]), z.number().min(0).max(100)])
          .optional()
          .describe("SELL only: 'all'=100%, 'half'=50%, or 0–100"),
        slippagePercentage: z
          .number()
          .optional()
          .describe("Slippage tolerance in % (default 1)"),
      },
    },
    async (args) => {
      const {
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
        ...swapArgs
      } = args;
      const approval = await showApprovalDialog(
        displayName,
        "swap_on_jupiter",
        "Swap tokens on Jupiter for campaign wallets",
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      const toolCtx = buildToolContext({
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
      });
      return wrapText(
        (await swapOnJupiterTool(toolCtx).invoke(swapArgs)).toString(),
      );
    },
  );

  server.registerTool(
    "swap_on_kyberswap",
    {
      description:
        "Swap tokens on KyberSwap for all wallets in a campaign on EVM chains",
      inputSchema: {
        ...walletContextSchema,
        chainKey: z
          .string()
          .describe(
            "EVM chain key (e.g. 'ethereum', 'bsc', 'base', 'arbitrum', 'polygon')",
          ),
        swapDirection: z
          .enum(["BUY", "SELL"])
          .describe("BUY = native → token, SELL = token → native"),
        tokenAddress: z
          .string()
          .describe("ERC-20 token contract address to buy or sell"),
        amountStrategy: z
          .enum(["EQUAL_PER_WALLET", "RANDOM_PER_WALLET", "TOTAL_SPLIT_RANDOM"])
          .optional()
          .describe("Amount distribution strategy across wallets"),
        amount: z
          .number()
          .optional()
          .describe("Per-wallet amount (for EQUAL_PER_WALLET)"),
        totalAmount: z
          .number()
          .optional()
          .describe("Total amount to split (for TOTAL_SPLIT_RANDOM)"),
        minAmount: z
          .number()
          .optional()
          .describe("Min per-wallet amount (for RANDOM_PER_WALLET)"),
        maxAmount: z
          .number()
          .optional()
          .describe("Max per-wallet amount (for RANDOM_PER_WALLET)"),
        sellPercentage: z
          .union([z.enum(["all", "half"]), z.number().min(0).max(100)])
          .optional()
          .describe("SELL only: 'all'=100%, 'half'=50%, or 0–100"),
        slippagePercentage: z
          .number()
          .optional()
          .describe("Slippage tolerance in % (default 1)"),
      },
    },
    async (args) => {
      const {
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
        chainKey,
        ...swapArgs
      } = args;
      const approval = await showApprovalDialog(
        displayName,
        "swap_on_kyberswap",
        "Swap tokens on KyberSwap for campaign wallets",
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      const toolCtx = buildToolContext({
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
        chainKey,
      });
      return wrapText(
        (await swapOnKyberswapTool(toolCtx).invoke(swapArgs)).toString(),
      );
    },
  );

  server.registerTool(
    "transfer_solana_token",
    {
      description:
        "Transfer SOL or SPL token from a source wallet to other wallets in a campaign",
      inputSchema: {
        ...walletContextSchema,
        sourceWalletAddress: z
          .string()
          .describe(
            "Solana address of the source wallet (must belong to the campaign)",
          ),
        tokenAddress: z
          .string()
          .optional()
          .describe("SPL token mint address. Omit for native SOL."),
        amountStrategy: z
          .enum(["EQUAL_PER_WALLET", "RANDOM_PER_WALLET", "TOTAL_SPLIT_RANDOM"])
          .describe("Amount distribution strategy"),
        amount: z
          .number()
          .optional()
          .describe("Per-wallet amount (for EQUAL_PER_WALLET)"),
        totalAmount: z
          .number()
          .optional()
          .describe("Total amount to split (for TOTAL_SPLIT_RANDOM)"),
        minAmount: z
          .number()
          .optional()
          .describe("Min per-wallet amount (for RANDOM_PER_WALLET)"),
        maxAmount: z
          .number()
          .optional()
          .describe("Max per-wallet amount (for RANDOM_PER_WALLET)"),
      },
    },
    async (args) => {
      const {
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
        ...transferArgs
      } = args;
      const approval = await showApprovalDialog(
        displayName,
        "transfer_solana_token",
        "Transfer SOL or SPL token between campaign wallets",
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      const toolCtx = buildToolContext({
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
      });
      return wrapText(
        (
          await transferSolanaTokenTool(toolCtx).invoke(transferArgs)
        ).toString(),
      );
    },
  );

  server.registerTool(
    "launch_pumpfun_token",
    {
      description:
        "Launch a new token on Pump.fun from a campaign wallet on Solana",
      inputSchema: {
        ...walletContextSchema,
        name: z.string().describe("Token name"),
        symbol: z.string().describe("Token ticker symbol"),
        description: z.string().optional().describe("Token description"),
        imagePath: z
          .string()
          .optional()
          .describe("Local path to the token image file"),
        website: z.string().optional().describe("Project website URL"),
        twitter: z.string().optional().describe("Twitter/X handle or URL"),
        telegram: z.string().optional().describe("Telegram group URL"),
        initialBuyAmount: z
          .number()
          .optional()
          .describe("Initial SOL amount to buy after launch"),
      },
    },
    async (args) => {
      const {
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
        ...launchArgs
      } = args;
      const approval = await showApprovalDialog(
        displayName,
        "launch_pumpfun_token",
        "Launch a new token on Pump.fun",
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      const toolCtx = buildToolContext({
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
      });
      return wrapText(
        (await launchPumpfunTokenTool(toolCtx).invoke(launchArgs)).toString(),
      );
    },
  );

  server.registerTool(
    "launch_bonkfun_token",
    {
      description:
        "Launch a new token on Bonk.fun from a campaign wallet on Solana",
      inputSchema: {
        ...walletContextSchema,
        name: z.string().describe("Token name"),
        symbol: z.string().describe("Token ticker symbol"),
        description: z.string().optional().describe("Token description"),
        imagePath: z
          .string()
          .optional()
          .describe("Local path to the token image file"),
        website: z.string().optional().describe("Project website URL"),
        twitter: z.string().optional().describe("Twitter/X handle or URL"),
        telegram: z.string().optional().describe("Telegram group URL"),
        initialBuyAmount: z
          .number()
          .optional()
          .describe("Initial SOL amount to buy after launch"),
      },
    },
    async (args) => {
      const {
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
        ...launchArgs
      } = args;
      const approval = await showApprovalDialog(
        displayName,
        "launch_bonkfun_token",
        "Launch a new token on Bonk.fun",
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      const toolCtx = buildToolContext({
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
      });
      return wrapText(
        (await launchBonkfunTokenTool(toolCtx).invoke(launchArgs)).toString(),
      );
    },
  );

  server.registerTool(
    "broadcast_transaction_evm",
    {
      description:
        "Broadcast a raw or constructed EVM transaction from campaign wallets",
      inputSchema: {
        ...walletContextSchema,
        chainKey: z
          .string()
          .describe(
            "EVM chain key (e.g. 'ethereum', 'bsc', 'base', 'arbitrum')",
          ),
        to: z.string().describe("Recipient contract or wallet address (0x...)"),
        data: z
          .string()
          .optional()
          .describe("Encoded calldata for contract interaction (0x...)"),
        value: z
          .string()
          .optional()
          .describe(
            "Native token value in wei (as string, e.g. '1000000000000000000')",
          ),
        gasLimit: z
          .string()
          .optional()
          .describe("Gas limit override (as string)"),
      },
    },
    async (args) => {
      const {
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
        chainKey,
        ...txArgs
      } = args;
      const approval = await showApprovalDialog(
        displayName,
        "broadcast_transaction_evm",
        "Broadcast an EVM transaction from campaign wallets",
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      const toolCtx = buildToolContext({
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
        chainKey,
      });
      return wrapText(
        (await broadcastTransactionEvmTool(toolCtx).invoke(txArgs)).toString(),
      );
    },
  );

  server.registerTool(
    "broadcast_transaction_solana",
    {
      description:
        "Broadcast a raw or constructed Solana transaction from campaign wallets",
      inputSchema: {
        ...walletContextSchema,
        instructions: z
          .string()
          .describe(
            "Base64-encoded serialized transaction or instruction data",
          ),
        computeUnitPrice: z
          .number()
          .optional()
          .describe("Priority fee in micro-lamports per compute unit"),
      },
    },
    async (args) => {
      const {
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
        ...txArgs
      } = args;
      const approval = await showApprovalDialog(
        displayName,
        "broadcast_transaction_solana",
        "Broadcast a Solana transaction from campaign wallets",
        formatArgs(args),
      );
      if (approval === ApprovalResult.DENIED) {
        return DENIED_RESPONSE;
      }
      const toolCtx = buildToolContext({
        campaignId,
        nodeEndpointGroupId,
        encryptKey,
        isAllWallet,
        listCampaignProfileId,
      });
      return wrapText(
        (
          await broadcastTransactionSolanaTool(toolCtx).invoke(txArgs)
        ).toString(),
      );
    },
  );

  registerAgentTaskWriteTools(server, mcpToken);
};

export { registerWriteTools };
