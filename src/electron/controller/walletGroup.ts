import { walletGroupDB } from "@/electron/database/walletGroup";
import { walletDB } from "@/electron/database/wallet";
import { MESSAGE } from "@/electron/constant";
import { onIpc } from "./helpers";
import type {
  IpcGetListWalletGroupPayload,
  IpcIdPayload,
  IpcCreateWalletGroupPayload,
  IpcUpdateWalletGroupPayload,
  IpcDeletePayload,
  IpcGetWalletGroupDependencyPayload,
} from "@/electron/ipcTypes";

export const runWalletGroupController = () => {
  onIpc<IpcGetListWalletGroupPayload>(
    MESSAGE.GET_LIST_WALLET_GROUP,
    MESSAGE.GET_LIST_WALLET_GROUP_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortField } = payload;
      const [res] = await walletGroupDB.getListWalletGroup(
        page,
        pageSize,
        searchText,
        sortField,
      );
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
