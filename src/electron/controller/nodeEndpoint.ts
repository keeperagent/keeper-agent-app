import { nodeEndpointDB } from "@/electron/database/nodeEndpoint";
import { CHAIN_TYPE, MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import { checkNodeEndpointStatus } from "@/electron/service/onchain";
import { nodeEndpointGroupDB } from "@/electron/database/nodeEndpointGroup";
import { onIpc } from "./helpers";
import type {
  IpcGetListNodeEndpointPayload,
  IpcCreateNodeEndpointPayload,
  IpcUpdateNodeEndpointPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";

export const nodeEndpointController = () => {
  onIpc<IpcGetListNodeEndpointPayload>(
    MESSAGE.GET_LIST_NODE_ENDPOINT,
    MESSAGE.GET_LIST_NODE_ENDPOINT_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, groupId } = payload;
      const [res] = await nodeEndpointDB.getListNodeEndpoint(
        page,
        pageSize,
        searchText,
        groupId,
      );

      const data = res?.data || [];

      for (let i = 0; i < data?.length; i++) {
        const groupId = data?.[0]?.groupId;
        const isActive = await getNodeEndpointStatus(
          groupId!,
          data[i].endpoint || "",
        );

        data[i] = {
          ...data[i],
          isActive,
        };
      }
      event.reply(MESSAGE.GET_LIST_NODE_ENDPOINT_RES, {
        data: { ...res, data },
      });
    },
  );

  onIpc<IpcCreateNodeEndpointPayload>(
    MESSAGE.CREATE_NODE_ENDPOINT,
    MESSAGE.CREATE_NODE_ENDPOINT_RES,
    async (event, payload) => {
      const err = await nodeEndpointDB.createBulkNodeEndpoint(payload?.data);

      event.reply(MESSAGE.CREATE_NODE_ENDPOINT_RES, {
        error: err,
      });
    },
  );

  onIpc<IpcUpdateNodeEndpointPayload>(
    MESSAGE.UPDATE_NODE_ENDPOINT,
    MESSAGE.UPDATE_NODE_ENDPOINT_RES,
    async (event, payload) => {
      const [res, err] = await nodeEndpointDB.updateNodeEndpoint(payload?.data);
      if (err) {
        event.reply(MESSAGE.UPDATE_NODE_ENDPOINT_RES, {
          code: RESPONSE_CODE.DUPLICATE_ERROR,
        });
        return;
      }

      const isActive = await getNodeEndpointStatus(
        res?.groupId!,
        res?.endpoint || "",
      );
      event.reply(MESSAGE.UPDATE_NODE_ENDPOINT_RES, {
        data: { ...res, isActive },
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_NODE_ENDPOINT,
    MESSAGE.DELETE_NODE_ENDPOINT_RES,
    async (event, payload) => {
      const [res] = await nodeEndpointDB.deleteNodeEndpoint(payload?.data);
      event.reply(MESSAGE.DELETE_NODE_ENDPOINT_RES, {
        data: res,
      });
    },
  );
};

const getNodeEndpointStatus = async (
  groupId: number,
  nodeEndpoint: string,
): Promise<boolean> => {
  const [nodeEndpointGroup, err] =
    await nodeEndpointGroupDB.getOneNodeEndpointGroup(groupId!);
  if (err) {
    return false;
  }

  const isActive = await checkNodeEndpointStatus(
    nodeEndpoint,
    nodeEndpointGroup?.chainType || CHAIN_TYPE.EVM,
  );
  return isActive;
};
