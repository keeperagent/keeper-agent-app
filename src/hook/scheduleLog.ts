import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import { actSaveGetListScheduleLog } from "@/redux/scheduleLog";
import type { IpcGetListScheduleLogPayload } from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGetListScheduleLog = () => {
  const { execute: getListScheduleLog, loading } = useIpcAction<IpcGetListScheduleLogPayload>(
    MESSAGE.GET_LIST_SCHEDULE_LOG,
    MESSAGE.GET_LIST_SCHEDULE_LOG_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload.error) {
          message?.error(payload?.error);
          return;
        }
        dispatch(actSaveGetListScheduleLog(payload?.data));
      },
    },
  );
  return { loading, getListScheduleLog };
};

const useDeleteScheduleLog = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_SCHEDULE_LOG,
    MESSAGE.DELETE_SCHEDULE_LOG_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) message?.error(error);
      },
    },
  );
  const deleteScheduleLog = (listId: number[]) => execute({ data: listId });
  return { deleteScheduleLog, loading, isSuccess };
};

export { useGetListScheduleLog, useDeleteScheduleLog };
