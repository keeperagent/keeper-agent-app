import { useRef } from "react";
import { MESSAGE } from "@/electron/constant";
import { IAgentSetting } from "@/electron/type";
import {
  actSaveGetListAgentSetting,
  actSaveCreateAgentSetting,
  actSaveUpdateAgentSetting,
  actSaveDeleteAgentSetting,
} from "@/redux/agentSetting";
import type { IpcGetListAgentSettingPayload } from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGetListAgentSetting = () => {
  const {
    execute: getListAgentSetting,
    loading,
    isSuccess,
  } = useIpcAction<IpcGetListAgentSettingPayload>(
    MESSAGE.GET_LIST_AGENT_SETTING,
    MESSAGE.GET_LIST_AGENT_SETTING_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetListAgentSetting(payload?.data)),
    },
  );
  return { loading, isSuccess, getListAgentSetting };
};

const useCreateAgentSetting = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_AGENT_SETTING,
    MESSAGE.CREATE_AGENT_SETTING_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.data) dispatch(actSaveCreateAgentSetting(payload.data));
      },
    },
  );
  const createAgentSetting = (data: Partial<IAgentSetting>) =>
    execute({ data });
  return { loading, isSuccess, createAgentSetting };
};

const useUpdateAgentSetting = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_AGENT_SETTING,
    MESSAGE.UPDATE_AGENT_SETTING_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveUpdateAgentSetting(payload?.data)),
    },
  );
  const updateAgentSetting = (data: IAgentSetting) => execute({ data });
  return { loading, isSuccess, updateAgentSetting };
};

const useDeleteAgentSetting = () => {
  const pendingIdRef = useRef<number | null>(null);
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_AGENT_SETTING,
    MESSAGE.DELETE_AGENT_SETTING_RES,
    {
      onSuccess: (_payload, dispatch) => {
        if (pendingIdRef.current != null) {
          dispatch(actSaveDeleteAgentSetting(pendingIdRef.current));
          pendingIdRef.current = null;
        }
      },
    },
  );
  const deleteAgentSetting = (id: number) => {
    pendingIdRef.current = id;
    execute({ data: [id] });
  };
  return { loading, isSuccess, deleteAgentSetting };
};

export {
  useGetListAgentSetting,
  useCreateAgentSetting,
  useUpdateAgentSetting,
  useDeleteAgentSetting,
};
