import { resourceGroupDB } from "@/electron/database/resourceGroup";
import { resourceDB } from "@/electron/database/resource";
import { MESSAGE } from "@/electron/constant";
import {
  exportResourceGroupConfig,
  importResourceGroupConfig,
} from "@/electron/service/resourceGroup";
import { onIpc } from "./helpers";
import type {
  IpcGetListResourceGroupPayload,
  IpcIdPayload,
  IpcCreateResourceGroupPayload,
  IpcUpdateResourceGroupPayload,
  IpcDeletePayload,
  IpcExportResourceGroupPayload,
  IpcImportResourceGroupPayload,
} from "@/electron/ipcTypes";

export const runResourceGroupController = () => {
  onIpc<IpcGetListResourceGroupPayload>(
    MESSAGE.GET_LIST_RESOURCE_GROUP,
    MESSAGE.GET_LIST_RESOURCE_GROUP_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortField } = payload;
      const [res] = await resourceGroupDB.getListResourceGroup(
        page,
        pageSize,
        searchText,
        sortField,
      );
      event.reply(MESSAGE.GET_LIST_RESOURCE_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcIdPayload>(
    MESSAGE.GET_ONE_RESOURCE_GROUP,
    MESSAGE.GET_ONE_RESOURCE_GROUP_RES,
    async (event, payload) => {
      const { id } = payload;
      const [res] = await resourceGroupDB.getOneResourceGroup(id);

      event.reply(MESSAGE.GET_ONE_RESOURCE_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateResourceGroupPayload>(
    MESSAGE.CREATE_RESOURCE_GROUP,
    MESSAGE.CREATE_RESOURCE_GROUP_RES,
    async (event, payload) => {
      const [res, err] = await resourceGroupDB.createResourceGroup(
        payload?.data,
      );
      if (err) {
        event.reply(MESSAGE.CREATE_RESOURCE_GROUP_RES, { error: err?.message });
        return;
      }
      event.reply(MESSAGE.CREATE_RESOURCE_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcUpdateResourceGroupPayload>(
    MESSAGE.UPDATE_RESOURCE_GROUP,
    MESSAGE.UPDATE_RESOURCE_GROUP_RES,
    async (event, payload) => {
      const [res, err] = await resourceGroupDB.updateResourceGroup(
        payload?.data,
      );
      if (err) {
        event.reply(MESSAGE.UPDATE_RESOURCE_GROUP_RES, { error: err?.message });
        return;
      }
      event.reply(MESSAGE.UPDATE_RESOURCE_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_RESOURCE_GROUP,
    MESSAGE.DELETE_RESOURCE_GROUP_RES,
    async (event, payload) => {
      const listGroupId: number[] = payload?.data;

      let [res, err] = await resourceDB.deleteResourceInGroup(listGroupId);
      if (err) {
        event.reply(MESSAGE.DELETE_RESOURCE_GROUP_RES, {
          error: err?.message,
        });
        return;
      }

      [res, err] = await resourceGroupDB.deleteResourceGroup(listGroupId);
      if (err) {
        event.reply(MESSAGE.DELETE_RESOURCE_GROUP_RES, {
          error: err?.message,
        });
        return;
      }

      event.reply(MESSAGE.DELETE_RESOURCE_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcExportResourceGroupPayload>(
    MESSAGE.EXPORT_RESOURCE_GROUP,
    MESSAGE.EXPORT_RESOURCE_GROUP_RES,
    async (event, payload) => {
      const { resourceGroupId, folderPath, fileName } = payload;

      const err = await exportResourceGroupConfig(
        resourceGroupId,
        folderPath,
        fileName,
      );
      event.reply(MESSAGE.EXPORT_RESOURCE_GROUP_RES, {
        error: err?.message,
      });
    },
  );

  onIpc<IpcImportResourceGroupPayload>(
    MESSAGE.IMPORT_RESOURCE_GROUP,
    MESSAGE.IMPORT_RESOURCE_GROUP_RES,
    async (event, payload) => {
      const { resourceGroupId, filePath } = payload;

      const err = await importResourceGroupConfig(resourceGroupId, filePath);
      event.reply(MESSAGE.IMPORT_RESOURCE_GROUP_RES, {
        error: err?.message,
      });
    },
  );
};
