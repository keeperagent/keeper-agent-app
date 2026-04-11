import { useRef } from "react";
import { MESSAGE } from "@/electron/constant";
import { ISetting } from "@/electron/type";
import {
  actSaveGetListSetting,
  actSaveCreateSetting,
  actSaveUpdateSetting,
  actSaveDeleteSetting,
} from "@/redux/setting";
import type { IpcGetListSettingPayload } from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGetListSetting = () => {
  const {
    execute: getListSetting,
    loading,
    isSuccess,
  } = useIpcAction<IpcGetListSettingPayload>(
    MESSAGE.GET_LIST_AGENT_SETTING,
    MESSAGE.GET_LIST_AGENT_SETTING_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetListSetting(payload?.data)),
    },
  );
  return { loading, isSuccess, getListSetting };
};

const useCreateSetting = (options?: { onSuccess?: () => void }) => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_AGENT_SETTING,
    MESSAGE.CREATE_AGENT_SETTING_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.data) dispatch(actSaveCreateSetting(payload.data));
        options?.onSuccess?.();
      },
    },
  );
  const createSetting = (data: Partial<ISetting>) => execute({ data });
  return { loading, isSuccess, createSetting };
};

const useUpdateSetting = (options?: { onSuccess?: () => void }) => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_AGENT_SETTING,
    MESSAGE.UPDATE_AGENT_SETTING_RES,
    {
      onSuccess: (payload, dispatch) => {
        dispatch(actSaveUpdateSetting(payload?.data));
        options?.onSuccess?.();
      },
    },
  );
  const updateSetting = (data: ISetting) => execute({ data });
  return { loading, isSuccess, updateSetting };
};

const useDeleteSetting = (options?: { onSuccess?: () => void }) => {
  const pendingIdsRef = useRef<number[]>([]);
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_AGENT_SETTING,
    MESSAGE.DELETE_AGENT_SETTING_RES,
    {
      onSuccess: (_payload, dispatch) => {
        pendingIdsRef.current.forEach((id) =>
          dispatch(actSaveDeleteSetting(id)),
        );
        pendingIdsRef.current = [];
        options?.onSuccess?.();
      },
    },
  );
  const deleteSetting = (ids: number | number[]) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    pendingIdsRef.current = idList;
    execute({ data: idList });
  };
  return { loading, isSuccess, deleteSetting };
};

export {
  useGetListSetting,
  useCreateSetting,
  useUpdateSetting,
  useDeleteSetting,
};
