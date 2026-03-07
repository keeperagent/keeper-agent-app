import { message } from "antd";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import {
  actSaveCreateNodeEndpointGroup,
  actSaveGetListNodeEndpointGroup,
  actSaveUpdateNodeEndpointGroup,
  actSaveSelectedNodeEndpointGroup,
} from "@/redux/nodeEndpointGroup";
import type { IpcGetListNodeEndpointGroupPayload } from "@/electron/ipcTypes";
import { INodeEndpointGroup } from "@/electron/type";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";

const useGetListNodeEndpointGroup = () => {
  const { execute: getListNodeEndpointGroup, loading } =
    useIpcAction<IpcGetListNodeEndpointGroupPayload>(
      MESSAGE.GET_LIST_NODE_ENDPOINT_GROUP,
      MESSAGE.GET_LIST_NODE_ENDPOINT_GROUP_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListNodeEndpointGroup(payload?.data)),
      },
    );
  return { loading, getListNodeEndpointGroup };
};

const useGetOneNodeEndpointGroup = () => {
  const { execute, loading } = useIpcAction(
    MESSAGE.GET_ONE_NODE_ENDPOINT_GROUP,
    MESSAGE.GET_ONE_NODE_ENDPOINT_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveSelectedNodeEndpointGroup(payload?.data)),
    },
  );
  const getOneNodeEndpointGroup = (id: number) => execute({ id });
  return { loading, getOneNodeEndpointGroup };
};

const useDeleteNodeEndpointGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_NODE_ENDPOINT_GROUP,
    MESSAGE.DELETE_NODE_ENDPOINT_GROUP_RES,
  );
  const deleteNodeEndpointGroup = (listId: number[]) =>
    execute({ data: listId });
  return { deleteNodeEndpointGroup, loading, isSuccess };
};

const useUpdateNodeEndpointGroup = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_NODE_ENDPOINT_GROUP,
    MESSAGE.UPDATE_NODE_ENDPOINT_GROUP_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.code === RESPONSE_CODE.DUPLICATE_ERROR) {
          message.error(translate("dataDuplicate"));
          return;
        }
        dispatch(actSaveUpdateNodeEndpointGroup(payload.data));
      },
    },
  );
  const updateNodeEndpointGroup = (data: INodeEndpointGroup) =>
    execute({ data });
  return { updateNodeEndpointGroup, loading, isSuccess };
};

const useCreateNodeEndpointGroup = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_NODE_ENDPOINT_GROUP,
    MESSAGE.CREATE_NODE_ENDPOINT_GROUP_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.code === RESPONSE_CODE.DUPLICATE_ERROR) {
          message.error(translate("dataDuplicate"));
          return;
        }
        dispatch(actSaveCreateNodeEndpointGroup(payload.data));
      },
    },
  );
  const createNodeEndpointGroup = (data: INodeEndpointGroup) =>
    execute({ data });
  return { createNodeEndpointGroup, loading, isSuccess };
};

export {
  useGetListNodeEndpointGroup,
  useDeleteNodeEndpointGroup,
  useUpdateNodeEndpointGroup,
  useCreateNodeEndpointGroup,
  useGetOneNodeEndpointGroup,
};
