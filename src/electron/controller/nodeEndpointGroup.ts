import { nodeEndpointGroupDB } from "@/electron/database/nodeEndpointGroup";
import { MESSAGE } from "@/electron/constant";
import { onIpc } from "./helpers";
import type {
  IpcGetListNodeEndpointGroupPayload,
  IpcIdPayload,
  IpcCreateNodeEndpointGroupPayload,
  IpcUpdateNodeEndpointGroupPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";

export const nodeEndpointGroupController = () => {
  onIpc<IpcGetListNodeEndpointGroupPayload>(
    MESSAGE.GET_LIST_NODE_ENDPOINT_GROUP,
    MESSAGE.GET_LIST_NODE_ENDPOINT_GROUP_RES,
    async (event, payload) => {
      const { page, pageSize, searchText } = payload;
      const [res] = await nodeEndpointGroupDB.getListNodeEndpointGroup(
        page,
        pageSize,
        searchText,
      );
      event.reply(MESSAGE.GET_LIST_NODE_ENDPOINT_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcIdPayload>(
    MESSAGE.GET_ONE_NODE_ENDPOINT_GROUP,
    MESSAGE.GET_ONE_NODE_ENDPOINT_GROUP_RES,
    async (event, payload) => {
      const { id } = payload;
      const [res] = await nodeEndpointGroupDB.getOneNodeEndpointGroup(id);

      event.reply(MESSAGE.GET_ONE_NODE_ENDPOINT_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateNodeEndpointGroupPayload>(
    MESSAGE.CREATE_NODE_ENDPOINT_GROUP,
    MESSAGE.CREATE_NODE_ENDPOINT_GROUP_RES,
    async (event, payload) => {
      const [res] = await nodeEndpointGroupDB.createNodeEndpointGroup(
        payload?.data,
      );

      event.reply(MESSAGE.CREATE_NODE_ENDPOINT_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcUpdateNodeEndpointGroupPayload>(
    MESSAGE.UPDATE_NODE_ENDPOINT_GROUP,
    MESSAGE.UPDATE_NODE_ENDPOINT_GROUP_RES,
    async (event, payload) => {
      const [res] = await nodeEndpointGroupDB.updateNodeEndpointGroup(
        payload?.data,
      );

      event.reply(MESSAGE.UPDATE_NODE_ENDPOINT_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_NODE_ENDPOINT_GROUP,
    MESSAGE.DELETE_NODE_ENDPOINT_GROUP_RES,
    async (event, payload) => {
      const [res] = await nodeEndpointGroupDB.deleteNodeEndpointGroup(
        payload?.data,
      );
      event.reply(MESSAGE.DELETE_NODE_ENDPOINT_GROUP_RES, {
        data: res,
      });
    },
  );
};
