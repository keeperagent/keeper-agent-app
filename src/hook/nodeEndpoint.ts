import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import {
  actSaveGetListNodeEndpoint,
  actSaveUpdateNodeEndpoint,
} from "@/redux/nodeEndpoint";
import type { IpcGetListNodeEndpointPayload } from "@/electron/ipcTypes";
import { INodeEndpoint } from "@/electron/type";
import { useIpcAction } from "./useIpcAction";

const useGetListNodeEndpoint = () => {
  const {
    execute: getListNodeEndpoint,
    loading,
    isSuccess,
  } = useIpcAction<IpcGetListNodeEndpointPayload>(
    MESSAGE.GET_LIST_NODE_ENDPOINT,
    MESSAGE.GET_LIST_NODE_ENDPOINT_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetListNodeEndpoint(payload?.data)),
    },
  );
  return { loading, isSuccess, getListNodeEndpoint };
};

const useDeleteNodeEndpoint = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_NODE_ENDPOINT,
    MESSAGE.DELETE_NODE_ENDPOINT_RES,
  );
  const deleteNodeEndpoint = (listId: number[]) => execute({ data: listId });
  return { deleteNodeEndpoint, loading, isSuccess };
};

const useUpdateNodeEndpoint = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_NODE_ENDPOINT,
    MESSAGE.UPDATE_NODE_ENDPOINT_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveUpdateNodeEndpoint(payload?.data)),
    },
  );
  const updateNodeEndpoint = (data: INodeEndpoint) => execute({ data });
  return { updateNodeEndpoint, loading, isSuccess };
};

const useCreateNodeEndpoint = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_NODE_ENDPOINT,
    MESSAGE.CREATE_NODE_ENDPOINT_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) message.error(error?.message);
      },
    },
  );
  const createNodeEndpoint = (data: INodeEndpoint[]) => execute({ data });
  return { createNodeEndpoint, loading, isSuccess };
};

export {
  useGetListNodeEndpoint,
  useDeleteNodeEndpoint,
  useUpdateNodeEndpoint,
  useCreateNodeEndpoint,
};
