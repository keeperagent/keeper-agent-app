import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { MESSAGE, RESPONSE_CODE, NUMBER_OF_COLUMN } from "@/electron/constant";
import { decryptCampaignProfile } from "@/electron/service/campaignProfile";
import {
  deleteProfileFoldersByIds,
  deleteProfileRecordsByIds,
} from "@/electron/service/campaignProfileCleanup";
import { ICampaignProfile, ICampaignProfileColumn } from "@/electron/type";
import { workflowManager } from "@/electron/simulator/workflow";
import { workflowDB } from "@/electron/database/workflow";
import { campaignDB } from "@/electron/database/campaign";
import { onIpc } from "./helpers";
import type {
  IpcCloseCampaignProfilePayload,
  IpcDeletePayload,
  IpcGetCampaignProfileCalculatedValuePayload,
  IpcGetCampaignProfileColumnStatsPayload,
  IpcGetCampaignProfileStatusPayload,
  IpcGetListCampaignProfilePayload,
  IpcOpenCampaignProfilePayload,
  IpcUpdateCampaignProfilePayload,
  IpcUpdateListCampaignProfilePayload,
} from "@/electron/ipcTypes";

export const campaignProfileController = () => {
  onIpc<IpcGetListCampaignProfilePayload>(
    MESSAGE.GET_LIST_CAMPAIGN_PROFILE,
    MESSAGE.GET_LIST_CAMPAIGN_PROFILE_RES,
    async (event, payload) => {
      const {
        page,
        pageSize,
        searchText,
        campaignId,
        isRunning,
        encryptKey,
        sortField,
      } = payload;
      const [res] = await campaignProfileDB.getListCampaignProfile({
        page,
        pageSize,
        searchText,
        campaignId,
        isRunning,
        encryptKey,
        sortField,
      });

      let listData = res?.data;
      if (encryptKey) {
        listData = listData?.map((profile: ICampaignProfile) =>
          decryptCampaignProfile(profile, encryptKey),
        );
      }

      event.reply(MESSAGE.GET_LIST_CAMPAIGN_PROFILE_RES, {
        data: { ...res, data: listData },
      });
    },
  );

  onIpc<IpcUpdateCampaignProfilePayload>(
    MESSAGE.UPDATE_CAMPAIGN_PROFILE,
    MESSAGE.UPDATE_CAMPAIGN_PROFILE_RES,
    async (event, payload) => {
      const { requestId, data, encryptKey } = payload;
      let [res] = await campaignProfileDB.updateCampaignProfile(data);

      if (encryptKey && res) {
        res = decryptCampaignProfile(res, encryptKey);
      }

      event.reply(MESSAGE.UPDATE_CAMPAIGN_PROFILE_RES, {
        data: res,
        requestId,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_CAMPAIGN_PROFILE,
    MESSAGE.DELETE_CAMPAIGN_PROFILE_RES,
    async (event, payload) => {
      const listId: number[] = payload?.data || [];
      const totalProfile = listId.length;

      await deleteProfileFoldersByIds(listId, totalProfile, (percent) => {
        event.reply(MESSAGE.DELETE_PROFILE_FOLDER_PROGRESS_RES, {
          data: percent,
        });
      });

      await deleteProfileRecordsByIds(listId, totalProfile, (percent) => {
        event.reply(MESSAGE.DELETE_CAMPAIGN_PROFILE_PROGRESS_RES, {
          data: percent,
        });
      });

      event.reply(MESSAGE.DELETE_CAMPAIGN_PROFILE_RES, {
        data: true,
      });
    },
  );

  onIpc<IpcUpdateListCampaignProfilePayload>(
    MESSAGE.UPDATE_LIST_CAMPAIGN_PROFILE,
    MESSAGE.UPDATE_LIST_CAMPAIGN_PROFILE_RES,
    async (event, payload) => {
      const { listID, profile, resetAll, campaignId } = payload;
      const err = await campaignProfileDB.updateListCampaignProfile(
        resetAll,
        listID,
        profile,
        campaignId,
      );
      if (err) {
        event.reply(MESSAGE.UPDATE_LIST_CAMPAIGN_PROFILE_RES, {
          code: RESPONSE_CODE.ERROR,
        });
        return;
      }

      event.reply(MESSAGE.UPDATE_LIST_CAMPAIGN_PROFILE_RES, {
        code: RESPONSE_CODE.SUCCESS,
      });
    },
  );

  onIpc<IpcOpenCampaignProfilePayload>(
    MESSAGE.OPEN_CAMPAIGN_PROFILE_IN_BROWSER,
    MESSAGE.OPEN_CAMPAIGN_PROFILE_IN_BROWSER_RES,
    async (event, payload) => {
      const { flowProfile } = payload;
      const campaignId = flowProfile?.campaignConfig?.campaignId;
      const workflow = await workflowManager.getWorkflow(0, campaignId!, 0);

      const [, err] = await workflow.executor.threadManager.getOrCreateThread({
        flowProfile,
        openBrowser: true,
      });

      if (err) {
        event.reply(MESSAGE.OPEN_CAMPAIGN_PROFILE_IN_BROWSER_RES, {
          code: RESPONSE_CODE.ERROR,
          error: err?.message,
        });
        return;
      }

      workflow.monitor.setProfileIdOpenInBrowser(
        flowProfile?.profile?.id!,
        true,
      );
      event.reply(MESSAGE.OPEN_CAMPAIGN_PROFILE_IN_BROWSER_RES, {
        code: RESPONSE_CODE.SUCCESS,
      });
    },
  );

  onIpc<IpcCloseCampaignProfilePayload>(
    MESSAGE.CLOSE_CAMPAIGN_PROFILE_IN_BROWSER,
    MESSAGE.CLOSE_CAMPAIGN_PROFILE_IN_BROWSER_RES,
    async (event, payload) => {
      const { flowProfile } = payload;
      const campaignId = flowProfile?.campaignConfig?.campaignId;
      const workflow = await workflowManager.getWorkflow(0, campaignId, 0);

      await workflow.executor.threadManager.stopThread(
        false,
        flowProfile?.threadID || undefined,
        campaignId,
        0,
      );

      workflow.monitor.setProfileIdOpenInBrowser(
        flowProfile?.profile?.id!,
        false,
      );
      event.reply(MESSAGE.CLOSE_CAMPAIGN_PROFILE_IN_BROWSER_RES, {
        code: RESPONSE_CODE.SUCCESS,
      });
    },
  );

  onIpc<IpcGetCampaignProfileStatusPayload>(
    MESSAGE.GET_CAMPAIGN_PROFILE_STATUS,
    MESSAGE.GET_CAMPAIGN_PROFILE_STATUS_RES,
    async (event, payload) => {
      const { campaignId, workflowId } = payload;

      let totalProfile = 0;
      let totalUnFinishedProfile = 0;
      let currentRound = 0;

      if (campaignId) {
        [totalProfile, totalUnFinishedProfile] =
          await campaignProfileDB.getCampaignProfileStatus(campaignId);
        const workflow = await workflowManager.getWorkflow(
          workflowId || 0,
          campaignId,
          0,
        );
        currentRound = workflow.monitor.currentRound;
      } else {
        const [workflowRecord] = await workflowDB.getOneWorkflow(workflowId!);
        const workflow = await workflowManager.getWorkflow(
          workflowId || 0,
          0,
          0,
        );
        currentRound = workflow.monitor.currentRound;
        [totalProfile, totalUnFinishedProfile] =
          workflow.monitor.checkFakeFlowProfileStatus(
            workflowRecord?.numberOfRound || 0,
          );
      }

      event.reply(MESSAGE.GET_CAMPAIGN_PROFILE_STATUS_RES, {
        totalProfile,
        totalUnFinishedProfile,
        currentRound,
      });
    },
  );

  onIpc<IpcGetCampaignProfileCalculatedValuePayload>(
    MESSAGE.GET_CAMPAIGN_PROFILE_CALCULATED_VALUE,
    MESSAGE.GET_CAMPAIGN_PROFILE_CALCULATED_VALUE_RES,
    async (event, payload) => {
      const {
        campaignId,
        listColumn = [],
        useProvidedColumn = false,
      } = payload;
      const [calculatedValue, err] = await campaignProfileDB.getCalculatedValue(
        campaignId,
        listColumn,
        useProvidedColumn,
      );

      if (err) {
        event.reply(MESSAGE.GET_CAMPAIGN_PROFILE_CALCULATED_VALUE_RES, {
          code: RESPONSE_CODE.ERROR,
        });
        return;
      }

      event.reply(MESSAGE.GET_CAMPAIGN_PROFILE_CALCULATED_VALUE_RES, {
        data: calculatedValue,
      });
    },
  );

  onIpc<IpcGetCampaignProfileColumnStatsPayload>(
    MESSAGE.GET_CAMPAIGN_PROFILE_COLUMN_STATS,
    MESSAGE.GET_CAMPAIGN_PROFILE_COLUMN_STATS_RES,
    async (event, payload) => {
      const { campaignId } = payload;
      const [campaign, err] = await campaignDB.getOneCampaign(campaignId);
      if (err) {
        event.reply(MESSAGE.GET_CAMPAIGN_PROFILE_COLUMN_STATS_RES, {
          code: RESPONSE_CODE.ERROR,
          message: err?.message,
        });
        return;
      }

      const listColumn: ICampaignProfileColumn[] = Array.from(
        { length: NUMBER_OF_COLUMN },
        (_, i) => {
          const num = i + 1;
          return {
            variable: (campaign as any)?.[`col${num}Variable`],
            label: (campaign as any)?.[`col${num}Label`],
            fieldName: `col${num}Value`,
          };
        },
      ).filter((column) => column?.variable && column?.label);

      const results: ICampaignProfileColumn[] = [];
      for (const column of listColumn) {
        const [calculatedValue, err] =
          await campaignProfileDB.getCalculatedValue(
            campaignId,
            [column.fieldName],
            true,
          );
        if (err || calculatedValue === "0" || !calculatedValue) {
          continue;
        }

        results.push({
          ...column,
          value: calculatedValue,
        });
      }

      event.reply(MESSAGE.GET_CAMPAIGN_PROFILE_COLUMN_STATS_RES, {
        data: results,
      });
    },
  );
};
