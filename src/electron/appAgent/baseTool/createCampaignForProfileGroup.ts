import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { campaignDB } from "@/electron/database/campaign";
import { logEveryWhere } from "@/electron/service/util";
import { safeStringify, resolveProfileGroup } from "@/electron/appAgent/utils";
import type { ICampaign } from "@/electron/type";

export const createCampaignForProfileGroupTool = () =>
  new DynamicStructuredTool({
    name: "create_campaign_for_profile_group",
    description:
      "Create a campaign associated with a profile group. Provide campaign name and profileGroupId or profileGroupName. Optional fields include note, numberOfThread, numberOfRound, color, isUseBrowser, isUseProxy, and maxProfilePerProxy.",
    schema: z
      .object({
        name: z.string().min(1, "name is required"),
        profileGroupName: z.string().optional(),
        note: z.string().optional(),
        numberOfThread: z.number().int().min(0).max(999).optional(),
        numberOfRound: z.number().int().min(0).max(999).optional(),
        color: z.string().optional(),
        isUseBrowser: z.boolean().optional(),
        isUseProxy: z.boolean().optional(),
        maxProfilePerProxy: z.number().int().min(1).max(1000).optional(),
      })
      .refine((value) => Boolean(value.profileGroupName), {
        message: "profileGroupName is required",
      }),
    func: async ({
      name,
      profileGroupName,
      note,
      numberOfThread,
      numberOfRound,
      color,
      isUseBrowser,
      isUseProxy,
      maxProfilePerProxy,
    }) => {
      const profileGroup = await resolveProfileGroup({
        profileGroupName,
      });

      const [campaign, err] = await campaignDB.createCampaign({
        name: name.trim(),
        note: note?.trim(),
        profileGroupId: profileGroup.id,
        numberOfThread: numberOfThread || 0,
        numberOfRound: numberOfRound || 0,
        color: color?.trim() || "",
        isUseBrowser: typeof isUseBrowser === "boolean" ? isUseBrowser : false,
        isUseProxy: typeof isUseProxy === "boolean" ? isUseProxy : false,
        maxProfilePerProxy: maxProfilePerProxy || 2,
      } as ICampaign);
      if (err) {
        throw err;
      }
      if (!campaign) {
        throw new Error("Failed to create campaign");
      }

      logEveryWhere({
        message: `[Agent] Created campaign "${campaign.name}" (id=${campaign.id}) linked to profile group "${profileGroup.name}"`,
      });

      return safeStringify({
        status: "created",
        campaign,
      });
    },
  });
