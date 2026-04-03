import { staticProxyDB } from "@/electron/database/staticProxy";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import { onIpc } from "./helpers";
import type {
  IpcGetListStaticProxyPayload,
  IpcCreateStaticProxyPayload,
  IpcUpdateStaticProxyPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";

export const staticProxyController = () => {
  onIpc<IpcGetListStaticProxyPayload>(
    MESSAGE.GET_LIST_PROXY,
    MESSAGE.GET_LIST_PROXY_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, groupId } = payload;
      const [res] = await staticProxyDB.getListStaticProxy(
        page,
        pageSize,
        searchText,
        groupId,
      );
      event.reply(MESSAGE.GET_LIST_PROXY_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateStaticProxyPayload>(
    MESSAGE.CREATE_PROXY,
    MESSAGE.CREATE_PROXY_RES,
    async (event, payload) => {
      const err = await staticProxyDB.createBulkStaticProxy(payload?.data);

      event.reply(MESSAGE.CREATE_PROXY_RES, {
        error: err,
      });
    },
  );

  onIpc<IpcUpdateStaticProxyPayload>(
    MESSAGE.UPDATE_PROXY,
    MESSAGE.UPDATE_PROXY_RES,
    async (event, payload) => {
      const [res, err] = await staticProxyDB.updateStaticProxy(payload?.data);
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
      const [res] = await staticProxyDB.deleteStaticProxy(payload?.data);
      event.reply(MESSAGE.DELETE_PROXY_RES, {
        data: res,
      });
    },
  );
};
