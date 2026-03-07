import { scheduleLogDB } from "@/electron/database/scheduleLog";
import { MESSAGE } from "@/electron/constant";
import { onIpc } from "./helpers";
import type {
  IpcGetListScheduleLogPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";

export const runScheduleLogController = () => {
  onIpc<IpcGetListScheduleLogPayload>(
    MESSAGE.GET_LIST_SCHEDULE_LOG,
    MESSAGE.GET_LIST_SCHEDULE_LOG_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortField, scheduleId } = payload;
      const [res, err] = await scheduleLogDB.getListScheduleLog({
        page,
        pageSize,
        searchText,
        sortField,
        scheduleId,
      });
      event.reply(MESSAGE.GET_LIST_SCHEDULE_LOG_RES, {
        data: res,
        error: err?.message,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_SCHEDULE_LOG,
    MESSAGE.DELETE_SCHEDULE_LOG_RES,
    async (event, payload) => {
      const listId: number[] = payload?.data;

      const [res, err] = await scheduleLogDB.deleteScheduleLog(listId);
      event.reply(MESSAGE.DELETE_SCHEDULE_LOG_RES, {
        data: res,
        error: err?.message,
      });
    },
  );
};
