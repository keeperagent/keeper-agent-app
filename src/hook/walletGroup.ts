import { useState } from "react";
import { useDispatch } from "react-redux";
import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import {
  actSaveCreateWalletGroup,
  actSaveGetListWalletGroup,
  actSaveUpdateWalletGroup,
  actSaveSelectedWalletGroup,
  actSaveWalletGroupDependency,
} from "@/redux/walletGroup";
import type { IpcGetListWalletGroupPayload } from "@/electron/ipcTypes";
import { IWalletGroup } from "@/electron/type";
import { SQL_FOREIGNKEY_ERROR } from "@/config/constant";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";

const useGetListWalletGroup = () => {
  const { execute: getListWalletGroup, loading } =
    useIpcAction<IpcGetListWalletGroupPayload>(
      MESSAGE.GET_LIST_WALLET_GROUP,
      MESSAGE.GET_LIST_WALLET_GROUP_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListWalletGroup(payload?.data)),
      },
    );
  return { loading, getListWalletGroup };
};

const useGetOneWalletGroup = () => {
  const { execute, loading } = useIpcAction(
    MESSAGE.GET_ONE_WALLET_GROUP,
    MESSAGE.GET_ONE_WALLET_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveSelectedWalletGroup(payload?.data)),
    },
  );
  const getOneWalletGroup = (id: number) => execute({ id });
  return { loading, getOneWalletGroup };
};

const useDeleteWalletGroup = () => {
  const [hasDependencyError, setHasDependencyError] = useState(false);
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_WALLET_GROUP,
    MESSAGE.DELETE_WALLET_GROUP_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) {
          if (error === SQL_FOREIGNKEY_ERROR) {
            message.error(translate("wallet.canNotDeleteWallet"));
            setHasDependencyError(true);
          } else {
            message.error(error);
            setHasDependencyError(false);
          }
        }
      },
    },
  );
  const deleteWalletGroup = (listGroupId: number[]) =>
    execute({ data: listGroupId });
  return {
    deleteWalletGroup,
    loading,
    isSuccess,
    hasDependencyError,
    setHasDependencyError,
  };
};

const useUpdateWalletGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_WALLET_GROUP,
    MESSAGE.UPDATE_WALLET_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveUpdateWalletGroup(payload?.data)),
    },
  );
  const updateWalletGroup = (data: IWalletGroup) => execute({ data });
  return { updateWalletGroup, loading, isSuccess };
};

const useCreateWalletGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_WALLET_GROUP,
    MESSAGE.CREATE_WALLET_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveCreateWalletGroup(payload?.data)),
    },
  );
  const createWalletGroup = (data: IWalletGroup, isQuickMapCampaign: boolean) =>
    execute({ data, isQuickMapCampaign });

  return { createWalletGroup, loading, isSuccess };
};

const useGetWalletGroupDependency = () => {
  const dispatch = useDispatch();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.GET_WALLET_GROUP_DEPENDENCY,
    MESSAGE.GET_WALLET_GROUP_DEPENDENCY_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveWalletGroupDependency(payload.data)),
    },
  );
  const getWalletGroupDependency = (listWalletGroupId: number[]) =>
    execute({ listWalletGroupId });
  const clearWalletGroupDependency = () =>
    dispatch(actSaveWalletGroupDependency({}));

  return {
    getWalletGroupDependency,
    loading,
    isSuccess,
    clearWalletGroupDependency,
  };
};

export {
  useGetListWalletGroup,
  useDeleteWalletGroup,
  useUpdateWalletGroup,
  useCreateWalletGroup,
  useGetOneWalletGroup,
  useGetWalletGroupDependency,
};
