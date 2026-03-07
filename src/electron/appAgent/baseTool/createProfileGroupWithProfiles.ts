import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { profileGroupDB } from "@/electron/database/profileGroup";
import { profileDB } from "@/electron/database/profile";
import { logEveryWhere } from "@/electron/service/util";
import type { IProfile } from "@/electron/type";
import {
  fetchWalletsForGroup,
  findProfileGroupByName,
  getProfileCount,
  resolveWalletGroup,
  safeStringify,
} from "@/electron/appAgent/utils";

export const createProfileGroupWithProfilesTool = () =>
  new DynamicStructuredTool({
    name: "create_profile_group_with_profiles",
    description:
      "Create a profile group linked to a wallet group and populate it with profiles derived from the group's wallets. Provide walletGroupId or walletGroupName. Optionally specify profileCount and profileNamePrefix.",
    schema: z
      .object({
        name: z.string().min(1, "name is required"),
        note: z.string().optional(),
        walletGroupId: z.number().int().positive().optional(),
        walletGroupName: z.string().optional(),
        profileCount: z.number().int().min(1).max(10000).optional(),
        profileNamePrefix: z.string().optional(),
      })
      .refine(
        (value) => Boolean(value.walletGroupId || value.walletGroupName),
        {
          message: "walletGroupId or walletGroupName is required",
        }
      ),
    func: async ({
      name,
      note,
      walletGroupId,
      walletGroupName,
      profileCount,
      profileNamePrefix,
    }) => {
      const walletGroup = await resolveWalletGroup({
        walletGroupId,
        walletGroupName,
      });

      const normalizedName = name.trim();
      const existingGroup = await findProfileGroupByName(normalizedName);
      let profileGroup;

      if (existingGroup) {
        profileGroup = existingGroup;
      } else {
        const [createdGroup, err] = await profileGroupDB.createProfileGroup({
          name: normalizedName,
          note: note?.trim(),
          walletGroupId: walletGroup.id,
          listResourceGroupId: [],
        });
        if (err) {
          throw err;
        }
        if (!createdGroup) {
          throw new Error("Failed to create profile group");
        }

        profileGroup = createdGroup;
        logEveryWhere({
          message: `[Agent] Created profile group "${profileGroup.name}" (id=${profileGroup.id}) linked to wallet group "${walletGroup.name}"`,
        });
      }

      const targetProfileGroupId = profileGroup.id!;
      const availableWallets = await fetchWalletsForGroup(
        walletGroup.id!,
        profileCount
      );
      if (!availableWallets.length) {
        return safeStringify({
          status: existingGroup ? "exists" : "created",
          profileGroup,
          createdProfiles: 0,
          reason: "wallet group has no wallets",
        });
      }

      const existingProfileCount = await getProfileCount(targetProfileGroupId);
      const desiredCount = profileCount
        ? Math.min(profileCount, availableWallets.length)
        : availableWallets.length;
      const prefix =
        profileNamePrefix?.trim() || profileGroup.name || "Profile";

      const profiles: IProfile[] = [];
      for (let i = 0; i < desiredCount; i++) {
        const wallet = availableWallets[i];
        if (!wallet?.id) {
          continue;
        }

        profiles.push({
          name: `${prefix} ${existingProfileCount + i + 1}`,
          groupId: targetProfileGroupId,
          walletId: wallet.id,
          walletGroupId: wallet.groupId || walletGroup.id,
          listResourceId: [],
        });
      }

      if (!profiles.length) {
        return safeStringify({
          status: existingGroup ? "exists" : "created",
          profileGroup,
          createdProfiles: 0,
          reason: "no wallets with identifiers were available",
        });
      }

      const createErr = await profileDB.createBulkProfile(profiles);
      if (createErr) {
        throw createErr;
      }

      const totalProfiles = await getProfileCount(targetProfileGroupId);

      logEveryWhere({
        message: `[Agent] Added ${profiles.length} profile(s) to profile group "${profileGroup.name}"`,
      });

      return safeStringify({
        status: existingGroup ? "updated" : "created",
        profileGroup,
        createdProfiles: profiles.length,
        totalProfiles,
      });
    },
  });
