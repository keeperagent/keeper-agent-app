import { userLogDB } from "@/electron/database/userLog";
import { MESSAGE } from "@/electron/constant";
import type {
  IpcGetListUserLogPayload,
  IpcCreateUserLogPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const userLogController = () => {
  onIpc<IpcGetListUserLogPayload>(
    MESSAGE.GET_LIST_USER_LOG,
    MESSAGE.GET_LIST_USER_LOG_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, campaignId, workflowId } = payload;
      const [res] = await userLogDB.getListUserLog({
        page,
        pageSize,
        searchText,
        campaignId,
        workflowId,
      });
      event.reply(MESSAGE.GET_LIST_USER_LOG_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateUserLogPayload>(
    MESSAGE.CREATE_USER_LOG,
    MESSAGE.CREATE_USER_LOG_RES,
    async (event, payload) => {
      const [res] = await userLogDB.createUserLog(payload?.data);

      event.reply(MESSAGE.CREATE_USER_LOG_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_USER_LOG,
    MESSAGE.DELETE_USER_LOG_RES,
    async (event, payload) => {
      const [res] = await userLogDB.deleteUserLog(payload?.data);
      event.reply(MESSAGE.DELETE_USER_LOG_RES, {
        data: res,
      });
    },
  );
};
