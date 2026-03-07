import { resourceDB } from "@/electron/database/resource";
import { resourceGroupDB } from "@/electron/database/resourceGroup";
import {
  importResourceFromFile,
  encryptResource,
  decryptResource,
  exportResource,
} from "@/electron/service/resource";
import { MESSAGE } from "@/electron/constant";
import { IResource, IResourceGroup } from "@/electron/type";
import { onIpc } from "./helpers";
import type {
  IpcImportResourcePayload,
  IpcExportResourcePayload,
  IpcGetListResourcePayload,
  IpcCreateResourcePayload,
  IpcUpdateResourcePayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";

export const resourceController = () => {
  onIpc<IpcImportResourcePayload>(
    MESSAGE.IMPORT_RESOURCE,
    MESSAGE.IMPORT_RESOURCE_RES,
    async (event, payload) => {
      const { listFilePath = [], groupId, encryptKey } = payload;
      const [resourceGroup, err] =
        await resourceGroupDB.getOneResourceGroup(groupId);
      if (err || !resourceGroup) {
        event.reply(MESSAGE.IMPORT_RESOURCE_RES, {
          error: err?.message,
        });
        return;
      }

      const res = await importResourceFromFile(
        listFilePath,
        groupId,
        resourceGroup,
        encryptKey,
      );
      event.reply(MESSAGE.IMPORT_RESOURCE_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcExportResourcePayload>(
    MESSAGE.EXPORT_RESOURCE,
    MESSAGE.EXPORT_RESOURCE_RES,
    async (event, payload) => {
      const { groupId, folderPath, fileName, encryptKey } = payload;
      const err = await exportResource({
        groupId,
        folderPath,
        fileName,
        encryptKey,
      });

      event.reply(MESSAGE.EXPORT_RESOURCE_RES, {
        error: err?.message,
      });
    },
  );

  onIpc<IpcGetListResourcePayload>(
    MESSAGE.GET_LIST_RESOURCE,
    MESSAGE.GET_LIST_RESOURCE_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, groupId, encryptKey } = payload;
      const [res] = await resourceDB.getListResource({
        page,
        pageSize,
        searchText,
        groupId,
      });

      let listData = res?.data;
      if (encryptKey) {
        listData = listData?.map((resource: IResource) =>
          decryptResource(resource, encryptKey),
        );
      }

      event.reply(MESSAGE.GET_LIST_RESOURCE_RES, {
        data: { ...res, data: listData },
      });
    },
  );

  onIpc<IpcCreateResourcePayload>(
    MESSAGE.CREATE_RESOURCE,
    MESSAGE.CREATE_RESOURCE_RES,
    async (event, payload) => {
      const { encryptKey, data } = payload;
      let encryptedData: IResource = data;
      const groupId = encryptedData.groupId!;
      const [resourceGroup, err] =
        await resourceGroupDB.getOneResourceGroup(groupId);

      if (err || !resourceGroup) {
        event.reply(MESSAGE.IMPORT_RESOURCE_RES, {
          error: err?.message,
        });
        return;
      }

      if (encryptKey) {
        encryptedData = encryptResource(
          encryptedData,
          resourceGroup,
          encryptKey,
        );
      }

      const [res] = await resourceDB.createResource(encryptedData);
      event.reply(MESSAGE.CREATE_RESOURCE_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcUpdateResourcePayload>(
    MESSAGE.UPDATE_RESOURCE,
    MESSAGE.UPDATE_RESOURCE_RES,
    async (event, payload) => {
      const { encryptKey, data } = payload;
      let encryptedData: IResource = data;
      // if update, then take config directly from Resource, don't get config from Resource Group
      const config: IResourceGroup = {
        col1IsEncrypt: encryptedData?.col1IsEncrypt,
        col2IsEncrypt: encryptedData?.col2IsEncrypt,
        col3IsEncrypt: encryptedData?.col3IsEncrypt,
        col4IsEncrypt: encryptedData?.col4IsEncrypt,
        col5IsEncrypt: encryptedData?.col5IsEncrypt,
        col6IsEncrypt: encryptedData?.col6IsEncrypt,
        col7IsEncrypt: encryptedData?.col7IsEncrypt,
        col8IsEncrypt: encryptedData?.col8IsEncrypt,
        col9IsEncrypt: encryptedData?.col9IsEncrypt,
        col10IsEncrypt: encryptedData?.col10IsEncrypt,
      };
      if (encryptKey) {
        encryptedData = encryptResource(encryptedData, config, encryptKey);
      }

      const [res] = await resourceDB.updateResource(encryptedData);
      event.reply(MESSAGE.UPDATE_RESOURCE_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_RESOURCE,
    MESSAGE.DELETE_RESOURCE_RES,
    async (event, payload) => {
      const [res] = await resourceDB.deleteResource(payload?.data);
      event.reply(MESSAGE.DELETE_RESOURCE_RES, {
        data: res,
      });
    },
  );
};
