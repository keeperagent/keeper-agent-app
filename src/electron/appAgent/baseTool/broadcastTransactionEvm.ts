import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod/v3";
import { ethers } from "ethers";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { EVM_TRANSACTION_TYPE } from "@/electron/constant";
import { ICampaignProfile, IWallet } from "@/electron/type";
import { safeStringify } from "@/electron/appAgent/utils";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { decryptWallet } from "@/electron/service/wallet";
import { EvmTransactionExecutor } from "@/electron/simulator/category/onchain/evmExecuteTransaction";
import { logEveryWhere } from "@/electron/service/util";
import { capitalizeFirstLetter, extractErrorMessage } from "./utils";
import { ToolContext } from "@/electron/appAgent/toolContext";

const CONFIRMATION_TIMEOUT = 30000;

const broadcastTransactionEvmSchema = z.object({
  toAddress: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") {
          return true;
        }
        return ethers.utils.isAddress(val);
      },
      {
        message:
          "Must be a valid EVM address (0x followed by 40 hex characters). Omit for contract deployment.",
      },
    )
    .describe(
      "Target contract or address for the transaction. Omit for contract deployment.",
    ),
  transactionData: z
    .string()
    .refine((val) => /^0x[0-9a-fA-F]+$/.test(val), {
      message: "Must be a 0x-prefixed hexadecimal string (e.g. 0xa9059cbb...).",
    })
    .describe(
      "Hex-encoded transaction calldata (0x-prefixed). For contract interactions, this is the ABI-encoded function call.",
    ),
  transactionValue: z
    .string()
    .default("0")
    .optional()
    .refine(
      (val) => {
        if (!val) {
          return true;
        }
        return /^[0-9]+$/.test(val);
      },
      {
        message: "Must be a non-negative integer string representing wei.",
      },
    )
    .describe("Value to send in wei (as string). Defaults to '0'."),
});

export const broadcastTransactionEvmTool = (
  toolContext?: ToolContext,
): DynamicStructuredTool =>
  new DynamicStructuredTool({
    name: "broadcast_transaction_evm",
    description: `Broadcast a transaction to an EVM chain using campaign wallets.
The transaction data must be hex-encoded (0x-prefixed). Gas limit and gas price are auto-estimated.
Use this for custom on-chain operations that are not covered by other tools (e.g. custom contract interactions, arbitrary calldata).`,
    schema: broadcastTransactionEvmSchema,
    func: async ({ toAddress, transactionData, transactionValue = "0" }) => {
      if (toolContext?.planningMode) {
        return safeStringify({
          error:
            "Cannot broadcast transaction in planning mode. Call submit_plan with your execution plan first to get user approval.",
          status: "blocked_planning_mode",
        });
      }
      const chainKey = toolContext?.chainKey || "";
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
        throw new Error(
          "No valid wallets found in the selected campaign profiles",
        );
      }

      // Validate wallet addresses are valid EVM addresses
      const invalidWallets = wallets.filter((wallet) => {
        if (!wallet?.address) {
          return true;
        }
        return !ethers.utils.isAddress(wallet.address);
      });

      if (invalidWallets.length > 0) {
        const invalidAddresses = invalidWallets
          .map((wallet) => wallet?.address || "unknown")
          .slice(0, 3)
          .join(", ");
        throw new Error(
          `Invalid wallet addresses detected for EVM chain (${chainKey}). Found ${invalidWallets.length} invalid wallet(s): ${invalidAddresses}${invalidWallets.length > 3 ? "..." : ""}. Please check: (1) If you provided the correct encryption key, (2) If you selected wallets on the correct chain (${chainKey}).`,
        );
      }

      const executor = new EvmTransactionExecutor();

      const logInfo = {
        campaignId: effectiveCampaignId,
        workflowId: 0,
      };

      logEveryWhere({
        message: `[Agent] Broadcasting EVM transaction for ${wallets.length} wallet(s) on ${chainKey}`,
      });

      const results: Array<{
        wallet: string;
        txHash: string | null;
        error?: string;
      }> = [];

      for (let index = 0; index < wallets.length; index++) {
        const wallet = wallets[index];

        try {
          const [txHash, err] = await executor.executeSingleTransaction(
            {
              name: "agent_broadcast_evm",
              sleep: 0,
              transactionData,
              toAddress: toAddress || "",
              transactionValue: transactionValue || "0",
              transactionType: EVM_TRANSACTION_TYPE.LEGACY,
              shouldWaitTransactionComfirmed: true,
              gasPrice: "",
              gasLimit: "",
            },
            listNodeProvider,
            wallet?.privateKey || "",
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
        chain: capitalizeFirstLetter(chainKey),
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
  }) as DynamicStructuredTool;
