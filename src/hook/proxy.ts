import { message } from "antd";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import {
  actSaveCreateProxy,
  actSaveGetListProxy,
  actSaveUpdateProxy,
} from "@/redux/proxy";
import type { IpcGetListProxyPayload } from "@/electron/ipcTypes";
import { IProxy } from "@/electron/type";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";

const useGetListProxy = () => {
  const {
    execute: getListProxy,
    loading,
    isSuccess,
  } = useIpcAction<IpcGetListProxyPayload>(
    MESSAGE.GET_LIST_PROXY,
    MESSAGE.GET_LIST_PROXY_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetListProxy(payload?.data)),
    },
  );
  return { loading, getListProxy, isSuccess };
};

const useDeleteProxy = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_PROXY,
    MESSAGE.DELETE_PROXY_RES,
  );
  const deleteProxy = (listId: number[]) => execute({ data: listId });
  return { deleteProxy, loading, isSuccess };
};

const useUpdateProxy = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_PROXY,
    MESSAGE.UPDATE_PROXY_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.code === RESPONSE_CODE.DUPLICATE_ERROR) {
          message.error(translate("proxy.duplicateAPIkey"));
          return;
        }
        dispatch(actSaveUpdateProxy(payload.data));
      },
    },
  );
  const updateProxy = (data: IProxy) => execute({ data });
  return { updateProxy, loading, isSuccess };
};

const useCreateProxy = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_PROXY,
    MESSAGE.CREATE_PROXY_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.code === RESPONSE_CODE.DUPLICATE_ERROR) {
          message.error(translate("proxy.duplicateAPIkey"));
          return;
        }
        dispatch(actSaveCreateProxy(payload.data));
      },
    },
  );
  const createProxy = (data: IProxy) => execute({ data });
  return { createProxy, loading, isSuccess };
};

export { useGetListProxy, useDeleteProxy, useUpdateProxy, useCreateProxy };
