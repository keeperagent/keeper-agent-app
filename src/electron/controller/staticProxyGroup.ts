import { staticProxyGroupDB } from "@/electron/database/staticProxyGroup";
import { staticProxyDB } from "@/electron/database/staticProxy";
import { MESSAGE } from "@/electron/constant";
import { onIpc } from "./helpers";
import type {
  IpcGetListStaticProxyGroupPayload,
  IpcIdPayload,
  IpcCreateStaticProxyGroupPayload,
  IpcUpdateStaticProxyGroupPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";

export const staticProxyGroupController = () => {
  onIpc<IpcGetListStaticProxyGroupPayload>(
    MESSAGE.GET_LIST_PROXY_GROUP,
    MESSAGE.GET_LIST_PROXY_GROUP_RES,
    async (event, payload) => {
      const { page, pageSize, searchText } = payload;
      const [res, err] = await staticProxyGroupDB.getListStaticProxyGroup(
        page,
        pageSize,
        searchText,
      );
      event.reply(MESSAGE.GET_LIST_PROXY_GROUP_RES, {
        data: res,
        error: err?.message,
      });
    },
  );

  onIpc<IpcIdPayload>(
    MESSAGE.GET_ONE_PROXY_GROUP,
    MESSAGE.GET_ONE_PROXY_GROUP_RES,
    async (event, payload) => {
      const { id } = payload;
      const [res] = await staticProxyGroupDB.getOneStaticProxyGroup(id);

      event.reply(MESSAGE.GET_ONE_PROXY_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateStaticProxyGroupPayload>(
    MESSAGE.CREATE_PROXY_GROUP,
    MESSAGE.CREATE_PROXY_GROUP_RES,
    async (event, payload) => {
      const [res] = await staticProxyGroupDB.createStaticProxyGroup(
        payload?.data,
      );

      event.reply(MESSAGE.CREATE_PROXY_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcUpdateStaticProxyGroupPayload>(
    MESSAGE.UPDATE_PROXY_GROUP,
    MESSAGE.UPDATE_PROXY_GROUP_RES,
    async (event, payload) => {
      const [res] = await staticProxyGroupDB.updateStaticProxyGroup(
        payload?.data,
      );

      event.reply(MESSAGE.UPDATE_PROXY_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_PROXY_GROUP,
    MESSAGE.DELETE_PROXY_GROUP_RES,
    async (event, payload) => {
      const listGroupId: number[] = payload?.data;

      let [res, err] =
        await staticProxyDB.deleteStaticProxyInGroup(listGroupId);
      if (err) {
        event.reply(MESSAGE.DELETE_RESOURCE_GROUP_RES, {
          error: err?.message,
        });
        return;
      }

      [res, err] = await staticProxyGroupDB.deleteStaticProxyGroup(listGroupId);
      event.reply(MESSAGE.DELETE_PROXY_GROUP_RES, {
        data: res,
      });
    },
  );
};
