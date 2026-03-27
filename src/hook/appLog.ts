import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import { IAppLog } from "@/electron/type";
import { actSaveGetListAppLog } from "@/redux/appLog";
import { useIpcAction } from "./useIpcAction";

const useGetListAppLog = () => {
  const { execute: getListAppLog, loading } = useIpcAction(
    MESSAGE.GET_LIST_APP_LOG,
    MESSAGE.GET_LIST_APP_LOG_RES,
    {
      onSuccess: (payload: any, dispatch: any) => {
        if (payload.error) {
          message.error(payload.error);
          return;
        }
        dispatch(actSaveGetListAppLog(payload?.data));
      },
    },
  );
  return { getListAppLog, loading };
};

const useDeleteAppLog = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_APP_LOG,
    MESSAGE.DELETE_APP_LOG_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) {
          message.error(error);
        }
      },
    },
  );
  const deleteAppLog = (listId: number[]) => execute({ data: listId });
  return { deleteAppLog, loading, isSuccess };
};

const useCreateAppLog = () => {
  const { execute, loading } = useIpcAction(
    MESSAGE.CREATE_APP_LOG,
    MESSAGE.CREATE_APP_LOG_RES,
  );

  const createAppLog = (data: Partial<IAppLog>) => execute({ data });
  return { createAppLog, loading };
};

export { useGetListAppLog, useDeleteAppLog, useCreateAppLog };
