import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import {
  actSaveGetListUserLog,
  actSaveCreateLog,
} from "@/redux/userLog";
import type { IpcGetListUserLogPayload } from "@/electron/ipcTypes";
import { ILog } from "@/electron/type";
import { useIpcAction } from "./useIpcAction";

const useGetListUserLog = () => {
  const {
    execute: getListUserLog,
    loading,
    isSuccess,
  } = useIpcAction<IpcGetListUserLogPayload>(
    MESSAGE.GET_LIST_USER_LOG,
    MESSAGE.GET_LIST_USER_LOG_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetListUserLog(payload?.data)),
    },
  );
  return { loading, isSuccess, getListUserLog };
};

const useDeleteUserLog = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_USER_LOG,
    MESSAGE.DELETE_USER_LOG_RES,
  );
  const deleteUserLog = (listId: number[]) => execute({ data: listId });
  return { deleteUserLog, loading, isSuccess };
};

const useCreateUserLog = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_USER_LOG,
    MESSAGE.CREATE_USER_LOG_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.error) {
          message.error(payload.error?.message);
          return;
        }
        dispatch(actSaveCreateLog(payload.data));
      },
    },
  );
  const createUserLog = (data: ILog) => execute({ data });
  return { createUserLog, loading, isSuccess };
};

export {
  useGetListUserLog,
  useDeleteUserLog,
  useCreateUserLog,
};
