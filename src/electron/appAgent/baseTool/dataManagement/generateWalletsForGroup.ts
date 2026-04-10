import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createRandomWallet } from "@/electron/service/wallet";
import { CHAIN_TYPE } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";
import {
  getWalletCount,
  resolveChainTypeForGroup,
  resolveWalletGroup,
  safeStringify,
} from "@/electron/appAgent/utils";

export const generateWalletsForGroupTool = () =>
  new DynamicStructuredTool({
    name: "generate_wallets_for_group",
    description:
      "Generate random wallets for a wallet group. Provide walletGroupId or walletGroupName, chainType (EVM, APTOS, SUI, SOLANA), batchSize (default 1, max 1000), and optionally encryptKey. If encryptKey is omitted, you must confirm with the user before proceeding because wallets will be stored unencrypted.",
    schema: z
      .object({
        walletGroupId: z.number().int().positive().optional(),
        walletGroupName: z.string().optional(),
        chainType: z.string().optional(),
        batchSize: z.number().int().min(1).max(1000).default(1).optional(),
        encryptKey: z.string().optional(),
      })
      .refine(
        (value) => Boolean(value.walletGroupId || value.walletGroupName),
        {
          message: "walletGroupId or walletGroupName is required",
        },
      ),
    func: async ({
      walletGroupId,
      walletGroupName,
      chainType,
      batchSize,
      encryptKey,
    }) => {
      const walletGroup = await resolveWalletGroup({
        walletGroupId,
        walletGroupName,
      });
      const resolvedChainType = resolveChainTypeForGroup(
        chainType,
        walletGroup,
      );
      const targetBatchSize = batchSize || 1;
      const trimmedEncryptKey = encryptKey?.trim();

      const countBefore = await getWalletCount(walletGroup.id!);
      const success = await createRandomWallet({
        batchSize: targetBatchSize,
        groupId: walletGroup.id!,
        encryptKey: trimmedEncryptKey,
        chainType: CHAIN_TYPE[resolvedChainType] || CHAIN_TYPE.SOLANA,
      });
      if (!success) {
        throw new Error("Failed to generate wallets");
      }

      const countAfter = await getWalletCount(walletGroup.id!);
      const inserted = Math.max(0, countAfter - countBefore);

      logEveryWhere({
        message: `[Agent] Generated ${inserted} wallet(s) for group "${walletGroup.name}" (id=${walletGroup.id})`,
      });

      return safeStringify({
        status: "completed",
        walletGroupId: walletGroup.id,
        walletGroupName: walletGroup.name,
        chainType: resolvedChainType,
        requested: targetBatchSize,
        inserted,
        totalWalletInGroup: countAfter,
      });
    },
  });
