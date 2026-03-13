import _ from "lodash";
import { profileGroupDB } from "@/electron/database/profileGroup";
import { profileDB } from "@/electron/database/profile";
import { MESSAGE } from "@/electron/constant";
import { onIpc } from "./helpers";
import type {
  IpcCreateProfileGroupPayload,
  IpcDeletePayload,
  IpcGetListProfileGroupPayload,
  IpcIdPayload,
  IpcUpdateProfileGroupPayload,
} from "@/electron/ipcTypes";
import { ICampaign, IProfileGroup } from "../type";
import { campaignDB } from "../database/campaign";

export const profileGroupController = () => {
  onIpc<IpcGetListProfileGroupPayload>(
    MESSAGE.GET_LIST_PROFILE_GROUP,
    MESSAGE.GET_LIST_PROFILE_GROUP_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortField } = payload;
      let [res] = await profileGroupDB.getListProfileGroup(
        page,
        pageSize,
        searchText,
        sortField,
      );

      const listProfileGroup = res?.data || [];
      const listProfileGroupId =
        listProfileGroup?.map(
          (profileGroup: IProfileGroup) => profileGroup?.id!,
        ) || [];
      const [listCampaign] =
        await campaignDB.getListCampaignByProfileGroupId(listProfileGroupId);
      listProfileGroup?.forEach((profileGroup: IProfileGroup) => {
        let listCampaignUseProfileGroup: ICampaign[] = [];

        listCampaign?.forEach((campaign: ICampaign) => {
          if (campaign?.profileGroupId === profileGroup?.id) {
            listCampaignUseProfileGroup.push(campaign);
          }
        });
        listCampaignUseProfileGroup = _.sortBy(
          listCampaignUseProfileGroup,
          "createAt",
        );

        profileGroup.listCampaign = listCampaignUseProfileGroup;
      });

      res = {
        data: listProfileGroup,
        totalData: res?.totalData || 0,
        totalPage: res?.totalPage || 0,
        page: res?.page || 0,
        pageSize: res?.pageSize || 0,
      };

      event.reply(MESSAGE.GET_LIST_PROFILE_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcIdPayload>(
    MESSAGE.GET_ONE_PROFILE_GROUP,
    MESSAGE.GET_ONE_PROFILE_GROUP_RES,
    async (event, payload) => {
      const { id } = payload;
      const [res] = await profileGroupDB.getOneProfileGroup(id);

      event.reply(MESSAGE.GET_ONE_PROFILE_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateProfileGroupPayload>(
    MESSAGE.CREATE_PROFILE_GROUP,
    MESSAGE.CREATE_PROFILE_GROUP_RES,
    async (event, payload) => {
      const [res] = await profileGroupDB.createProfileGroup(payload?.data);

      event.reply(MESSAGE.CREATE_PROFILE_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcUpdateProfileGroupPayload>(
    MESSAGE.UPDATE_PROFILE_GROUP,
    MESSAGE.UPDATE_PROFILE_GROUP_RES,
    async (event, payload) => {
      const [res] = await profileGroupDB.updateProfileGroup(payload?.data);

      event.reply(MESSAGE.UPDATE_PROFILE_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_PROFILE_GROUP,
    MESSAGE.DELETE_PROFILE_GROUP_RES,
    async (event, payload) => {
      const listGroupId: number[] = payload?.data;

      let [res, err] = await profileDB.deleteProfileInGroup(listGroupId);
      if (err) {
        event.reply(MESSAGE.DELETE_PROFILE_GROUP_RES, {
          error: err?.message,
        });
        return;
      }

      [res, err] = await profileGroupDB.deleteProfileGroup(listGroupId);
      if (err) {
        event.reply(MESSAGE.DELETE_PROFILE_GROUP_RES, {
          error: err?.message,
        });
        return;
      }

      event.reply(MESSAGE.DELETE_PROFILE_GROUP_RES, {
        data: res,
      });
    },
  );
};
