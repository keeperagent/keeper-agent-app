import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import {
  actSaveCreateStaticProxyGroup,
  actSaveGetListStaticProxyGroup,
  actSaveUpdateStaticProxyGroup,
  actSaveSelectedStaticProxyGroup,
} from "@/redux/staticProxyGroup";
import type { IpcGetListStaticProxyGroupPayload } from "@/electron/ipcTypes";
import { IStaticProxyGroup } from "@/electron/type";
import { useTranslation } from "@/hook";
import { useIpcAction } from "./useIpcAction";

const useGetListStaticProxyGroup = () => {
  const { execute: getListStaticProxyGroup, loading } =
    useIpcAction<IpcGetListStaticProxyGroupPayload>(
      MESSAGE.GET_LIST_PROXY_GROUP,
      MESSAGE.GET_LIST_PROXY_GROUP_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListStaticProxyGroup(payload?.data)),
        onError: (error) => message.error(error),
      },
    );
  return { loading, getListStaticProxyGroup };
};

const useGetOneStaticProxyGroup = () => {
  const { execute, loading } = useIpcAction(
    MESSAGE.GET_ONE_PROXY_GROUP,
    MESSAGE.GET_ONE_PROXY_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveSelectedStaticProxyGroup(payload?.data)),
    },
  );
  const getOneStaticProxyGroup = (id: number) => execute({ id });
  return { loading, getOneStaticProxyGroup };
};

const useDeleteStaticProxyGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_PROXY_GROUP,
    MESSAGE.DELETE_PROXY_GROUP_RES,
    {
      onError: (error) => message.error(error),
    },
  );
  const deleteStaticProxyGroup = (listId: number[]) =>
    execute({ data: listId });
  return { deleteStaticProxyGroup, loading, isSuccess };
};

const useUpdateStaticProxyGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_PROXY_GROUP,
    MESSAGE.UPDATE_PROXY_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveUpdateStaticProxyGroup(payload?.data)),
      onError: (error) => message.error(error),
    },
  );
  const updateStaticProxyGroup = (data: IStaticProxyGroup) => execute({ data });
  return { updateStaticProxyGroup, loading, isSuccess };
};

const useCreateStaticProxyGroup = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_PROXY_GROUP,
    MESSAGE.CREATE_PROXY_GROUP_RES,
    {
      onSuccess: (payload, dispatch) => {
        dispatch(actSaveCreateStaticProxyGroup(payload.data));
      },
      onError: (error) => message.error(error || translate("dataDuplicate")),
    },
  );
  const createStaticProxyGroup = (data: IStaticProxyGroup) => execute({ data });
  return { createStaticProxyGroup, loading, isSuccess };
};

export {
  useGetListStaticProxyGroup,
  useDeleteStaticProxyGroup,
  useUpdateStaticProxyGroup,
  useCreateStaticProxyGroup,
  useGetOneStaticProxyGroup,
};
