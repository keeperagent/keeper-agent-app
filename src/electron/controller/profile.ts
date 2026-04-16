import _ from "lodash";
import { profileDB } from "@/electron/database/profile";
import { walletDB } from "@/electron/database/wallet";
import { resourceDB } from "@/electron/database/resource";
import { generateMix, exportProfile } from "@/electron/service/profile";
import { decryptWallet } from "@/electron/service/wallet";
import { decryptResource } from "@/electron/service/resource";
import { MESSAGE, TYPE_NAME } from "@/electron/constant";
import { IProfile, IResource, IWallet } from "@/electron/type";
import { onIpc } from "./helpers";
import type {
  IpcCreateProfilePayload,
  IpcDeletePayload,
  IpcExportProfilePayload,
  IpcGetListProfilePayload,
  IpcUpdateProfilePayload,
} from "@/electron/ipcTypes";

export const profileController = () => {
  onIpc<IpcGetListProfilePayload>(
    MESSAGE.GET_LIST_PROFILE,
    MESSAGE.GET_LIST_PROFILE_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, groupId, encryptKey } = payload;
      const [res] = await profileDB.getListProfile(
        page,
        pageSize,
        searchText,
        groupId,
        encryptKey,
      );

      let listData = res?.data;
      if (encryptKey) {
        listData = listData?.map((profile: IProfile) => {
          return {
            ...profile,
            wallet: profile?.wallet
              ? decryptWallet(profile?.wallet, encryptKey)
              : profile?.wallet,
            listResource:
              profile?.listResource && profile?.listResource?.length > 0
                ? profile?.listResource?.map((resource: IResource) =>
                    decryptResource(resource, encryptKey),
                  )
                : profile?.listResource,
          };
        });
      }

      event.reply(MESSAGE.GET_LIST_PROFILE_RES, {
        data: { ...res, data: listData },
      });
    },
  );

  onIpc<IpcCreateProfilePayload>(
    MESSAGE.CREATE_PROFILE,
    MESSAGE.CREATE_PROFILE_RES,
    async (event, payload) => {
      const { numberOfProfile, walletGroupId, listResourceGroupId, groupId } =
        payload;

      let listWallet: IWallet[] = [];
      if (walletGroupId) {
        const [res] = await walletDB.getListWallet({
          page: 1,
          pageSize: numberOfProfile,
          groupId: walletGroupId,
        });

        listWallet =
          res?.data?.map((data: IWallet) => ({
            ...data,
            type: TYPE_NAME.WALLET,
          })) || [];
      }

      let [allProfile] = await profileDB.getAllProfileOfGroup(groupId);
      allProfile = allProfile || [];
      const listProfileNumber: number[] = [];
      allProfile?.forEach((profile) => {
        if (profile?.name?.includes("Profile")) {
          const indexStr = profile?.name?.replace("Profile ", "");
          if (isNaN(Number(indexStr))) {
            return;
          }

          listProfileNumber.push(Number(indexStr));
        }
      });
      const maxProfileNumber = _.max(listProfileNumber) || 0; // get current max profile number

      const listResource: IResource[][] = [];
      for (let i = 0; i < listResourceGroupId.length; i++) {
        const [res] = await resourceDB.getListResource({
          page: 1,
          pageSize: numberOfProfile,
          groupId: listResourceGroupId[i],
        });

        const listResourceInGroup = res?.data?.map((data: IResource) => ({
          ...data,
          type: TYPE_NAME.RESOURCE,
        }));

        listResource.push(listResourceInGroup || []);
      }

      const listData = generateMix([listWallet, ...listResource]);
      const listProfile: any[] = listData?.map((data: any, index: number) => {
        const walletId = _.find(data, { type: TYPE_NAME.WALLET })?.id;
        const walletGroupId = _.find(data, { type: TYPE_NAME.WALLET })?.groupId;
        const listResourceId: number[] = listResourceGroupId?.map(
          (resourceGroupId: number) =>
            _.find(data, { type: TYPE_NAME.RESOURCE, groupId: resourceGroupId })
              ?.id,
        );

        return {
          name: `Profile ${index + 1 + maxProfileNumber}`,
          groupId,
          listResourceId,
          walletId: walletId || null,
          walletGroupId: walletGroupId || null,
        };
      });

      // Profile need to be unique in each ProfileGroup
      const listUniqueProfile: IProfile[] = [];
      const listProfileToCompare = [...allProfile, listUniqueProfile];
      for (const profile of listProfile) {
        const existedProfiles = listProfileToCompare.filter(
          (profileToCompare: any) => {
            let isResourceEqual = true;
            if (profileToCompare?.listResourceId) {
              for (const resourceId of profileToCompare?.listResourceId) {
                if (!profile?.listResourceId?.includes(resourceId)) {
                  isResourceEqual = false;
                  break;
                }
              }
            }

            return (
              profileToCompare?.walletId === profile?.walletId &&
              profileToCompare?.walletGroupId === profile?.walletGroupId &&
              isResourceEqual
            );
          },
        );
        const isExist = existedProfiles?.length > 0;
        if (!isExist) {
          listUniqueProfile.push(profile);
          listProfileToCompare.push(profile);
        }
      }

      await profileDB.createBulkProfile(listUniqueProfile);
      event.reply(MESSAGE.CREATE_PROFILE_RES, {
        data: { isDone: true },
      });
    },
  );

  onIpc<IpcUpdateProfilePayload>(
    MESSAGE.UPDATE_PROFILE,
    MESSAGE.UPDATE_PROFILE_RES,
    async (event, payload) => {
      const [res, err] = await profileDB.updateProfile(payload?.data);
      if (err) {
        event.reply(MESSAGE.UPDATE_PROFILE_RES, { error: err?.message });
        return;
      }
      event.reply(MESSAGE.UPDATE_PROFILE_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_PROFILE,
    MESSAGE.DELETE_PROFILE_RES,
    async (event, payload) => {
      const [res, err] = await profileDB.deleteProfile(payload?.data);
      if (err) {
        event.reply(MESSAGE.DELETE_PROFILE_RES, { error: err?.message });
        return;
      }
      event.reply(MESSAGE.DELETE_PROFILE_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcExportProfilePayload>(
    MESSAGE.EXPORT_PROFILE,
    MESSAGE.EXPORT_PROFILE_RES,
    async (event, payload) => {
      const { groupId, folderPath, fileName, encryptKey } = payload;
      const err = await exportProfile({
        groupId,
        folderPath,
        fileName,
        encryptKey,
      });

      event.reply(MESSAGE.EXPORT_PROFILE_RES, {
        error: err?.message,
      });
    },
  );
};
