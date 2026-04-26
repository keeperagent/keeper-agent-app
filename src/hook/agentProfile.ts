import { useRef, useState } from "react";
import { MESSAGE } from "@/electron/constant";
import { IAgentProfile, IAppLog, IGetListResponse } from "@/electron/type";
import {
  actSaveGetListAgentProfile,
  actSaveCreateAgentProfile,
  actSaveUpdateAgentProfile,
  actSaveDeleteAgentProfile,
} from "@/redux/agentProfile";
import type {
  IpcGetListAgentProfilePayload,
  IpcGetOneAgentProfilePayload,
  IpcCreateAgentProfilePayload,
  IpcUpdateAgentProfilePayload,
  IpcDeletePayload,
  IpcGetAgentProfileMemoryPayload,
  IpcSaveAgentProfileMemoryPayload,
  IpcGetListAgentProfileLogPayload,
} from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";
import { invalidatePersistedSession } from "./agent";

const useGetListAgentProfile = () => {
  const {
    execute: getListAgentProfile,
    loading,
    isSuccess,
  } = useIpcAction<IpcGetListAgentProfilePayload>(
    MESSAGE.GET_LIST_AGENT_PROFILE,
    MESSAGE.GET_LIST_AGENT_PROFILE_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetListAgentProfile(payload?.data)),
    },
  );

  return { loading, isSuccess, getListAgentProfile };
};

const useGetOneAgentProfile = () => {
  const [data, setData] = useState<IAgentProfile | null>(null);

  const { execute, loading, isSuccess } =
    useIpcAction<IpcGetOneAgentProfilePayload>(
      MESSAGE.GET_ONE_AGENT_PROFILE,
      MESSAGE.GET_ONE_AGENT_PROFILE_RES,
      {
        onSuccess: (payload) => setData(payload?.data || null),
      },
    );

  const getOneAgentProfile = (id: number) => execute({ id });

  return { loading, isSuccess, data, getOneAgentProfile };
};

const useCreateAgentProfile = () => {
  const { execute, loading, isSuccess } =
    useIpcAction<IpcCreateAgentProfilePayload>(
      MESSAGE.CREATE_AGENT_PROFILE,
      MESSAGE.CREATE_AGENT_PROFILE_RES,
      {
        onSuccess: (payload, dispatch) => {
          if (payload?.data) {
            dispatch(actSaveCreateAgentProfile(payload.data));
          }
        },
      },
    );

  const createAgentProfile = (data: Partial<IAgentProfile>) =>
    execute({ data });

  return { loading, isSuccess, createAgentProfile };
};

const useUpdateAgentProfile = () => {
  const { execute, loading, isSuccess } =
    useIpcAction<IpcUpdateAgentProfilePayload>(
      MESSAGE.UPDATE_AGENT_PROFILE,
      MESSAGE.UPDATE_AGENT_PROFILE_RES,
      {
        onSuccess: (payload, dispatch) => {
          if (payload?.data) {
            dispatch(actSaveUpdateAgentProfile(payload.data));
            if (payload.data.id) {
              invalidatePersistedSession(payload.data.id);
            }
          }
        },
      },
    );

  const updateAgentProfile = (data: IAgentProfile) => execute({ data });

  return { loading, isSuccess, updateAgentProfile };
};

const useDeleteAgentProfile = () => {
  const pendingIdRef = useRef<number | null>(null);

  const { execute, loading, isSuccess } = useIpcAction<IpcDeletePayload>(
    MESSAGE.DELETE_AGENT_PROFILE,
    MESSAGE.DELETE_AGENT_PROFILE_RES,
    {
      onSuccess: (_payload, dispatch) => {
        if (pendingIdRef.current != null) {
          dispatch(actSaveDeleteAgentProfile(pendingIdRef.current));
          invalidatePersistedSession(pendingIdRef.current);
          pendingIdRef.current = null;
        }
      },
    },
  );

  const deleteAgentProfile = (id: number) => {
    pendingIdRef.current = id;
    execute({ data: [id] });
  };

  return { loading, isSuccess, deleteAgentProfile };
};

const useGetAgentProfileMemory = () => {
  const [content, setContent] = useState<string>("");

  const { execute, loading, isSuccess } =
    useIpcAction<IpcGetAgentProfileMemoryPayload>(
      MESSAGE.GET_AGENT_PROFILE_MEMORY,
      MESSAGE.GET_AGENT_PROFILE_MEMORY_RES,
      {
        onSuccess: (payload) => setContent(payload?.data || ""),
      },
    );

  const getAgentProfileMemory = (agentProfileId: number) =>
    execute({ agentProfileId });

  return { loading, isSuccess, content, getAgentProfileMemory };
};

const useSaveAgentProfileMemory = () => {
  const { execute, loading, isSuccess } =
    useIpcAction<IpcSaveAgentProfileMemoryPayload>(
      MESSAGE.SAVE_AGENT_PROFILE_MEMORY,
      MESSAGE.SAVE_AGENT_PROFILE_MEMORY_RES,
    );

  const saveAgentProfileMemory = (agentProfileId: number, content: string) =>
    execute({ agentProfileId, content });

  return { loading, isSuccess, saveAgentProfileMemory };
};

const useGetListAgentProfileLog = () => {
  const [data, setData] = useState<IGetListResponse<IAppLog> | null>(null);

  const { execute, loading, isSuccess } =
    useIpcAction<IpcGetListAgentProfileLogPayload>(
      MESSAGE.GET_LIST_AGENT_PROFILE_LOG,
      MESSAGE.GET_LIST_AGENT_PROFILE_LOG_RES,
      {
        onSuccess: (payload) => setData(payload?.data || null),
      },
    );

  const getListAgentProfileLog = (
    agentProfileId: number,
    page: number,
    pageSize: number,
    searchText?: string,
  ) => execute({ agentProfileId, page, pageSize, searchText });

  return { loading, isSuccess, data, getListAgentProfileLog };
};

const useGetMainAgentSystemPrompt = () => {
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);

  const { execute: fetchSystemPrompt, loading } = useIpcAction(
    MESSAGE.DASHBOARD_AGENT_GET_MAIN_SYSTEM_PROMPT,
    MESSAGE.DASHBOARD_AGENT_GET_MAIN_SYSTEM_PROMPT_RES,
    {
      onSuccess: (payload: any) =>
        setSystemPrompt(payload?.data?.systemPrompt ?? null),
    },
  );

  return { systemPrompt, loading, fetchSystemPrompt };
};

export {
  useGetListAgentProfile,
  useGetOneAgentProfile,
  useCreateAgentProfile,
  useUpdateAgentProfile,
  useDeleteAgentProfile,
  useGetAgentProfileMemory,
  useSaveAgentProfileMemory,
  useGetListAgentProfileLog,
  useGetMainAgentSystemPrompt,
};
