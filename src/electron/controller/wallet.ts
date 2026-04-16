import { walletDB } from "@/electron/database/wallet";
import {
  importWalletFromFile,
  createRandomWallet,
  createWalletFromPhrase,
  encryptWallet,
  decryptWallet,
  exportWallet,
} from "@/electron/service/wallet";
import { MESSAGE } from "@/electron/constant";
import { IWallet } from "@/electron/type";
import { onIpc } from "./helpers";
import type {
  IpcGetListWalletPayload,
  IpcCreateWalletPayload,
  IpcUpdateWalletPayload,
  IpcDeletePayload,
  IpcImportWalletPayload,
  IpcExportWalletPayload,
  IpcGenerateRandomWalletPayload,
  IpcGenerateWalletFromPhrasePayload,
} from "@/electron/ipcTypes";

export const runWalletController = () => {
  onIpc<IpcImportWalletPayload>(
    MESSAGE.IMPORT_WALLET,
    MESSAGE.IMPORT_WALLET_RES,
    async (event, payload) => {
      const { listFilePath = [], groupId, encryptKey } = payload;
      const res = await importWalletFromFile(listFilePath, groupId, encryptKey);
      event.reply(MESSAGE.IMPORT_WALLET_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcExportWalletPayload>(
    MESSAGE.EXPORT_WALLET,
    MESSAGE.EXPORT_WALLET_RES,
    async (event, payload) => {
      const { groupId, folderPath, fileName, encryptKey, listWalletId } =
        payload;
      const err = await exportWallet({
        groupId,
        folderPath,
        fileName,
        listWalletId,
        encryptKey,
      });

      event.reply(MESSAGE.EXPORT_WALLET_RES, {
        error: err?.message,
      });
    },
  );

  onIpc<IpcGetListWalletPayload>(
    MESSAGE.GET_LIST_WALLET,
    MESSAGE.GET_LIST_WALLET_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, groupId, encryptKey, sortField } =
        payload;
      const [res] = await walletDB.getListWallet({
        page,
        pageSize,
        searchText,
        groupId,
        encryptKey,
        sortField,
      });

      let listData = res?.data;
      if (encryptKey) {
        listData = listData?.map((wallet: IWallet) =>
          decryptWallet(wallet, encryptKey),
        );
      }

      event.reply(MESSAGE.GET_LIST_WALLET_RES, {
        data: { ...res, data: listData },
      });
    },
  );

  onIpc<IpcUpdateWalletPayload>(
    MESSAGE.UPDATE_WALLET,
    MESSAGE.UPDATE_WALLET_RES,
    async (event, payload) => {
      const { data, encryptKey } = payload;
      let encryptedData: IWallet = data;
      if (encryptKey) {
        encryptedData = encryptWallet(encryptedData, encryptKey);
      }

      const [res, err] = await walletDB.updateWallet(encryptedData);
      if (err) {
        event.reply(MESSAGE.UPDATE_WALLET_RES, { error: err?.message });
        return;
      }
      let wallet: IWallet = res as IWallet;
      if (wallet && encryptKey) {
        wallet = decryptWallet(wallet, encryptKey);
      }
      event.reply(MESSAGE.UPDATE_WALLET_RES, {
        data: wallet,
      });
    },
  );

  onIpc<IpcCreateWalletPayload>(
    MESSAGE.CREATE_WALLET,
    MESSAGE.CREATE_WALLET_RES,
    async (event, payload) => {
      const { encryptKey, data } = payload;

      let encryptedData: IWallet = data;
      if (encryptKey) {
        encryptedData = encryptWallet(encryptedData, encryptKey);
      }

      const [res, err] = await walletDB.createWallet(encryptedData);
      if (err) {
        event.reply(MESSAGE.CREATE_WALLET_RES, { error: err?.message });
        return;
      }
      event.reply(MESSAGE.CREATE_WALLET_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_WALLET,
    MESSAGE.DELETE_WALLET_RES,
    async (event, payload) => {
      const [res, err] = await walletDB.deleteWallet(payload?.data);
      event.reply(MESSAGE.DELETE_WALLET_RES, {
        data: res,
        error: err,
      });
    },
  );

  onIpc<IpcGenerateRandomWalletPayload>(
    MESSAGE.GENERATE_RANDOM_WALLET,
    MESSAGE.GENERATE_RANDOM_WALLET_RES,
    async (event, payload) => {
      const { total, groupId, encryptKey, chainType } = payload;
      const size = 100;
      const totalChunk = Math.ceil(total / size);
      const lastChunkSize = total % size;
      let count = 0;

      for (let i = 0; i < totalChunk; i++) {
        let chunkSize = size;
        if (i === totalChunk - 1 && lastChunkSize > 0) {
          chunkSize = lastChunkSize;
        }

        const res = await createRandomWallet({
          batchSize: chunkSize,
          groupId,
          encryptKey,
          chainType,
        });
        count += chunkSize;
        event.reply(MESSAGE.GENERATE_RANDOM_WALLET_RES, {
          data: {
            count,
            left: total - count,
            isSuccess: res,
            isDone: false,
          },
        });
      }

      event.reply(MESSAGE.GENERATE_RANDOM_WALLET_RES, {
        data: { isDone: true },
      });
    },
  );

  onIpc<IpcGenerateWalletFromPhrasePayload>(
    MESSAGE.GENERATE_WALLET_FROM_PHRASE,
    MESSAGE.GENERATE_WALLET_FROM_PHRASE_RES,
    async (event, payload) => {
      const { total, groupId, phrase, encryptKey, chainType } = payload;
      const size = 100;
      const totalChunk = Math.ceil(total / size);
      const lastChunkSize = total % size;
      let count = 0;
      let err: Error | null = null;

      for (let i = 0; i < totalChunk; i++) {
        let chunkSize = size;
        if (i === totalChunk - 1 && lastChunkSize > 0) {
          chunkSize = lastChunkSize;
        }

        const [res, error] = await createWalletFromPhrase({
          batchSize: chunkSize,
          groupId,
          phrase,
          startIndex: i * chunkSize,
          encryptKey,
          chainType,
        });
        if (error) {
          err = error;
          break;
        }

        count += chunkSize;
        event.reply(MESSAGE.GENERATE_WALLET_FROM_PHRASE_RES, {
          data: {
            count,
            left: total - count,
            isSuccess: res,
            isDone: false,
            error: null,
          },
        });
      }

      event.reply(MESSAGE.GENERATE_WALLET_FROM_PHRASE_RES, {
        data: { isDone: true, error: err },
      });
    },
  );
};
