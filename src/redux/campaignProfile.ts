import _ from "lodash";
import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { ICampaignProfile, ICampaignProfileColumn } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

export interface IStatus {
  totalProfile: number;
  totalUnFinishedProfile: number;
}
interface ICampaignProfileState {
  listCampaignProfile: ICampaignProfile[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedCampaignProfile: ICampaignProfile | null;
  status: IStatus;
  calculatedValue: string;
  mapOpenProfileId: { [key: number]: boolean };
  listColumnStats: ICampaignProfileColumn[];
}

const initialState: ICampaignProfileState = {
  listCampaignProfile: [],
  totalData: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  selectedCampaignProfile: null,
  status: { totalProfile: 0, totalUnFinishedProfile: 0 },
  calculatedValue: "",
  mapOpenProfileId: {},
  listColumnStats: [],
};

export const campaignProfileSlice = createSlice({
  name: "CampaignProfile",
  initialState,
  reducers: {
    actSaveGetListCampaignProfile: (
      state: ICampaignProfileState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listCampaignProfile = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedCampaignProfile: (
      state: ICampaignProfileState,
      action: PayloadAction<ICampaignProfile | null>,
    ) => {
      state.selectedCampaignProfile = action.payload;
    },
    actSaveCreateCampaignProfile: (
      state: ICampaignProfileState,
      action: PayloadAction<ICampaignProfile>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listCampaignProfile);
      newListData = [payload, ...newListData];
      state.listCampaignProfile = newListData;
    },
    actSaveUpdateCampaignProfile: (
      state: ICampaignProfileState,
      action: PayloadAction<ICampaignProfile>,
    ) => {
      const { payload } = action;

      state.listCampaignProfile = updateOrDelete(
        payload?.id!,
        state?.listCampaignProfile,
        payload,
      );
    },
    actSaveDeleteCampaignProfile: (
      state: ICampaignProfileState,
      action: PayloadAction<ICampaignProfile>,
    ) => {
      const { payload } = action;
      const newListData = current(state.listCampaignProfile);

      state.listCampaignProfile = updateOrDelete(
        payload?.id as number,
        newListData,
      );
    },
    actSaveCampaignProfileStatus: (
      state: ICampaignProfileState,
      action: PayloadAction<IStatus>,
    ) => {
      const { payload } = action;
      state.status = {
        totalProfile: payload?.totalProfile,
        totalUnFinishedProfile: payload?.totalUnFinishedProfile,
      };
    },
    actSaveCalculatedValue: (
      state: ICampaignProfileState,
      action: PayloadAction<string>,
    ) => {
      state.calculatedValue = action.payload;
    },
    actSetMapOpenProfileId: (
      state: ICampaignProfileState,
      action: PayloadAction<{ [key: number]: boolean }>,
    ) => {
      if (_.isEmpty(action.payload)) {
        state.mapOpenProfileId = {};
      } else {
        state.mapOpenProfileId = {
          ...state.mapOpenProfileId,
          ...action.payload,
        };
      }
    },
    actSetListColumnStats: (
      state: ICampaignProfileState,
      action: PayloadAction<ICampaignProfileColumn[]>,
    ) => {
      state.listColumnStats = action.payload;
    },
    actSetPageSize: (
      state: ICampaignProfileState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const {
  actSaveGetListCampaignProfile,
  actSaveSelectedCampaignProfile,
  actSaveCreateCampaignProfile,
  actSaveUpdateCampaignProfile,
  actSaveDeleteCampaignProfile,
  actSaveCampaignProfileStatus,
  actSaveCalculatedValue,
  actSetMapOpenProfileId,
  actSetListColumnStats,
  actSetPageSize,
} = campaignProfileSlice.actions;
export const campaignProfileSelector = (state: RootState) =>
  state.CampaignProfile;
export default campaignProfileSlice.reducer;
