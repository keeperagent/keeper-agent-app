import { useEffect, useState } from "react";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { MESSAGE } from "@/electron/constant";
import {
  actSaveCreateSchedule,
  actSaveUpdateSchedule,
  actSaveGetListSchedule,
  actSetActiveAgentRuns,
} from "@/redux/schedule";
import type { IpcGetListSchedulePayload } from "@/electron/ipcTypes";
import { ISchedule } from "@/electron/type";
import { useIpcAction } from "./useIpcAction";
import { useTranslation } from "./useTranslation";

const useCreateSchedule = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_SCHEDULE,
    MESSAGE.CREATE_SCHEDULE_RES,
    {
      onSuccess: (payload, dispatch) => {
        dispatch(actSaveCreateSchedule(payload.data));
      },
      onError: (errorMsg) => {
        message.error(errorMsg);
      },
    },
  );
  const createSchedule = (data: ISchedule) => execute({ data });
  return { createSchedule, loading, isSuccess };
};

const useUpdateSchedule = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_SCHEDULE,
    MESSAGE.UPDATE_SCHEDULE_RES,
    {
      onSuccess: (payload, dispatch) => {
        dispatch(actSaveUpdateSchedule(payload.data));
      },
      onError: (errorMsg) => {
        message.error(errorMsg);
      },
    },
  );
  const updateSchedule = (data: ISchedule) => execute({ data });
  return { updateSchedule, loading, isSuccess };
};

const useGetListSchedule = () => {
  const {
    execute: getListSchedule,
    loading,
    isSuccess,
  } = useIpcAction<IpcGetListSchedulePayload>(
    MESSAGE.GET_LIST_SCHEDULE,
    MESSAGE.GET_LIST_SCHEDULE_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetListSchedule(payload?.data)),
    },
  );
  return { getListSchedule, loading, isSuccess };
};

const useGetOneSchedule = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.GET_ONE_SCHEDULE,
    MESSAGE.GET_ONE_SCHEDULE_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveUpdateSchedule(payload?.data)),
    },
  );
  const getOneSchedule = (scheduleId: number) => execute({ scheduleId });
  return { getOneSchedule, loading, isSuccess };
};

const useDeleteSchedule = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_SCHEDULE,
    MESSAGE.DELETE_SCHEDULE_RES,
    {
      onError: (errorMsg) => {
        message.error(errorMsg);
      },
    },
  );
  const deleteSchedule = (listId: number[]) => execute({ data: listId });
  return { deleteSchedule, loading, isSuccess };
};

const useRunScheduleNow = () => {
  const { translate } = useTranslation();
  const { execute, loading } = useIpcAction(
    MESSAGE.RUN_SCHEDULE_NOW,
    MESSAGE.RUN_SCHEDULE_NOW_RES,
    {
      onSuccess: () => {
        message.success(translate("schedule.triggeredBackground"));
      },
      onError: (errorMsg) => {
        message.error(errorMsg);
      },
    },
  );
  const runScheduleNow = (scheduleId: number) => execute({ scheduleId });
  return { runScheduleNow, loading };
};

const useGetRunningAgentSchedule = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      dispatch(actSetActiveAgentRuns(payload?.data || []));
      setLoading(false);
    };
    window?.electron?.on(MESSAGE.GET_RUNNING_AGENT_SCHEDULE_RES, handler);
    return () => {
      window?.electron?.removeListener(
        MESSAGE.GET_RUNNING_AGENT_SCHEDULE_RES,
        handler,
      );
    };
  }, []);

  const getRunningAgentSchedule = () => {
    setLoading(true);
    window?.electron?.send(MESSAGE.GET_RUNNING_AGENT_SCHEDULE, {});
  };

  return { getRunningAgentSchedule, loading };
};

export {
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  useGetListSchedule,
  useGetOneSchedule,
  useRunScheduleNow,
  useGetRunningAgentSchedule,
};
