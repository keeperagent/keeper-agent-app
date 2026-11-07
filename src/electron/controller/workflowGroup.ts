import { workflowGroupDB } from "@/electron/database/workflowGroup";
import { MESSAGE } from "@/electron/constant";
import { onIpc } from "./helpers";
import type {
  IpcGetListWorkflowGroupPayload,
  IpcIdPayload,
  IpcCreateWorkflowGroupPayload,
  IpcUpdateWorkflowGroupPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";

export const runWorkflowGroupController = () => {
  onIpc<IpcGetListWorkflowGroupPayload>(
    MESSAGE.GET_LIST_WORKFLOW_GROUP,
    MESSAGE.GET_LIST_WORKFLOW_GROUP_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortField } = payload;
      const [res, err] = await workflowGroupDB.getListWorkflowGroup(
        page,
        pageSize,
        searchText,
        sortField,
      );
      if (err) {
        event.reply(MESSAGE.GET_LIST_WORKFLOW_GROUP_RES, {
          error: err?.message,
        });
        return;
      }

      event.reply(MESSAGE.GET_LIST_WORKFLOW_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcIdPayload>(
    MESSAGE.GET_ONE_WORKFLOW_GROUP,
    MESSAGE.GET_ONE_WORKFLOW_GROUP_RES,
    async (event, payload) => {
      const { id } = payload;
      const [res, err] = await workflowGroupDB.getOneWorkflowGroup(id);
      if (err) {
        event.reply(MESSAGE.GET_ONE_WORKFLOW_GROUP_RES, {
          error: err?.message,
        });
        return;
      }

      event.reply(MESSAGE.GET_ONE_WORKFLOW_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateWorkflowGroupPayload>(
    MESSAGE.CREATE_WORKFLOW_GROUP,
    MESSAGE.CREATE_WORKFLOW_GROUP_RES,
    async (event, payload) => {
      const [res, err] = await workflowGroupDB.createWorkflowGroup(
        payload?.data,
      );
      if (err) {
        event.reply(MESSAGE.CREATE_WORKFLOW_GROUP_RES, {
          error: err?.message,
        });
        return;
      }

      event.reply(MESSAGE.CREATE_WORKFLOW_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcUpdateWorkflowGroupPayload>(
    MESSAGE.UPDATE_WORKFLOW_GROUP,
    MESSAGE.UPDATE_WORKFLOW_GROUP_RES,
    async (event, payload) => {
      const [res, err] = await workflowGroupDB.updateWorkflowGroup(
        payload?.data,
      );
      if (err) {
        event.reply(MESSAGE.UPDATE_WORKFLOW_GROUP_RES, {
          error: err?.message,
        });
        return;
      }
      event.reply(MESSAGE.UPDATE_WORKFLOW_GROUP_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_WORKFLOW_GROUP,
    MESSAGE.DELETE_WORKFLOW_GROUP_RES,
    async (event, payload) => {
      const listGroupId: number[] = payload?.data;
      const [res, err] = await workflowGroupDB.deleteWorkflowGroup(listGroupId);
      if (err) {
        event.reply(MESSAGE.DELETE_WORKFLOW_GROUP_RES, {
          error: err?.message,
        });
        return;
      }

      event.reply(MESSAGE.DELETE_WORKFLOW_GROUP_RES, {
        data: res,
      });
    },
  );
};
