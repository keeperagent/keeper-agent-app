import _ from "lodash";
import { Op } from "sequelize";
import { workflowDB } from "@/electron/database/workflow";
import { campaignDB } from "@/electron/database/campaign";
import { MESSAGE } from "@/electron/constant";
import { exportWorkflow, importWorkflow } from "@/electron/service/workflow";
import { jobDB } from "@/electron/database/job";
import { ICampaign, IWorkflow } from "@/electron/type";
import { AppLogModel } from "@/electron/database";
import type {
  IpcGetListWorkflowPayload,
  IpcIdPayload,
  IpcCreateWorkflowPayload,
  IpcUpdateWorkflowPayload,
  IpcDeletePayload,
  IpcExportWorkflowPayload,
  IpcImportWorkflowPayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const runWorkflowController = () => {
  onIpc<IpcGetListWorkflowPayload>(
    MESSAGE.GET_LIST_WORKFLOW,
    MESSAGE.GET_LIST_WORKFLOW_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortField } = payload;
      let [res] = await workflowDB.getListWorkflow(
        page,
        pageSize,
        searchText,
        sortField,
      );

      const listWorkflow = res?.data || [];
      const listWorkflowId =
        listWorkflow?.map((workflow: IWorkflow) => workflow?.id!) || [];
      const [listCampaign] =
        await campaignDB.getListCampaignByWorkflowId(listWorkflowId);
      listWorkflow?.forEach((workflow: IWorkflow) => {
        let listCampaignUseWorkflow: ICampaign[] = [];
        listCampaign?.forEach((campaign: ICampaign) => {
          if (campaign?.listWorkflowId?.includes(workflow?.id!)) {
            listCampaignUseWorkflow.push({
              id: campaign?.id,
              name: campaign?.name,
              createAt: campaign?.createAt,
            });
          }
        });
        listCampaignUseWorkflow = _.sortBy(listCampaignUseWorkflow, "createAt");

        workflow.listCampaign = listCampaignUseWorkflow;
      });

      res = {
        data: listWorkflow,
        totalData: res?.totalData || 0,
        totalPage: res?.totalPage || 0,
        page: res?.page || 0,
        pageSize: res?.pageSize || 0,
      };

      event.reply(MESSAGE.GET_LIST_WORKFLOW_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcIdPayload>(
    MESSAGE.GET_ONE_WORKFLOW,
    MESSAGE.GET_ONE_WORKFLOW_RES,
    async (event, payload) => {
      const { id } = payload;
      const [res] = await workflowDB.getOneWorkflow(id);

      event.reply(MESSAGE.GET_ONE_WORKFLOW_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateWorkflowPayload>(
    MESSAGE.CREATE_WORKFLOW,
    MESSAGE.CREATE_WORKFLOW_RES,
    async (event, payload) => {
      const { requestId } = payload;
      const [res] = await workflowDB.createWorkflow(payload?.data);

      event.reply(MESSAGE.CREATE_WORKFLOW_RES, {
        data: res,
        requestId,
      });
    },
  );

  onIpc<IpcUpdateWorkflowPayload>(
    MESSAGE.UPDATE_WORKFLOW,
    MESSAGE.UPDATE_WORKFLOW_RES,
    async (event, payload) => {
      const { requestId, data } = payload;
      const [updatedWorkflow] = await workflowDB.updateWorkflow(data);
      if (!updatedWorkflow) {
        return;
      }

      const [listCampaign] = await campaignDB.getListCampaignByWorkflowId([
        updatedWorkflow?.id!,
      ]);
      let listCampaignUseWorkflow: ICampaign[] = [];
      listCampaign?.forEach((campaign: ICampaign) => {
        if (campaign?.listWorkflowId?.includes(updatedWorkflow?.id!)) {
          listCampaignUseWorkflow.push({
            id: campaign?.id,
            name: campaign?.name,
            createAt: campaign?.createAt,
          });
        }
      });
      listCampaignUseWorkflow = _.sortBy(listCampaignUseWorkflow, "createAt");
      updatedWorkflow.listCampaign = listCampaignUseWorkflow;

      event.reply(MESSAGE.UPDATE_WORKFLOW_RES, {
        data: updatedWorkflow,
        requestId,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_WORKFLOW,
    MESSAGE.DELETE_WORKFLOW_RES,
    async (event, payload) => {
      const listWorkflowId = payload?.data || [];
      await jobDB.deleteJob({
        workflowId: { [Op.in]: listWorkflowId },
      });
      await AppLogModel.destroy({
        where: {
          workflowId: { [Op.in]: listWorkflowId },
        },
      });

      const [res, err] = await workflowDB.deleteWorkflow(listWorkflowId);
      event.reply(MESSAGE.DELETE_WORKFLOW_RES, {
        data: res,
        error: err?.message,
      });
    },
  );

  onIpc<IpcExportWorkflowPayload>(
    MESSAGE.EXPORT_WORKFLOW,
    MESSAGE.EXPORT_WORKFLOW_RES,
    async (event, payload) => {
      const listWorkflowId = payload?.listWorkflowId || [];
      const { folderPath, fileName } = payload;

      const err = await exportWorkflow({
        listWorkflowId,
        folderPath,
        fileName,
      });
      event.reply(MESSAGE.EXPORT_WORKFLOW_RES, {
        error: err?.message,
      });
    },
  );

  onIpc<IpcImportWorkflowPayload>(
    MESSAGE.IMPORT_WORKFLOW,
    MESSAGE.IMPORT_WORKFLOW_RES,
    async (event, payload) => {
      const { listFilePath } = payload;

      const err = await importWorkflow(listFilePath);
      event.reply(MESSAGE.IMPORT_WORKFLOW_RES, {
        error: err?.message,
      });
    },
  );
};
