import { proxyDB } from "@/electron/database/proxy";
import {
  MESSAGE,
  PROXY_SERVICE_TYPE,
  RESPONSE_CODE,
} from "@/electron/constant";
import { getProxyProvider } from "@/electron/inject";
import { IProxy } from "@/electron/type";
import { onIpc } from "./helpers";
import type {
  IpcGetListProxyPayload,
  IpcCreateProxyPayload,
  IpcUpdateProxyPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";

export const proxyController = () => {
  onIpc<IpcGetListProxyPayload>(
    MESSAGE.GET_LIST_PROXY,
    MESSAGE.GET_LIST_PROXY_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, type } = payload;
      const [res] = await proxyDB.getListProxy({
        page,
        pageSize,
        searchText,
        type,
      });
      if (!res) {
        event.reply(MESSAGE.GET_LIST_PROXY_RES, {
          data: null,
        });
        return;
      }

      const listProxy = [];
      for (let i = 0; i < res?.data.length; i++) {
        const proxy = res?.data[i] as IProxy;
        let isAlive = false;
        if (
          proxy?.type === PROXY_SERVICE_TYPE.DECODO ||
          proxy?.type === PROXY_SERVICE_TYPE.BRIGHTDATA
        ) {
          const provider = getProxyProvider(proxy.type);
          isAlive = await provider.isApiKeyAlive(proxy.apiKey!);
        }
        listProxy.push({
          ...proxy,
          isAlive,
        });
      }

      event.reply(MESSAGE.GET_LIST_PROXY_RES, {
        data: { ...res, data: listProxy },
      });
    },
  );

  onIpc<IpcCreateProxyPayload>(
    MESSAGE.CREATE_PROXY,
    MESSAGE.CREATE_PROXY_RES,
    async (event, payload) => {
      const [res, err] = await proxyDB.createProxy(payload?.data);
      if (err) {
        event.reply(MESSAGE.CREATE_PROXY_RES, {
          code: RESPONSE_CODE.DUPLICATE_ERROR,
        });
        return;
      }

      event.reply(MESSAGE.CREATE_PROXY_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcUpdateProxyPayload>(
    MESSAGE.UPDATE_PROXY,
    MESSAGE.UPDATE_PROXY_RES,
    async (event, payload) => {
      const [res, err] = await proxyDB.updateProxy(payload?.data);
      if (err) {
        event.reply(MESSAGE.UPDATE_PROXY_RES, {
          code: RESPONSE_CODE.DUPLICATE_ERROR,
        });
        return;
      }

      event.reply(MESSAGE.UPDATE_PROXY_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_PROXY,
    MESSAGE.DELETE_PROXY_RES,
    async (event, payload) => {
      const [res] = await proxyDB.deleteProxy(payload?.data);
      event.reply(MESSAGE.DELETE_PROXY_RES, {
        data: res,
      });
    },
  );
};
