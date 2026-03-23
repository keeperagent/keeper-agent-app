import { useRef, useState } from "react";
import { MESSAGE } from "@/electron/constant";
import {
  IAgentRegistry,
  IScheduleLog,
  IGetListResponse,
} from "@/electron/type";
import {
  actSaveGetListAgentRegistry,
  actSaveCreateAgentRegistry,
  actSaveUpdateAgentRegistry,
  actSaveDeleteAgentRegistry,
} from "@/redux/agentRegistry";
import type {
  IpcGetListAgentRegistryPayload,
  IpcGetOneAgentRegistryPayload,
  IpcCreateAgentRegistryPayload,
  IpcUpdateAgentRegistryPayload,
  IpcDeletePayload,
  IpcGetAgentRegistryMemoryPayload,
  IpcSaveAgentRegistryMemoryPayload,
  IpcGetListAgentRegistryLogPayload,
} from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGetListAgentRegistry = () => {
  const {
    execute: getListAgentRegistry,
    loading,
    isSuccess,
  } = useIpcAction<IpcGetListAgentRegistryPayload>(
    MESSAGE.GET_LIST_AGENT_REGISTRY,
    MESSAGE.GET_LIST_AGENT_REGISTRY_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetListAgentRegistry(payload?.data)),
    },
  );

  return { loading, isSuccess, getListAgentRegistry };
};

const useGetOneAgentRegistry = () => {
  const [data, setData] = useState<IAgentRegistry | null>(null);

  const { execute, loading, isSuccess } =
    useIpcAction<IpcGetOneAgentRegistryPayload>(
      MESSAGE.GET_ONE_AGENT_REGISTRY,
      MESSAGE.GET_ONE_AGENT_REGISTRY_RES,
      {
        onSuccess: (payload) => setData(payload?.data || null),
      },
    );

  const getOneAgentRegistry = (id: number) => execute({ id });

  return { loading, isSuccess, data, getOneAgentRegistry };
};

const useCreateAgentRegistry = () => {
  const { execute, loading, isSuccess } =
    useIpcAction<IpcCreateAgentRegistryPayload>(
      MESSAGE.CREATE_AGENT_REGISTRY,
      MESSAGE.CREATE_AGENT_REGISTRY_RES,
      {
        onSuccess: (payload, dispatch) => {
          if (payload?.data) {
            dispatch(actSaveCreateAgentRegistry(payload.data));
          }
        },
      },
    );

  const createAgentRegistry = (data: Partial<IAgentRegistry>) =>
    execute({ data });

  return { loading, isSuccess, createAgentRegistry };
};

const useUpdateAgentRegistry = () => {
  const { execute, loading, isSuccess } =
    useIpcAction<IpcUpdateAgentRegistryPayload>(
      MESSAGE.UPDATE_AGENT_REGISTRY,
      MESSAGE.UPDATE_AGENT_REGISTRY_RES,
      {
        onSuccess: (payload, dispatch) => {
          if (payload?.data) {
            dispatch(actSaveUpdateAgentRegistry(payload.data));
          }
        },
      },
    );

  const updateAgentRegistry = (data: IAgentRegistry) => execute({ data });

  return { loading, isSuccess, updateAgentRegistry };
};

const useDeleteAgentRegistry = () => {
  const pendingIdRef = useRef<number | null>(null);

  const { execute, loading, isSuccess } = useIpcAction<IpcDeletePayload>(
    MESSAGE.DELETE_AGENT_REGISTRY,
    MESSAGE.DELETE_AGENT_REGISTRY_RES,
    {
      onSuccess: (_payload, dispatch) => {
        if (pendingIdRef.current != null) {
          dispatch(actSaveDeleteAgentRegistry(pendingIdRef.current));
          pendingIdRef.current = null;
        }
      },
    },
  );

  const deleteAgentRegistry = (id: number) => {
    pendingIdRef.current = id;
    execute({ data: [id] });
  };

  return { loading, isSuccess, deleteAgentRegistry };
};

const useGetAgentRegistryMemory = () => {
  const [content, setContent] = useState<string>("");

  const { execute, loading, isSuccess } =
    useIpcAction<IpcGetAgentRegistryMemoryPayload>(
      MESSAGE.GET_AGENT_REGISTRY_MEMORY,
      MESSAGE.GET_AGENT_REGISTRY_MEMORY_RES,
      {
        onSuccess: (payload) => setContent(payload?.data || ""),
      },
    );

  const getAgentRegistryMemory = (agentRegistryId: number) =>
    execute({ agentRegistryId });

  return { loading, isSuccess, content, getAgentRegistryMemory };
};

const useSaveAgentRegistryMemory = () => {
  const { execute, loading, isSuccess } =
    useIpcAction<IpcSaveAgentRegistryMemoryPayload>(
      MESSAGE.SAVE_AGENT_REGISTRY_MEMORY,
      MESSAGE.SAVE_AGENT_REGISTRY_MEMORY_RES,
    );

  const saveAgentRegistryMemory = (agentRegistryId: number, content: string) =>
    execute({ agentRegistryId, content });

  return { loading, isSuccess, saveAgentRegistryMemory };
};

const useGetListAgentRegistryLog = () => {
  const [data, setData] = useState<IGetListResponse<IScheduleLog> | null>(null);

  const { execute, loading, isSuccess } =
    useIpcAction<IpcGetListAgentRegistryLogPayload>(
      MESSAGE.GET_LIST_AGENT_REGISTRY_LOG,
      MESSAGE.GET_LIST_AGENT_REGISTRY_LOG_RES,
      {
        onSuccess: (payload) => setData(payload?.data || null),
      },
    );

  const getListAgentRegistryLog = (
    agentRegistryId: number,
    page: number,
    pageSize: number,
    searchText?: string,
  ) => execute({ agentRegistryId, page, pageSize, searchText });

  return { loading, isSuccess, data, getListAgentRegistryLog };
};

export {
  useGetListAgentRegistry,
  useGetOneAgentRegistry,
  useCreateAgentRegistry,
  useUpdateAgentRegistry,
  useDeleteAgentRegistry,
  useGetAgentRegistryMemory,
  useSaveAgentRegistryMemory,
  useGetListAgentRegistryLog,
};
