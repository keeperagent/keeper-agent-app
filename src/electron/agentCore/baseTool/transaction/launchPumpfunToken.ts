import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { Pumpfun } from "@/electron/simulator/category/onchain/pumpfun";
import { ICampaignProfile, IWallet } from "@/electron/type";
import { safeStringify } from "@/electron/agentCore/utils";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { decryptWallet } from "@/electron/service/wallet";
import { logEveryWhere } from "@/electron/service/util";
import { ToolContext, PlanState } from "@/electron/agentCore/toolContext";
import { TOOL_KEYS } from "@/electron/constant";

export const launchPumpfunTokenTool = (toolContext?: ToolContext) =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.LAUNCH_PUMPFUN_TOKEN,
    description: `Launch a new token on Pump.fun (Solana only).
ONLY use when chainKey from context is "solana". Uses the first wallet from selected campaign profiles.
Required: tokenName, symbol. If imageUrl omitted, the first image in the user's attached files is used.
Optional: imageUrl (URL or local file path), description, twitter, telegram, website, buyAmountSol, slippagePercentage, unitLimit, unitPrice.`,
    schema: z.object({
      tokenName: z
        .string()
        .min(1, "tokenName is required")
        .describe("Token name"),
      symbol: z
        .string()
        .min(1, "symbol is required")
        .describe("Token symbol/ticker"),
      imageUrl: z
        .string()
        .describe(
          "URL or local file path to token image. Pass empty string to use the first image in attached files.",
        ),
      description: z
        .string()
        .describe("Token description. Pass empty string if none."),
      twitter: z
        .string()
        .describe("Twitter handle or URL. Pass empty string if none."),
      telegram: z
        .string()
        .describe("Telegram group or URL. Pass empty string if none."),
      website: z.string().describe("Website URL. Pass empty string if none."),
      buyAmountSol: z
        .number()
        .nonnegative()
        .describe(
          "SOL to buy immediately after launch. Pass 0 to skip initial buy.",
        ),
      slippagePercentage: z
        .number()
        .nonnegative()
        .describe("Slippage % for the initial buy. Pass 0 for default."),
      unitLimit: z.string().describe("Gas limit (default: '300000')."),
      unitPrice: z
        .string()
        .describe("Gas price in microLamports (default: '100')."),
    }),
    func: async ({
      tokenName,
      symbol,
      imageUrl,
      description,
      twitter,
      telegram,
      website,
      buyAmountSol,
      slippagePercentage,
      unitLimit,
      unitPrice,
    }) => {
      console.log(
        `[launch_pumpfun_token] planState="${toolContext?.planState}" expected="${PlanState.APPROVED}"`,
      );
      if (toolContext?.planState !== PlanState.APPROVED) {
        return safeStringify({
          error:
            "Cannot launch token in planning mode. Call confirm_approval with your execution plan first to get user approval.",
          status: "blocked_planning_mode",
        });
      }
      // Resolve image: use provided imageUrl or first image from attached files
      let effectiveImageUrl = imageUrl?.trim() || "";
      if (!effectiveImageUrl && toolContext?.attachedFiles?.length) {
        const firstImage = toolContext.attachedFiles.find(
          (f) => (f.type || "").toLowerCase() === "image",
        );
        if (firstImage?.filePath) effectiveImageUrl = firstImage.filePath;
      }
      if (!effectiveImageUrl) {
        throw new Error(
          "imageUrl is required for token launch. Please provide an image URL/path or attach an image to your message.",
        );
      }

      // Validate chain is Solana
      if (
        !toolContext?.chainKey ||
        toolContext.chainKey.toLowerCase() !== "solana"
      ) {
        throw new Error(
          "Token launches on Pump.fun are only supported on Solana blockchain. Please switch to Solana chain in the app first, then try again.",
        );
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

      const effectiveIsAllWallet = toolContext?.isAllWallet || false;
      const effectiveListCampaignProfileId =
        toolContext?.listCampaignProfileId || [];

      // Resolve wallets from campaign profiles
      let profiles: ICampaignProfile[] = [];
      if (effectiveIsAllWallet) {
        const [allProfiles, errAll] =
          await campaignProfileDB.getAllProfileOfCampaign(
            effectiveCampaignId,
            true,
          );
        if (errAll) throw errAll;
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
        if (errListProfiles) throw errListProfiles;
        profiles = resProfiles?.data || [];
      }

      if (!profiles.length) {
        throw new Error("No wallet profiles found for the specified campaign");
      }

      // Use the first wallet for token launch
      const profile = profiles[0];
      const wallet: IWallet | null = profile.wallet || null;

      if (!wallet) {
        throw new Error(
          `Profile ${profile.id} does not have an associated wallet`,
        );
      }

      // Decrypt wallet first before validation
      const decryptedWallet = decryptWallet(wallet, effectiveEncryptKey || "");
      if (!decryptedWallet.privateKey) {
        throw new Error(
          `Failed to decrypt wallet: Wallet does not have a private key. Please check your encryption key.`,
        );
      }

      // Validate wallet is Solana wallet (check decrypted address)
      if (!decryptedWallet.address) {
        throw new Error(
          "The selected wallet does not have an address. Please select a valid wallet from your campaign profiles.",
        );
      }

      try {
        new PublicKey(decryptedWallet.address);
      } catch {
        throw new Error(
          "The selected wallet is not a Solana wallet. Please select a Solana wallet from your campaign profiles, then try again.",
        );
      }

      const pumpfun = new Pumpfun();
      const [txHash, tokenAddress, error] = await pumpfun.createToken(
        decryptedWallet.privateKey,
        listNodeProvider,
        {
          name: tokenName,
          sleep: 0,
          tokenName,
          symbol,
          imageUrl: effectiveImageUrl,
          description,
          twitter,
          telegram,
          website,
          buyAmountSol: buyAmountSol?.toString(),
          slippagePercentage,
          unitLimit,
          unitPrice,
        },
      );

      if (error) {
        throw error;
      }

      toolContext?.resetPlanState();

      const toolResult = safeStringify({
        success: true,
        tokenName,
        symbol,
        tokenAddress,
        transactionHash: txHash,
        wallet: decryptedWallet.address,
      });

      logEveryWhere({
        message: `[launch_pumpfun_token] tool result: ${toolResult}`,
      });
      return toolResult;
    },
  });
