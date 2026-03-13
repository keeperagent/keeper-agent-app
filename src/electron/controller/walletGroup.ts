import { walletGroupDB } from "@/electron/database/walletGroup";
import _ from "lodash";
import { walletDB } from "@/electron/database/wallet";
import { MESSAGE, PROFILE_TYPE } from "@/electron/constant";
import { onIpc } from "./helpers";
import type {
  IpcGetListWalletGroupPayload,
  IpcIdPayload,
  IpcCreateWalletGroupPayload,
  IpcUpdateWalletGroupPayload,
  IpcDeletePayload,
  IpcGetWalletGroupDependencyPayload,
} from "@/electron/ipcTypes";
import { profileGroupDB } from "../database/profileGroup";
import { campaignDB } from "../database/campaign";
import { IProfileGroup, IWalletGroup } from "../type";

export const runWalletGroupController = () => {
  onIpc<IpcGetListWalletGroupPayload>(
    MESSAGE.GET_LIST_WALLET_GROUP,
    MESSAGE.GET_LIST_WALLET_GROUP_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortField } = payload;
      let [res] = await walletGroupDB.getListWalletGroup(
        page,
        pageSize,
        searchText,
        sortField,
      );

      const listWalletGroup = res?.data || [];
      const listWalletGroupId =
        listWalletGroup?.map((walletGroup: IWalletGroup) => walletGroup?.id!) ||
        [];
      const [mapProfileGroupDependency] =
        await walletGroupDB.getWalletGroupDependency(listWalletGroupId);
      listWalletGroup?.forEach((walletGroup: IWalletGroup) => {
        let listProfileGroupUseWalletGroup: IProfileGroup[] = [];

        const listProfileGroup =
          mapProfileGroupDependency[walletGroup?.id!]?.listProfileGroup || [];
        listProfileGroup?.forEach((profileGroup: IProfileGroup) => {
          if (profileGroup?.walletGroupId === walletGroup?.id) {
            listProfileGroupUseWalletGroup.push(profileGroup);
          }
        });
        listProfileGroupUseWalletGroup = _.sortBy(
          listProfileGroupUseWalletGroup,
          "createAt",
        );

        walletGroup.listProfileGroup = listProfileGroupUseWalletGroup;
      });

      res = {
        data: listWalletGroup,
        totalData: res?.totalData || 0,
        totalPage: res?.totalPage || 0,
        page: res?.page || 0,
        pageSize: res?.pageSize || 0,
      };

      event.reply(MESSAGE.GET_LIST_WALLET_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcIdPayload>(
    MESSAGE.GET_ONE_WALLET_GROUP,
    MESSAGE.GET_ONE_WALLET_GROUP_RES,
    async (event, payload) => {
      const { id } = payload;
      const [res] = await walletGroupDB.getOneWalletGroup(id);

      event.reply(MESSAGE.GET_ONE_WALLET_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateWalletGroupPayload>(
    MESSAGE.CREATE_WALLET_GROUP,
    MESSAGE.CREATE_WALLET_GROUP_RES,
    async (event, payload) => {
      const [res] = await walletGroupDB.createWalletGroup(payload?.data);
      if (payload?.isQuickMapCampaign) {
        const [profileGroup] = await profileGroupDB.createProfileGroup({
          walletGroupId: res?.id,
          name: res?.name || "",
        });
        await campaignDB.createCampaign({
          profileGroupId: profileGroup?.id,
          name: res?.name || "",
          isFullScreen: true,
          proxyType: PROFILE_TYPE.ALL_PROFILE,
          numberOfThread: 1,
          numberOfRound: 1,
          reloadDuration: 3,
          defaultOpenUrl: "https://iphey.com",
        });
      }

      event.reply(MESSAGE.CREATE_WALLET_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcUpdateWalletGroupPayload>(
    MESSAGE.UPDATE_WALLET_GROUP,
    MESSAGE.UPDATE_WALLET_GROUP_RES,
    async (event, payload) => {
      const [res] = await walletGroupDB.updateWalletGroup(payload?.data);

      event.reply(MESSAGE.UPDATE_WALLET_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_WALLET_GROUP,
    MESSAGE.DELETE_WALLET_GROUP_RES,
    async (event, payload) => {
      const listGroupId: number[] = payload?.data;
      let [res, err] = await walletDB.deleteWalletInGroup(listGroupId);
      if (err) {
        event.reply(MESSAGE.DELETE_WALLET_GROUP_RES, {
          error: err?.message,
        });
        return;
      }

      [res, err] = await walletGroupDB.deleteWalletGroup(listGroupId);
      if (err) {
        event.reply(MESSAGE.DELETE_WALLET_GROUP_RES, {
          error: err?.message,
        });
        return;
      }

      event.reply(MESSAGE.DELETE_WALLET_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcGetWalletGroupDependencyPayload>(
    MESSAGE.GET_WALLET_GROUP_DEPENDENCY,
    MESSAGE.GET_WALLET_GROUP_DEPENDENCY_RES,
    async (event, payload) => {
      const listWalletGroupId: number[] = payload?.listWalletGroupId;
      const [res, err] =
        await walletGroupDB.getWalletGroupDependency(listWalletGroupId);
      if (err) {
        event.reply(MESSAGE.GET_WALLET_GROUP_DEPENDENCY_RES, {
          error: err?.message,
        });
        return;
      }

      event.reply(MESSAGE.GET_WALLET_GROUP_DEPENDENCY_RES, {
        data: res,
      });
    },
  );
};
