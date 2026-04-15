import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { PublicKey } from "@solana/web3.js";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { ICampaignProfile, IWallet } from "@/electron/type";
import { safeStringify } from "@/electron/appAgent/utils";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { decryptWallet } from "@/electron/service/wallet";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import { SolanaTransactionExecutor } from "@/electron/simulator/category/onchain/solanaExecuteTransaction";
import { logEveryWhere } from "@/electron/service/util";
import { ToolContext, PlanState } from "@/electron/appAgent/toolContext";
import { extractErrorMessage } from "../utils";
import { TOOL_KEYS } from "@/electron/constant";

const CONFIRMATION_TIMEOUT = 30000;

const broadcastTransactionSolanaSchema = z.object({
  transactionData: z
    .string()
    .refine(
      (val) => {
        try {
          const decoded = Buffer.from(val, "base64");
          return decoded.length > 0 && decoded.toString("base64") === val;
        } catch {
          return false;
        }
      },
      {
        message:
          "Must be a valid base64-encoded string representing a serialized Solana transaction.",
      },
    )
    .describe(
      "Base64-encoded serialized Solana transaction. The transaction should have instructions set but does NOT need to be signed — the tool will sign it with the wallet's private key and set a fresh blockhash.",
    ),
});

export const broadcastTransactionSolanaTool = (
  toolContext?: ToolContext,
): DynamicStructuredTool =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.BROADCAST_TRANSACTION_SOLANA,
    description: `Broadcast a serialized transaction to Solana using campaign wallets.
The transaction data must be base64-encoded. The tool handles signing with each wallet's private key and refreshes the blockhash automatically.
Use this for custom on-chain operations that are not covered by other tools (e.g. custom contract interactions, arbitrary instructions).`,
    schema: broadcastTransactionSolanaSchema,
    func: async ({ transactionData }) => {
      if (toolContext?.planState !== PlanState.APPROVED) {
        return safeStringify({
          error:
            "Cannot broadcast transaction in planning mode. Call submit_plan with your execution plan first to get user approval.",
          status: "blocked_planning_mode",
        });
      }
      const effectiveNodeEndpointGroupId = toolContext?.nodeEndpointGroupId;
      const effectiveEncryptKey = toolContext?.encryptKey;
      const effectiveCampaignId = toolContext?.campaignId;

      if (!effectiveCampaignId) {
        throw new Error(
          "campaignId is required. Please provide it from context or specify it explicitly.",
        );
      }

      if (!effectiveNodeEndpointGroupId) {
        throw new Error(
          "nodeEndpointGroupId is required. Please provide it from context or specify it explicitly.",
        );
      }

      const [listNodeEndpoint, errList] =
        await nodeEndpointDB.getListNodeEndpointByGroupId(
          effectiveNodeEndpointGroupId,
        );
      if (errList) {
        throw errList;
      }
      const listNodeProvider =
        listNodeEndpoint
          ?.map((node) => node?.endpoint || "")
          ?.filter((endpoint) => Boolean(endpoint)) || [];
      if (!listNodeProvider.length) {
        throw new Error(
          "The configured node endpoint group has no active endpoints",
        );
      }

      // Resolve wallets from campaign profiles
      const effectiveIsAllWallet = toolContext?.isAllWallet || false;
      const effectiveListCampaignProfileId =
        toolContext?.listCampaignProfileId || [];

      let profiles: ICampaignProfile[] = [];
      if (effectiveIsAllWallet) {
        const [allProfiles, errAll] =
          await campaignProfileDB.getAllProfileOfCampaign(
            effectiveCampaignId,
            true,
          );
        if (errAll) {
          throw errAll;
        }
        profiles = allProfiles || [];
      } else {
        if (!effectiveListCampaignProfileId.length) {
          throw new Error(
            "listCampaignProfileId is required when isAllWallet is false",
          );
        }
        const [resProfiles, errListProfiles] =
          await campaignProfileDB.getListCampaignProfile({
            page: 1,
            pageSize: effectiveListCampaignProfileId.length,
            campaignId: effectiveCampaignId,
            listId: effectiveListCampaignProfileId,
          });
        if (errListProfiles) {
          throw errListProfiles;
        }
        profiles = resProfiles?.data || [];
      }

      const wallets: IWallet[] =
        profiles
          ?.map((profile) => {
            const wallet = profile?.wallet
              ? decryptWallet(profile?.wallet, effectiveEncryptKey || "")
              : profile?.wallet;
            return wallet;
          })
          ?.filter((wallet): wallet is IWallet => Boolean(wallet)) || [];

      if (!wallets.length) {
        throw new Error("No wallets found for the selected campaign profiles");
      }

      // Validate wallet addresses are valid Solana addresses
      const invalidWallets = wallets.filter((wallet) => {
        if (!wallet?.address) {
          return true;
        }
        try {
          new PublicKey(wallet.address);
          return false;
        } catch {
          return true;
        }
      });

      if (invalidWallets.length > 0) {
        const invalidAddresses = invalidWallets
          .map((wallet) => wallet?.address || "unknown")
          .slice(0, 3)
          .join(", ");
        throw new Error(
          `Invalid wallet addresses detected for Solana chain. Found ${invalidWallets.length} invalid wallet(s): ${invalidAddresses}${invalidWallets.length > 3 ? "..." : ""}. Please check: (1) If you provided the correct encryption key, (2) If you selected wallets on the correct chain (Solana).`,
        );
      }

      const solanaProvider = new SolanaProvider();
      const executor = new SolanaTransactionExecutor(solanaProvider);

      const logInfo = {
        campaignId: effectiveCampaignId,
        workflowId: 0,
      };

      logEveryWhere({
        message: `[Agent] Broadcasting Solana transaction for ${wallets.length} wallet(s)`,
      });

      const results: Array<{
        wallet: string;
        txHash: string | null;
        error?: string;
      }> = [];

      for (let index = 0; index < wallets.length; index++) {
        const wallet = wallets[index];

        try {
          const [txHash, err] = await executor.executeTransaction(
            {
              name: "agent_broadcast_solana",
              sleep: 0,
              transactionData,
              shouldWaitTransactionComfirmed: true,
            },
            wallet?.privateKey || "",
            listNodeProvider,
            CONFIRMATION_TIMEOUT,
            logInfo,
          );

          results.push({
            wallet: wallet?.address || "",
            txHash,
            error: err ? extractErrorMessage(err) : undefined,
          });
        } catch (err: any) {
          results.push({
            wallet: wallet?.address || "",
            txHash: null,
            error: extractErrorMessage(err),
          });
        }
      }

      const successCount = results.filter(
        (result) => result.txHash && !result.error,
      ).length;
      const failedEntries = results.filter((result) => result.error);

      return safeStringify({
        chain: "Solana",
        summary: {
          total: wallets.length,
          success: successCount,
          failed: failedEntries.length,
        },
        ...(wallets.length <= 5 && {
          results: results.map((result) => ({
            wallet: result.wallet,
            txHash: result.txHash,
            ...(result.error && { error: result.error }),
          })),
        }),
        ...(wallets.length > 5 &&
          failedEntries.length > 0 && { failures: failedEntries }),
      });
    },
  });
