import { useEffect, useState } from "react";
import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import { IAgentTask, IAppLog } from "@/electron/type";
import {
  actSaveGetListAgentTask,
  actSaveCreateAgentTask,
  actSaveUpdateAgentTask,
} from "@/redux/agentTask";
import type {
  IpcCreateAgentTaskPayload,
  IpcUpdateAgentTaskPayload,
  IpcDeletePayload,
  IpcPauseAgentTaskPayload,
  IpcRerunAgentTaskPayload,
  IpcGetAgentAnalyticsPayload,
  IpcGetAgentTaskLogPayload,
  IpcGetLiveToolCallsPayload,
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
        onError: (error) => message.error(error),
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
        onError: (errorMsg) => {
          message.error(errorMsg);
        },
      },
    );

  const updateAgentTask = (id: number, data: Partial<IAgentTask>) =>
    execute({ id, data });

  return { loading, isSuccess, updateAgentTask };
};

const useDeleteAgentTask = () => {
  const { execute, loading, isSuccess } = useIpcAction<IpcDeletePayload>(
    MESSAGE.DELETE_AGENT_TASK,
    MESSAGE.DELETE_AGENT_TASK_RES,
    {
      onError: (error) => message.error(error),
    },
  );

  const deleteAgentTask = (id: number) => execute({ data: [id] });
  const bulkDeleteAgentTask = (ids: number[]) => execute({ data: ids });

  return { loading, isSuccess, deleteAgentTask, bulkDeleteAgentTask };
};

const usePauseAgentTask = () => {
  const { execute, loading, isSuccess } =
    useIpcAction<IpcPauseAgentTaskPayload>(
      MESSAGE.PAUSE_AGENT_TASK,
      MESSAGE.PAUSE_AGENT_TASK_RES,
    );

  const pauseAgentTask = (id: number) => execute({ id });
  return { loading, isSuccess, pauseAgentTask };
};

const useRerunAgentTask = () => {
  const { execute, loading, isSuccess } =
    useIpcAction<IpcRerunAgentTaskPayload>(
      MESSAGE.RERUN_AGENT_TASK,
      MESSAGE.RERUN_AGENT_TASK_RES,
      {
        onError: (error) => message.error(error),
      },
    );

  const rerunAgentTask = (id: number) => execute({ id });
  return { loading, isSuccess, rerunAgentTask };
};

const useAgentTaskRealtime = (onChanged: () => void) => {
  useEffect(() => {
    const unsubscribe = window?.electron?.on(
      MESSAGE.AGENT_TASK_CHANGED,
      onChanged,
    );
    return () => {
      unsubscribe?.();
    };
  }, [onChanged]);
};

const useGetAgentAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);

  const { execute, loading } = useIpcAction<IpcGetAgentAnalyticsPayload>(
    MESSAGE.GET_AGENT_ANALYTICS,
    MESSAGE.GET_AGENT_ANALYTICS_RES,
    {
      onSuccess: (payload: any) => {
        setAnalytics(payload?.data || null);
      },
    },
  );

  const getAgentAnalytics = (fromTimestamp: number) =>
    execute({ fromTimestamp });

  return { loading, analytics, getAgentAnalytics };
};

const useGetAgentTaskLog = () => {
  const [logs, setLogs] = useState<IAppLog[]>([]);

  const { execute, loading } = useIpcAction<IpcGetAgentTaskLogPayload>(
    MESSAGE.GET_AGENT_TASK_LOG,
    MESSAGE.GET_AGENT_TASK_LOG_RES,
    {
      onSuccess: (payload: any) => setLogs(payload?.data || []),
    },
  );

  const getAgentTaskLog = (taskId: number) => execute({ taskId });
  return { loading, logs, getAgentTaskLog };
};

const useGetLiveToolCalls = (onSuccess: (data: any[]) => void) => {
  const { execute } = useIpcAction<IpcGetLiveToolCallsPayload>(
    MESSAGE.GET_LIVE_TOOL_CALLS,
    MESSAGE.GET_LIVE_TOOL_CALLS_RES,
    {
      onSuccess: (payload: any) => onSuccess(payload?.data || []),
    },
  );

  const getLiveToolCalls = (taskId: number) => execute({ taskId });
  return { getLiveToolCalls };
};

export {
  useGetListAgentTask,
  useCreateAgentTask,
  useUpdateAgentTask,
  useDeleteAgentTask,
  usePauseAgentTask,
  useRerunAgentTask,
  useAgentTaskRealtime,
  useGetAgentAnalytics,
  useGetAgentTaskLog,
  useGetLiveToolCalls,
};
