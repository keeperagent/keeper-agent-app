import { proxyIpDB } from "@/electron/database/proxyIp";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import { onIpc } from "./helpers";
import type {
  IpcGetListProxyIpPayload,
  IpcCreateProxyIpPayload,
  IpcUpdateProxyIpPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";

export const proxyIpController = () => {
  onIpc<IpcGetListProxyIpPayload>(
    MESSAGE.GET_LIST_PROXY_IP,
    MESSAGE.GET_LIST_PROXY_IP_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, groupId } = payload;
      const [res] = await proxyIpDB.getListProxyIp(
        page,
        pageSize,
        searchText,
        groupId,
      );
      event.reply(MESSAGE.GET_LIST_PROXY_IP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateProxyIpPayload>(
    MESSAGE.CREATE_PROXY_IP,
    MESSAGE.CREATE_PROXY_IP_RES,
    async (event, payload) => {
      const err = await proxyIpDB.createBulkProxyIp(payload?.data);

      event.reply(MESSAGE.CREATE_PROXY_IP_RES, {
        error: err,
      });
    },
  );

  onIpc<IpcUpdateProxyIpPayload>(
    MESSAGE.UPDATE_PROXY_IP,
    MESSAGE.UPDATE_PROXY_IP_RES,
    async (event, payload) => {
      const [res, err] = await proxyIpDB.updateProxyIp(payload?.data);
      if (err) {
        event.reply(MESSAGE.UPDATE_PROXY_IP_RES, {
          code: RESPONSE_CODE.DUPLICATE_ERROR,
        });
        return;
      }

      event.reply(MESSAGE.UPDATE_PROXY_IP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_PROXY_IP,
    MESSAGE.DELETE_PROXY_IP_RES,
    async (event, payload) => {
      const [res] = await proxyIpDB.deleteProxyIp(payload?.data);
      event.reply(MESSAGE.DELETE_PROXY_IP_RES, {
        data: res,
      });
    },
  );
};
