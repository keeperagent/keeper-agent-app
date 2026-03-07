import { message } from "antd";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import {
  actSaveCreateProxyIpGroup,
  actSaveGetListProxyIpGroup,
  actSaveUpdateProxyIpGroup,
  actSaveSelectedProxyIpGroup,
} from "@/redux/proxyIpGroup";
import type { IpcGetListProxyIpGroupPayload } from "@/electron/ipcTypes";
import { IProxyIpGroup } from "@/electron/type";
import { useTranslation } from "@/hook";
import { useIpcAction } from "./useIpcAction";

const useGetListProxyIpGroup = () => {
  const { execute: getListProxyIpGroup, loading } =
    useIpcAction<IpcGetListProxyIpGroupPayload>(
      MESSAGE.GET_LIST_PROXY_IP_GROUP,
      MESSAGE.GET_LIST_PROXY_IP_GROUP_RES,
      {
        onSuccess: (payload, dispatch) => {
          if (payload?.error) {
            message.error(payload?.error);
            return;
          }
          dispatch(actSaveGetListProxyIpGroup(payload?.data));
        },
      },
    );
  return { loading, getListProxyIpGroup };
};

const useGetOneProxyIpGroup = () => {
  const { execute, loading } = useIpcAction(
    MESSAGE.GET_ONE_PROXY_IP_GROUP,
    MESSAGE.GET_ONE_PROXY_IP_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveSelectedProxyIpGroup(payload?.data)),
    },
  );
  const getOneProxyIpGroup = (id: number) => execute({ id });
  return { loading, getOneProxyIpGroup };
};

const useDeleteProxyIpGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_PROXY_IP_GROUP,
    MESSAGE.DELETE_PROXY_IP_GROUP_RES,
  );
  const deleteProxyIpGroup = (listId: number[]) => execute({ data: listId });
  return { deleteProxyIpGroup, loading, isSuccess };
};

const useUpdateProxyIpGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_PROXY_IP_GROUP,
    MESSAGE.UPDATE_PROXY_IP_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveUpdateProxyIpGroup(payload?.data)),
    },
  );
  const updateProxyIpGroup = (data: IProxyIpGroup) => execute({ data });
  return { updateProxyIpGroup, loading, isSuccess };
};

const useCreateProxyIpGroup = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_PROXY_IP_GROUP,
    MESSAGE.CREATE_PROXY_IP_GROUP_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.code === RESPONSE_CODE.DUPLICATE_ERROR) {
          message.error(translate("dataDuplicate"));
          return;
        }
        dispatch(actSaveCreateProxyIpGroup(payload.data));
      },
    },
  );
  const createProxyIpGroup = (data: IProxyIpGroup) => execute({ data });
  return { createProxyIpGroup, loading, isSuccess };
};

export {
  useGetListProxyIpGroup,
  useDeleteProxyIpGroup,
  useUpdateProxyIpGroup,
  useCreateProxyIpGroup,
  useGetOneProxyIpGroup,
};
