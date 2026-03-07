import { message } from "antd";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import {
  actSaveGetListProxyIp,
  actSaveUpdateProxyIp,
} from "@/redux/proxyIp";
import type { IpcGetListProxyIpPayload } from "@/electron/ipcTypes";
import { IProxyIp } from "@/electron/type";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";

const useGetListProxyIp = () => {
  const { execute: getListProxyIp, loading } = useIpcAction<IpcGetListProxyIpPayload>(
    MESSAGE.GET_LIST_PROXY_IP,
    MESSAGE.GET_LIST_PROXY_IP_RES,
    { onSuccess: (payload, dispatch) => dispatch(actSaveGetListProxyIp(payload?.data)) },
  );
  return { loading, getListProxyIp };
};

const useDeleteProxyIp = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_PROXY_IP,
    MESSAGE.DELETE_PROXY_IP_RES,
  );
  const deleteProxyIp = (listId: number[]) => execute({ data: listId });
  return { deleteProxyIp, loading, isSuccess };
};

const useUpdateProxyIp = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_PROXY_IP,
    MESSAGE.UPDATE_PROXY_IP_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.code === RESPONSE_CODE.DUPLICATE_ERROR) {
          message.error(translate("dataDuplicate"));
          return;
        }
        dispatch(actSaveUpdateProxyIp(payload.data));
      },
    },
  );
  const updateProxyIp = (data: IProxyIp) => execute({ data });
  return { updateProxyIp, loading, isSuccess };
};

const useCreateProxyIp = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_PROXY_IP,
    MESSAGE.CREATE_PROXY_IP_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) message.error(error?.message);
      },
    },
  );
  const createProxyIp = (data: IProxyIp[]) => execute({ data });
  return { createProxyIp, loading, isSuccess };
};

export {
  useGetListProxyIp,
  useDeleteProxyIp,
  useUpdateProxyIp,
  useCreateProxyIp,
};
