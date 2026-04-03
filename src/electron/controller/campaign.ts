import _ from "lodash";
import { Op } from "sequelize";
import { uid } from "uid/secure";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { campaignDB } from "@/electron/database/campaign";
import { profileDB } from "@/electron/database/profile";
import { staticProxyDB } from "@/electron/database/staticProxy";
import { sleep } from "@/electron/service/util";
import {
  exportCampaignConfig,
  importCampaignConfig,
} from "@/electron/service/campaign";
import { exportCampaignProfile } from "@/electron/service/campaignProfile";
import { deleteFolder } from "@/electron/service/file";
import { MESSAGE, PROFILE_TYPE } from "@/electron/constant";
import {
  AppLogType,
  ICampaign,
  ICampaignProfile,
  IJob,
  IProfile,
  IStaticProxy,
  IWorkflow,
} from "@/electron/type";
import { jobDB } from "@/electron/database/job";
import { AppLogModel } from "@/electron/database";
import { onIpc } from "./helpers";
import type {
  IpcCreateCampaignPayload,
  IpcDeletePayload,
  IpcExportCampaignPayload,
  IpcExportCampaignProfilePayload,
  IpcGetListCampaignPayload,
  IpcIdPayload,
  IpcImportCampaignPayload,
  IpcUpdateCampaignPayload,
} from "@/electron/ipcTypes";

export const campaignController = () => {
  onIpc<IpcGetListCampaignPayload>(
    MESSAGE.GET_LIST_CAMPAIGN,
    MESSAGE.GET_LIST_CAMPAIGN_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortField } = payload;
      const [res] = await campaignDB.getListCampaign(
        page,
        pageSize,
        searchText,
        sortField,
      );

      const listJobQuery: IJob[] = [];
      let listCampaign = res?.data || [];
      listCampaign?.forEach((campaign: ICampaign) => {
        campaign?.listWorkflowId?.forEach((workflowId: number) => {
          listJobQuery.push({
            campaignId: campaign?.id,
            workflowId,
          });
        });
      });
      const [listJob] = await jobDB.getAllJob(listJobQuery);

      listCampaign = listCampaign?.map((campaign) => {
        const listWorkflowWithTime: IWorkflow[] = [];
        campaign?.listWorkflow?.forEach((workflow: IWorkflow) => {
          const job = _.find(listJob, {
            campaignId: campaign?.id,
            workflowId: workflow?.id,
          });
          if (job) {
            workflow.lastRunTime = job?.lastRunTime || 0;
            workflow.lastEndTime = job?.lastEndTime || 0;
          }
          listWorkflowWithTime.push(workflow);
        });

        campaign.listWorkflow = listWorkflowWithTime;
        return campaign;
      });

      event.reply(MESSAGE.GET_LIST_CAMPAIGN_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcIdPayload>(
    MESSAGE.GET_ONE_CAMPAIGN,
    MESSAGE.GET_ONE_CAMPAIGN_RES,
    async (event, payload) => {
      const { id } = payload;
      const [res] = await campaignDB.getOneCampaign(id);

      event.reply(MESSAGE.GET_ONE_CAMPAIGN_RES, {
        data: res,
      });
    },
  );

  onIpc<{ campaignId: number }>(
    MESSAGE.SYNC_CAMPAIGN_PROFILE,
    MESSAGE.SYNC_CAMPAIGN_PROFILE_RES,
    async (event, payload) => {
      const { campaignId } = payload;
      const [campaign, err] = await campaignDB.getOneCampaign(campaignId);
      if (err || !campaign) {
        event.reply(MESSAGE.SYNC_CAMPAIGN_PROFILE_RES, {
          error: err?.message,
        });
      }
      const { isUseProxy, proxyGroupId, profileGroupId } = campaign || {};

      let listStaticProxy: IStaticProxy[] = [];
      if (isUseProxy && proxyGroupId) {
        [listStaticProxy] =
          await staticProxyDB.getListStaticProxyInGroup(proxyGroupId);
      }

      await initCampaignProfile(profileGroupId!, listStaticProxy, campaignId);
      event.reply(MESSAGE.SYNC_CAMPAIGN_PROFILE_RES, {});
    },
  );

  onIpc<IpcExportCampaignProfilePayload>(
    MESSAGE.EXPORT_CAMPAIGN_PROFILE,
    MESSAGE.EXPORT_CAMPAIGN_PROFILE_RES,
    async (event, payload) => {
      const { campaignId, folderPath, fileName, encryptKey } = payload;
      const err = await exportCampaignProfile({
        campaignId,
        folderPath,
        fileName,
        encryptKey,
      });

      event.reply(MESSAGE.EXPORT_CAMPAIGN_PROFILE_RES, {
        error: err?.message,
      });
    },
  );

  onIpc<IpcCreateCampaignPayload>(
    MESSAGE.CREATE_CAMPAIGN,
    MESSAGE.CREATE_CAMPAIGN_RES,
    async (event, payload) => {
      const campaign = payload?.data as ICampaign;
      let [res] = await campaignDB.createCampaign(campaign);
      const { proxyGroupId, isUseProxy, profileGroupId } = campaign;

      let listStaticProxy: IStaticProxy[] = [];
      if (isUseProxy && proxyGroupId) {
        [listStaticProxy] =
          await staticProxyDB.getListStaticProxyInGroup(proxyGroupId);
      }

      // create CampaignProfile
      await initCampaignProfile(profileGroupId!, listStaticProxy, res?.id!);
      [res] = await campaignDB.getOneCampaign(res?.id!);

      event.reply(MESSAGE.CREATE_CAMPAIGN_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcUpdateCampaignPayload>(
    MESSAGE.UPDATE_CAMPAIGN,
    MESSAGE.UPDATE_CAMPAIGN_RES,
    async (event, payload) => {
      const campaign = payload?.data as ICampaign;
      const [res] = await campaignDB.updateCampaign({
        ...campaign,
        listColumnForCalculate: JSON.stringify(
          campaign?.listColumnForCalculate || [],
        ),
      });

      if (campaign.profileType === PROFILE_TYPE.CUSTOM_SELECT) {
        await campaignProfileDB.updateActiveStatus([], false, campaign?.id!);
        await campaignProfileDB.updateActiveStatus(
          campaign?.listCampaignProfileId || [],
          true,
          campaign?.id!,
        );
      }

      event.reply(MESSAGE.UPDATE_CAMPAIGN_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_CAMPAIGN,
    MESSAGE.DELETE_CAMPAIGN_RES,
    async (event, payload) => {
      const listCampaignID = payload?.data;

      // count total profile need to delete
      const [listCount] = await campaignProfileDB.countTotalCampaignProfile(
        listCampaignID,
        false,
      );
      let totalProfile = 0;
      listCount?.forEach((countByCampaign) => {
        totalProfile += countByCampaign?.count || 0;
      });

      // delete profile folder
      const chunkSize = 100;
      let totalDeletedFolder = 0;
      await sleep(2000);
      for (let i = 0; i < listCampaignID?.length; i++) {
        const [listProfileId] =
          await campaignProfileDB.getListCampaignProfileIdByCampaign(
            listCampaignID[i],
          );
        const listIdChunk = _.chunk(listProfileId, chunkSize);

        for (let j = 0; j < listIdChunk?.length; j++) {
          const idChunk = listIdChunk[j];
          const [listProfileRes] =
            await campaignProfileDB.getListCampaignProfile({
              page: 1,
              pageSize: idChunk?.length,
              listId: idChunk,
            });
          const listCampaignProfile =
            listProfileRes?.data as ICampaignProfile[];

          for (let k = 0; k < listCampaignProfile?.length; k++) {
            const profileFolder = listCampaignProfile[k]?.profileFolderPath;
            if (!profileFolder) {
              continue;
            }
            await deleteFolder(profileFolder);
          }

          const progressPercentage = Math.round(
            (idChunk?.length / totalProfile) * 100,
          );
          totalDeletedFolder += idChunk?.length;
          if (progressPercentage > 1) {
            event.reply(MESSAGE.DELETE_PROFILE_FOLDER_PROGRESS_RES, {
              data: Math.round((totalDeletedFolder / totalProfile) * 100),
            });
          }
        }
      }

      // delete profile
      await sleep(2000);
      let totalDeletedProfile = 0;
      for (let i = 0; i < listCampaignID?.length; i++) {
        const [listProfileId] =
          await campaignProfileDB.getListCampaignProfileIdByCampaign(
            listCampaignID[i],
          );
        const listIdChunk = _.chunk(listProfileId, chunkSize);

        for (let i = 0; i < listIdChunk?.length; i++) {
          const idChunk = listIdChunk[i];
          await campaignProfileDB.deleteCampaignProfile(idChunk);
          const progressPercentage = Math.round(
            (idChunk?.length / totalProfile) * 100,
          );
          totalDeletedProfile += idChunk?.length;
          if (progressPercentage > 1) {
            event.reply(MESSAGE.DELETE_CAMPAIGN_PROFILE_PROGRESS_RES, {
              data: Math.round((totalDeletedProfile / totalProfile) * 100),
            });
          }
        }
      }

      await sleep(2000);
      const deleteJobErr = await jobDB.deleteJob({
        campaignId: { [Op.in]: listCampaignID },
      });
      await AppLogModel.destroy({
        where: {
          campaignId: { [Op.in]: listCampaignID },
          logType: AppLogType.SCHEDULE,
        },
      });
      if (deleteJobErr) {
        event.reply(MESSAGE.DELETE_CAMPAIGN_RES, {
          error: deleteJobErr?.message,
        });
        return;
      }
      event.reply(MESSAGE.DELETE_JOB_RELATED_TO_CAMPAIGN_RES, {
        data: true,
      });

      await sleep(2000);
      const [res, err] = await campaignDB.deleteCampaign(listCampaignID);
      if (err) {
        event.reply(MESSAGE.DELETE_CAMPAIGN_RES, {
          error: err?.message,
        });
        return;
      }

      event.reply(MESSAGE.DELETE_CAMPAIGN_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcExportCampaignPayload>(
    MESSAGE.EXPORT_CAMPAIGN,
    MESSAGE.EXPORT_CAMPAIGN_RES,
    async (event, payload) => {
      const { campaignId, folderPath, fileName } = payload;

      const err = await exportCampaignConfig(campaignId, folderPath, fileName);
      event.reply(MESSAGE.EXPORT_CAMPAIGN_RES, {
        error: err?.message,
      });
    },
  );

  onIpc<IpcImportCampaignPayload>(
    MESSAGE.IMPORT_CAMPAIGN,
    MESSAGE.IMPORT_CAMPAIGN_RES,
    async (event, payload) => {
      const { campaignId, filePath } = payload;

      const err = await importCampaignConfig(campaignId, filePath);
      event.reply(MESSAGE.IMPORT_CAMPAIGN_RES, {
        error: err?.message,
      });
    },
  );
};

const initCampaignProfile = async (
  profileGroupId: number,
  listStaticProxy: IStaticProxy[],
  campaignId: number,
) => {
  const batchSize = 1000;
  const page = 1;
  let currentStaticProxyIndex = 0;
  const [res1] = await profileDB.getListProfile(
    page,
    batchSize,
    undefined,
    profileGroupId,
  );
  let [allCampaignProfile] =
    await campaignProfileDB.getAllProfileOfCampaign(campaignId);
  allCampaignProfile = allCampaignProfile || [];
  const listNewCampaignProfile: any[] = [];

  const { totalPage = 0 } = res1 || {};
  for (let i = page; i <= totalPage; i++) {
    const [res2] = await profileDB.getListProfile(
      i,
      batchSize,
      undefined,
      profileGroupId,
    );

    const { data } = res2 || {};
    const batchCampaignProfile: ICampaignProfile[] = [];
    data
      ?.map((profile: IProfile) =>
        _.omit(profile, [
          "id",
          "createAt",
          "updateAt",
          "wallet",
          "listResource",
          "group",
        ]),
      )

      ?.forEach((profile: IProfile) => {
        const profileFolder = uid(25);
        let campaignProfile: ICampaignProfile = {
          ...profile,
          campaignId,
          round: 0,
          profileFolder,
          isActive: true,
        };

        if (listStaticProxy.length > 0) {
          const proxyId = listStaticProxy[currentStaticProxyIndex]?.id;
          if (proxyId !== undefined) {
            campaignProfile = {
              ...campaignProfile,
              proxyId,
            };
          }

          currentStaticProxyIndex += 1;
          if (currentStaticProxyIndex === listStaticProxy.length) {
            currentStaticProxyIndex = 0; // reset
          }
        }

        // CampaignProfile need to be unique in each Campaign
        const listProfileToCompare = [
          ...allCampaignProfile!,
          ...listNewCampaignProfile,
        ];
        const existedProfiles = listProfileToCompare.filter(
          (profileToCompare: any) => {
            return (
              profileToCompare?.walletId === campaignProfile?.walletId &&
              profileToCompare?.walletGroupId ===
                campaignProfile?.walletGroupId &&
              _.isEqual(
                profileToCompare?.listResourceId,
                campaignProfile?.listResourceId,
              )
            );
          },
        );
        const isExist = existedProfiles?.length > 0;
        if (!isExist) {
          batchCampaignProfile.push(campaignProfile);
          listNewCampaignProfile.push(listNewCampaignProfile);
        }
      });

    await campaignProfileDB.createBulkCampaignProfile(batchCampaignProfile);
  }
};
