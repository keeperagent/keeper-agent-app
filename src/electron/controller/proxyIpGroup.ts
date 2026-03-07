import { proxyIpGroupDB } from "@/electron/database/proxyIpGroup";
import { proxyIpDB } from "@/electron/database/proxyIp";
import { MESSAGE } from "@/electron/constant";
import { onIpc } from "./helpers";
import type {
  IpcGetListProxyIpGroupPayload,
  IpcIdPayload,
  IpcCreateProxyIpGroupPayload,
  IpcUpdateProxyIpGroupPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";

export const proxyIpGroupController = () => {
  onIpc<IpcGetListProxyIpGroupPayload>(
    MESSAGE.GET_LIST_PROXY_IP_GROUP,
    MESSAGE.GET_LIST_PROXY_IP_GROUP_RES,
    async (event, payload) => {
      const { page, pageSize, searchText } = payload;
      const [res, err] = await proxyIpGroupDB.getListProxyIpGroup(
        page,
        pageSize,
        searchText,
      );
      event.reply(MESSAGE.GET_LIST_PROXY_IP_GROUP_RES, {
        data: res,
        error: err?.message,
      });
    },
  );

  onIpc<IpcIdPayload>(
    MESSAGE.GET_ONE_PROXY_IP_GROUP,
    MESSAGE.GET_ONE_PROXY_IP_GROUP_RES,
    async (event, payload) => {
      const { id } = payload;
      const [res] = await proxyIpGroupDB.getOneProxyIpGroup(id);

      event.reply(MESSAGE.GET_ONE_PROXY_IP_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateProxyIpGroupPayload>(
    MESSAGE.CREATE_PROXY_IP_GROUP,
    MESSAGE.CREATE_PROXY_IP_GROUP_RES,
    async (event, payload) => {
      const [res] = await proxyIpGroupDB.createProxyIpGroup(payload?.data);

      event.reply(MESSAGE.CREATE_PROXY_IP_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcUpdateProxyIpGroupPayload>(
    MESSAGE.UPDATE_PROXY_IP_GROUP,
    MESSAGE.UPDATE_PROXY_IP_GROUP_RES,
    async (event, payload) => {
      const [res] = await proxyIpGroupDB.updateProxyIpGroup(payload?.data);

      event.reply(MESSAGE.UPDATE_PROXY_IP_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_PROXY_IP_GROUP,
    MESSAGE.DELETE_PROXY_IP_GROUP_RES,
    async (event, payload) => {
      const listGroupId: number[] = payload?.data;

      let [res, err] = await proxyIpDB.deleteProxyIpInGroup(listGroupId);
      if (err) {
        event.reply(MESSAGE.DELETE_RESOURCE_GROUP_RES, {
          error: err?.message,
        });
        return;
      }

      [res, err] = await proxyIpGroupDB.deleteProxyIpGroup(listGroupId);
      event.reply(MESSAGE.DELETE_PROXY_IP_GROUP_RES, {
        data: res,
      });
    },
  );
};
