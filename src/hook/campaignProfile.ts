import { useState } from "react";
import { useDispatch } from "react-redux";
import { message } from "antd";
import { uid } from "uid/secure";
import {
  MESSAGE,
  RESPONSE_CODE,
  UNABLE_TO_GET_PROXY,
} from "@/electron/constant";
import { ICampaignProfile, IFlowProfile } from "@/electron/type";
import {
  actSaveCampaignProfileStatus,
  actSaveGetListCampaignProfile,
  actSaveUpdateCampaignProfile,
  actSaveCalculatedValue,
  actSetListColumnStats,
} from "@/redux/campaignProfile";
import { actSetCurrentRound } from "@/redux/workflowRunner";
import { getMoneyString } from "@/service/util";
import { CLOSE_ALL_PROFILE } from "@/config/constant";
import { responseManager } from "@/service/responseManager";
import type { IpcGetListCampaignProfilePayload } from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGetListCampaignProfile = () => {
  const {
    execute: getListCampaignProfile,
    loading,
    isSuccess,
  } = useIpcAction<IpcGetListCampaignProfilePayload>(
    MESSAGE.GET_LIST_CAMPAIGN_PROFILE,
    MESSAGE.GET_LIST_CAMPAIGN_PROFILE_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetListCampaignProfile(payload?.data)),
    },
  );
  return { loading, isSuccess, getListCampaignProfile };
};

const useDeleteCampaignProfile = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_CAMPAIGN_PROFILE,
    MESSAGE.DELETE_CAMPAIGN_PROFILE_RES,
  );
  const deleteCampaignProfile = (listId: number[]) => execute({ data: listId });
  return { deleteCampaignProfile, loading, isSuccess };
};

// Uses responseManager (requestId correlation) for concurrent update safety
let isUpdateCampaignProfileRegistered = false;
let _campaignProfileUnsubscribe: (() => void) | undefined;
const useUpdateCampaignProfile = () => {
  const dispatch = useDispatch();

  const updateCampaignProfile = async (
    data: ICampaignProfile,
    encryptKey?: string,
  ): Promise<ICampaignProfile> => {
    const uniqRequestId = uid(25);
    window?.electron?.send(MESSAGE.UPDATE_CAMPAIGN_PROFILE, {
      data,
      requestId: uniqRequestId,
      encryptKey,
    });

    if (!isUpdateCampaignProfileRegistered) {
      _campaignProfileUnsubscribe = window?.electron?.on(
        MESSAGE.UPDATE_CAMPAIGN_PROFILE_RES,
        (_event: any, payload: any) => {
          const { requestId, data } = payload;
          responseManager.saveResponse(
            responseManager.getKey(
              MESSAGE.UPDATE_CAMPAIGN_PROFILE_RES,
              requestId,
            ),
            data,
          );
        },
      );
      isUpdateCampaignProfileRegistered = true;
    }

    const profile = await responseManager.getResponse(
      responseManager.getKey(
        MESSAGE.UPDATE_CAMPAIGN_PROFILE_RES,
        uniqRequestId,
      ),
    );
    dispatch(actSaveUpdateCampaignProfile(profile));
    return profile;
  };

  return { updateCampaignProfile };
};

const useUpdateListCampaignProfile = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_LIST_CAMPAIGN_PROFILE,
    MESSAGE.UPDATE_LIST_CAMPAIGN_PROFILE_RES,
  );
  const updateListCampaignProfile = ({
    listID,
    profile,
    resetAll,
    campaignId,
  }: {
    listID: number[];
    profile: ICampaignProfile;
    resetAll: boolean;
    campaignId: number;
  }) => execute({ listID, profile, resetAll, campaignId });
  return { updateListCampaignProfile, loading, isSuccess };
};

const useOpenCampaignProfileInBrowser = () => {
  const [openCampaignProfileId, setCampaignProfileId] = useState<any>(null);
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.OPEN_CAMPAIGN_PROFILE_IN_BROWSER,
    MESSAGE.OPEN_CAMPAIGN_PROFILE_IN_BROWSER_RES,
    {
      onSuccess: ({ code, error }: any) => {
        if (code === RESPONSE_CODE.ERROR) {
          if (error !== UNABLE_TO_GET_PROXY) {
            message.error(error);
          }
        }
      },
    },
  );
  const openCampaignProfileInBrowser = (flowProfile: IFlowProfile) => {
    setCampaignProfileId(flowProfile?.profile?.id);
    execute({ flowProfile });
  };
  return {
    openCampaignProfileInBrowser,
    loading,
    isSuccess,
    openCampaignProfileId,
  };
};

const useCloseCampaignProfileInBrowser = () => {
  const [closeCampaignProfileId, setCampaignProfileId] = useState<any>(null);
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CLOSE_CAMPAIGN_PROFILE_IN_BROWSER,
    MESSAGE.CLOSE_CAMPAIGN_PROFILE_IN_BROWSER_RES,
  );
  const closeCampaignProfileInBrowser = (flowProfile?: IFlowProfile) => {
    setCampaignProfileId(
      flowProfile ? flowProfile?.profile?.id : CLOSE_ALL_PROFILE,
    );
    execute({ flowProfile });
  };
  return {
    closeCampaignProfileInBrowser,
    loading,
    isSuccess,
    closeCampaignProfileId,
  };
};

const useGetCampaignProfileStatus = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.GET_CAMPAIGN_PROFILE_STATUS,
    MESSAGE.GET_CAMPAIGN_PROFILE_STATUS_RES,
    {
      onSuccess: (payload, dispatch) => {
        dispatch(
          actSaveCampaignProfileStatus({
            totalProfile: payload?.totalProfile || 0,
            totalUnFinishedProfile: payload?.totalUnFinishedProfile || 0,
          }),
        );
        dispatch(actSetCurrentRound(payload?.currentRound || 0));
      },
    },
  );
  const getCampaignProfileStatus = (campaignId: number, workflowId: number) =>
    execute({ campaignId, workflowId });
  return { loading, isSuccess, getCampaignProfileStatus };
};

const useGetCampaignProfileCalculatedValue = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.GET_CAMPAIGN_PROFILE_CALCULATED_VALUE,
    MESSAGE.GET_CAMPAIGN_PROFILE_CALCULATED_VALUE_RES,
    {
      onSuccess: (payload, dispatch) => {
        dispatch(
          actSaveCalculatedValue(getMoneyString(payload?.data!)?.toString()),
        );
      },
    },
  );
  const getCampaignProfileCalculatedValue = (
    campaignId: number,
    listColumn?: string[],
    useProvidedColumn?: boolean,
  ) => execute({ campaignId, listColumn, useProvidedColumn });
  return { loading, isSuccess, getCampaignProfileCalculatedValue };
};

const useGetCampaignProfileColumnStats = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.GET_CAMPAIGN_PROFILE_COLUMN_STATS,
    MESSAGE.GET_CAMPAIGN_PROFILE_COLUMN_STATS_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSetListColumnStats(payload?.data || [])),
    },
  );
  const getCampaignProfileColumnStats = (campaignId: number) =>
    execute({ campaignId });
  return { loading, isSuccess, getCampaignProfileColumnStats };
};

export {
  useGetListCampaignProfile,
  useDeleteCampaignProfile,
  useUpdateCampaignProfile,
  useUpdateListCampaignProfile,
  useOpenCampaignProfileInBrowser,
  useCloseCampaignProfileInBrowser,
  useGetCampaignProfileStatus,
  useGetCampaignProfileCalculatedValue,
  useGetCampaignProfileColumnStats,
};
