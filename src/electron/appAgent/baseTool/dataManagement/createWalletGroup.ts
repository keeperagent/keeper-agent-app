import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { walletGroupDB } from "@/electron/database/walletGroup";
import { logEveryWhere } from "@/electron/service/util";
import { PORTFOLIO_APP } from "@/electron/constant";
import type { SupportedChainType } from "@/electron/appAgent/types";
import {
  findWalletGroupByName,
  normalizeChainType,
  safeStringify,
} from "@/electron/appAgent/utils";
import { TOOL_KEYS } from "@/electron/constant";

export const createWalletGroupTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.CREATE_WALLET_GROUP,
    description:
      "Create a new wallet group. Provide a unique name and optionally a chainType (EVM, APTOS, SUI, SOLANA). The agent will set the portfolioApp automatically based on the chain type. If wallets will be generated later, remember to collect the user's encryptKey so it can be passed to wallet creation tools.",
    schema: z.object({
      name: z.string().min(1, "name is required"),
      note: z.string().optional(),
      chainType: z.string().optional(),
    }),
    func: async ({ name, note, chainType }) => {
      const normalizedName = name.trim();
      const existingGroup = await findWalletGroupByName(normalizedName);
      if (existingGroup) {
        logEveryWhere({
          message: `[Agent] Wallet group "${normalizedName}" already exists (id=${existingGroup.id})`,
        });
        return safeStringify({
          status: "exists",
          walletGroup: existingGroup,
        });
      }

      let resolvedChainType: SupportedChainType | undefined;
      if (chainType) {
        resolvedChainType = normalizeChainType(chainType);
      }

      const chainPortfolioMap: Record<SupportedChainType, string> = {
        EVM: PORTFOLIO_APP.DEBANK,
        SOLANA: PORTFOLIO_APP.SOL_SCAN,
        APTOS: PORTFOLIO_APP.APTOS_EXPLORER,
        SUI: PORTFOLIO_APP.SUI_VISION,
      };
      const resolvedPortfolioApp = resolvedChainType
        ? chainPortfolioMap[resolvedChainType]
        : undefined;

      const [createdGroup, err] = await walletGroupDB.createWalletGroup({
        name: normalizedName,
        note: note?.trim(),
        typeName: resolvedChainType || chainType || undefined,
        portfolioApp: resolvedPortfolioApp,
      });
      if (err) {
        throw err;
      }
      if (!createdGroup) {
        throw new Error("Failed to create wallet group");
      }

      logEveryWhere({
        message: `[Agent] Created wallet group "${createdGroup.name}" (id=${createdGroup.id})`,
      });

      return safeStringify({
        status: "created",
        walletGroup: createdGroup,
      });
    },
  });
