import { MESSAGE } from "@/electron/constant";
import { settingDB } from "@/electron/database/setting";
import type {
  IpcGetListSettingPayload,
  IpcCreateSettingPayload,
  IpcUpdateSettingPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const settingController = () => {
  onIpc<IpcGetListSettingPayload>(
    MESSAGE.GET_LIST_AGENT_SETTING,
    MESSAGE.GET_LIST_AGENT_SETTING_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortField, type, scopeId } =
        payload || {};
      const [res] = await settingDB.getListSetting(
        page,
        pageSize,
        searchText,
        sortField,
        type,
        scopeId,
      );
      event.reply(MESSAGE.GET_LIST_AGENT_SETTING_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateSettingPayload>(
    MESSAGE.CREATE_AGENT_SETTING,
    MESSAGE.CREATE_AGENT_SETTING_RES,
    async (event, payload) => {
      const { data } = payload;
      const [res, err] = await settingDB.createSetting(data);
      event.reply(MESSAGE.CREATE_AGENT_SETTING_RES, {
        data: res,
        error: err?.message,
      });
    },
  );

  onIpc<IpcUpdateSettingPayload>(
    MESSAGE.UPDATE_AGENT_SETTING,
    MESSAGE.UPDATE_AGENT_SETTING_RES,
    async (event, payload) => {
      const { data } = payload;
      const [res, err] = await settingDB.updateSetting(data);
      event.reply(MESSAGE.UPDATE_AGENT_SETTING_RES, {
        data: res,
        error: err?.message,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_AGENT_SETTING,
    MESSAGE.DELETE_AGENT_SETTING_RES,
    async (event, payload) => {
      const [res, err] = await settingDB.deleteSetting(payload?.data || []);
      if (err) {
        event.reply(MESSAGE.DELETE_AGENT_SETTING_RES, { error: err?.message });
        return;
      }
      event.reply(MESSAGE.DELETE_AGENT_SETTING_RES, {
        data: res,
      });
    },
  );
};
