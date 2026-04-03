import { message } from "antd";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import {
  actSaveGetListStaticProxy,
  actSaveUpdateStaticProxy,
} from "@/redux/staticProxy";
import type { IpcGetListStaticProxyPayload } from "@/electron/ipcTypes";
import { IStaticProxy } from "@/electron/type";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";

const useGetListStaticProxy = () => {
  const { execute: getListStaticProxy, loading } =
    useIpcAction<IpcGetListStaticProxyPayload>(
      MESSAGE.GET_LIST_PROXY,
      MESSAGE.GET_LIST_PROXY_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListStaticProxy(payload?.data)),
      },
    );
  return { loading, getListStaticProxy };
};

const useDeleteStaticProxy = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_PROXY,
    MESSAGE.DELETE_PROXY_RES,
  );
  const deleteStaticProxy = (listId: number[]) => execute({ data: listId });
  return { deleteStaticProxy, loading, isSuccess };
};

const useUpdateStaticProxy = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_PROXY,
    MESSAGE.UPDATE_PROXY_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.code === RESPONSE_CODE.DUPLICATE_ERROR) {
          message.error(translate("dataDuplicate"));
          return;
        }
        dispatch(actSaveUpdateStaticProxy(payload.data));
      },
    },
  );
  const updateStaticProxy = (data: IStaticProxy) => execute({ data });
  return { updateStaticProxy, loading, isSuccess };
};

const useCreateStaticProxy = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_PROXY,
    MESSAGE.CREATE_PROXY_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) {
          message.error(error?.message);
        }
      },
    },
  );
  const createStaticProxy = (data: IStaticProxy[]) => execute({ data });
  return { createStaticProxy, loading, isSuccess };
};

export {
  useGetListStaticProxy,
  useDeleteStaticProxy,
  useUpdateStaticProxy,
  useCreateStaticProxy,
};
