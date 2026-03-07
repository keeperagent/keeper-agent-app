import { useState } from "react";
import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import { ICampaign } from "@/electron/type";
import {
  actSaveCreateCampaign,
  actSaveGetListCampaign,
  actSaveSelectedCampaign,
  actSaveUpdateCampaign,
} from "@/redux/campaign";
import type { IpcGetListCampaignPayload } from "@/electron/ipcTypes";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";

const useGetListCampaign = () => {
  const { execute: getListCampaign, loading } =
    useIpcAction<IpcGetListCampaignPayload>(
      MESSAGE.GET_LIST_CAMPAIGN,
      MESSAGE.GET_LIST_CAMPAIGN_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListCampaign(payload?.data)),
      },
    );
  return { loading, getListCampaign };
};

const useDeleteCampaign = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_CAMPAIGN,
    MESSAGE.DELETE_CAMPAIGN_RES,
  );
  const deleteCampaign = (listId: number[]) => execute({ data: listId });
  return { deleteCampaign, loading, isSuccess };
};

const useGetOneCampaign = () => {
  const [data, setData] = useState<ICampaign | null>(null);
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.GET_ONE_CAMPAIGN,
    MESSAGE.GET_ONE_CAMPAIGN_RES,
    {
      onSuccess: (payload, dispatch) => {
        setData(payload?.data);
        dispatch(actSaveSelectedCampaign(payload?.data));
      },
    },
  );
  const getOneCampaign = (id: number) => {
    setData(null);
    execute({ id });
  };
  return { loading, isSuccess, getOneCampaign, data };
};

const useSyncCampaignProfile = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.SYNC_CAMPAIGN_PROFILE,
    MESSAGE.SYNC_CAMPAIGN_PROFILE_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) {
          message.error(error);
        } else {
          message.success(translate("campaign.syncProfileSuccess"));
        }
      },
    },
  );
  const syncCampaignProfile = (campaignId: number) => execute({ campaignId });
  return { loading, isSuccess, syncCampaignProfile };
};

const useUpdateCampaign = () => {
  const [updatedData, setUpdatedData] = useState<ICampaign | null>(null);
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_CAMPAIGN,
    MESSAGE.UPDATE_CAMPAIGN_RES,
    {
      onSuccess: (payload, dispatch) => {
        dispatch(actSaveUpdateCampaign(payload?.data));
        setUpdatedData(payload?.data);
      },
    },
  );
  const updateCampaign = (data: ICampaign) => execute({ data });
  return { updateCampaign, loading, isSuccess, updatedData };
};

const useCreateCampaign = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_CAMPAIGN,
    MESSAGE.CREATE_CAMPAIGN_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveCreateCampaign(payload?.data)),
    },
  );
  const createCampaign = (data: ICampaign) => execute({ data });
  return { createCampaign, loading, isSuccess };
};

const useExportCampaignProfile = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.EXPORT_CAMPAIGN_PROFILE,
    MESSAGE.EXPORT_CAMPAIGN_PROFILE_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) {
          message?.error(error);
        } else {
          message.success(translate("hook.exportDataDone"));
        }
      },
    },
  );
  const exportCampaignProfile = ({
    folderPath,
    fileName,
    encryptKey,
    campaignId,
  }: {
    folderPath: string;
    fileName: string;
    encryptKey?: string;
    campaignId: number;
  }) => execute({ folderPath, fileName, encryptKey, campaignId });
  return { loading, isSuccess, exportCampaignProfile };
};

const useExportCampaignConfig = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.EXPORT_CAMPAIGN,
    MESSAGE.EXPORT_CAMPAIGN_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) {
          message?.error(error);
        } else {
          message.success(translate("hook.exportDataDone"));
        }
      },
    },
  );
  const exportCampaignConfig = ({
    campaignId,
    folderPath,
    fileName,
  }: {
    campaignId: number;
    folderPath: string;
    fileName: string;
  }) => execute({ folderPath, campaignId, fileName });
  return { loading, isSuccess, exportCampaignConfig };
};

const useImportCampaignConfig = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.IMPORT_CAMPAIGN,
    MESSAGE.IMPORT_CAMPAIGN_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) {
          message?.error(error);
        } else {
          message.success(translate("hook.importDataDone"));
        }
      },
    },
  );
  const importCampaignConfig = (campaignId: number, filePath: string) =>
    execute({ campaignId, filePath });
  return { loading, isSuccess, importCampaignConfig };
};

export {
  useGetListCampaign,
  useDeleteCampaign,
  useUpdateCampaign,
  useCreateCampaign,
  useGetOneCampaign,
  useSyncCampaignProfile,
  useExportCampaignProfile,
  useExportCampaignConfig,
  useImportCampaignConfig,
};
