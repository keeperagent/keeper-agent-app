import { useRef, useEffect } from "react";
import { MESSAGE } from "@/electron/constant";
import { IAgentTask } from "@/electron/type";
import {
  actSaveGetListAgentTask,
  actSaveCreateAgentTask,
  actSaveUpdateAgentTask,
  actSaveDeleteAgentTask,
} from "@/redux/agentTask";
import type {
  IpcCreateAgentTaskPayload,
  IpcUpdateAgentTaskPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGetListAgentTask = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.GET_LIST_AGENT_TASK,
    MESSAGE.GET_LIST_AGENT_TASK_RES,
    {
      onSuccess: (payload: any, dispatch) =>
        dispatch(actSaveGetListAgentTask(payload?.data || [])),
    },
  );

  const getListAgentTask = () => execute();

  return { loading, isSuccess, getListAgentTask };
};

const useCreateAgentTask = () => {
  const { execute, loading, isSuccess } =
    useIpcAction<IpcCreateAgentTaskPayload>(
      MESSAGE.CREATE_AGENT_TASK,
      MESSAGE.CREATE_AGENT_TASK_RES,
      {
        onSuccess: (payload, dispatch) => {
          if (payload?.data) {
            dispatch(actSaveCreateAgentTask(payload.data));
          }
        },
      },
    );

  const createAgentTask = (data: Partial<IAgentTask>) => execute({ data });

  return { loading, isSuccess, createAgentTask };
};

const useUpdateAgentTask = () => {
  const { execute, loading, isSuccess } =
    useIpcAction<IpcUpdateAgentTaskPayload>(
      MESSAGE.UPDATE_AGENT_TASK,
      MESSAGE.UPDATE_AGENT_TASK_RES,
      {
        onSuccess: (payload, dispatch) => {
          if (payload?.data) {
            dispatch(actSaveUpdateAgentTask(payload.data));
          }
        },
      },
    );

  const updateAgentTask = (id: number, data: Partial<IAgentTask>) =>
    execute({ id, data });

  return { loading, isSuccess, updateAgentTask };
};

const useDeleteAgentTask = () => {
  const pendingIdRef = useRef<number | null>(null);

  const { execute, loading, isSuccess } = useIpcAction<IpcDeletePayload>(
    MESSAGE.DELETE_AGENT_TASK,
    MESSAGE.DELETE_AGENT_TASK_RES,
    {
      onSuccess: (_payload, dispatch) => {
        if (pendingIdRef.current != null) {
          dispatch(actSaveDeleteAgentTask(pendingIdRef.current));
          pendingIdRef.current = null;
        }
      },
    },
  );

  const deleteAgentTask = (id: number) => {
    pendingIdRef.current = id;
    execute({ data: [id] });
  };

  return { loading, isSuccess, deleteAgentTask };
};

const useAgentTaskRealtime = (onChanged: () => void) => {
  useEffect(() => {
    window?.electron?.on(MESSAGE.AGENT_TASK_CHANGED, onChanged);
    return () => {
      window?.electron?.removeAllListeners(MESSAGE.AGENT_TASK_CHANGED);
    };
  }, [onChanged]);
};

export {
  useGetListAgentTask,
  useCreateAgentTask,
  useUpdateAgentTask,
  useDeleteAgentTask,
  useAgentTaskRealtime,
};
