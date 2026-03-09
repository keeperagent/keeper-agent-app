import { MESSAGE } from "@/electron/constant";
import { agentSettingDB } from "@/electron/database/agentSetting";
import type {
  IpcGetListAgentSettingPayload,
  IpcCreateAgentSettingPayload,
  IpcUpdateAgentSettingPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const agentSettingController = () => {
  onIpc<IpcGetListAgentSettingPayload>(
    MESSAGE.GET_LIST_AGENT_SETTING,
    MESSAGE.GET_LIST_AGENT_SETTING_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortField, type } = payload || {};
      const [res] = await agentSettingDB.getListAgentSetting(
        page,
        pageSize,
        searchText,
        sortField,
        type,
      );
      event.reply(MESSAGE.GET_LIST_AGENT_SETTING_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateAgentSettingPayload>(
    MESSAGE.CREATE_AGENT_SETTING,
    MESSAGE.CREATE_AGENT_SETTING_RES,
    async (event, payload) => {
      const { data } = payload;
      const [res] = await agentSettingDB.createAgentSetting(data);
      event.reply(MESSAGE.CREATE_AGENT_SETTING_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcUpdateAgentSettingPayload>(
    MESSAGE.UPDATE_AGENT_SETTING,
    MESSAGE.UPDATE_AGENT_SETTING_RES,
    async (event, payload) => {
      const { data } = payload;
      const [res] = await agentSettingDB.updateAgentSetting(data);
      event.reply(MESSAGE.UPDATE_AGENT_SETTING_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_AGENT_SETTING,
    MESSAGE.DELETE_AGENT_SETTING_RES,
    async (event, payload) => {
      const [res] = await agentSettingDB.deleteAgentSetting(
        payload?.data || [],
      );
      event.reply(MESSAGE.DELETE_AGENT_SETTING_RES, {
        data: res,
      });
    },
  );
};
