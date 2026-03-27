import { MESSAGE } from "@/electron/constant";
import { appLogDB } from "@/electron/database/appLog";
import { onIpc } from "./helpers";

export const appLogController = () => {
  onIpc(
    MESSAGE.GET_LIST_APP_LOG,
    MESSAGE.GET_LIST_APP_LOG_RES,
    async (event: any, payload: any) => {
      const { page, pageSize, searchText, logType, scheduleId, taskId } =
        payload || {};
      const [result] = await appLogDB.getListAppLog({
        page: page || 1,
        pageSize: pageSize || 20,
        searchText,
        logType,
        scheduleId,
        taskId,
      });
      event.reply(MESSAGE.GET_LIST_APP_LOG_RES, { data: result });
    },
  );

  onIpc(
    MESSAGE.CREATE_APP_LOG,
    MESSAGE.CREATE_APP_LOG_RES,
    async (event: any, payload: any) => {
      const { data } = payload || {};
      const [result] = await appLogDB.createAppLog(data || {});
      event.reply(MESSAGE.CREATE_APP_LOG_RES, { data: result });
    },
  );

  onIpc(
    MESSAGE.DELETE_APP_LOG,
    MESSAGE.DELETE_APP_LOG_RES,
    async (event: any, payload: any) => {
      const listId: number[] = payload?.data || [];
      const [result] = await appLogDB.deleteAppLog(listId);
      event.reply(MESSAGE.DELETE_APP_LOG_RES, { data: result });
    },
  );
};
