import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { ICampaign, ISorter } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface ICampaignState {
  listCampaign: ICampaign[];
  totalData: number;
  page: number;
  pageSize: number;
  selectedCampaign: ICampaign | null;
  currentModalStep: number;
  isModalOpen: boolean;
  sortField: ISorter | {};
  tableViewMode: string;
  showProfileStatistic: boolean;
}

const initialState: ICampaignState = {
  listCampaign: [],
  totalData: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  selectedCampaign: null,
  currentModalStep: 0,
  isModalOpen: false,
  sortField: {},
  tableViewMode: "",
  showProfileStatistic: false,
};

export const campaignSlice = createSlice({
  name: "Campaign",
  initialState,
  reducers: {
    actSaveGetListCampaign: (
      state: ICampaignState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listCampaign = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedCampaign: (
      state: ICampaignState,
      action: PayloadAction<ICampaign | null>,
    ) => {
      state.selectedCampaign = action.payload;
    },
    actSaveCreateCampaign: (
      state: ICampaignState,
      action: PayloadAction<ICampaign>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listCampaign);
      newListData = [payload, ...newListData];
      state.listCampaign = newListData;
    },
    actSaveUpdateCampaign: (
      state: ICampaignState,
      action: PayloadAction<ICampaign>,
    ) => {
      const { payload } = action;

      state.listCampaign = updateOrDelete(
        payload?.id!,
        state?.listCampaign,
        payload,
      );
    },
    actSaveDeleteCampaign: (
      state: ICampaignState,
      action: PayloadAction<ICampaign>,
    ) => {
      const { payload } = action;
      const newListData = current(state.listCampaign);

      state.listCampaign = updateOrDelete(payload?.id as number, newListData);
    },
    actSetModalCampaignOpen: (
      state: ICampaignState,
      action: PayloadAction<boolean>,
    ) => {
      state.isModalOpen = action?.payload;
    },
    actSetCurrentModalStep: (
      state: ICampaignState,
      action: PayloadAction<number>,
    ) => {
      state.currentModalStep = action?.payload;
    },
    actSetSortField: (
      state: ICampaignState,
      action: PayloadAction<ISorter | null>,
    ) => {
      const { payload } = action;
      state.sortField = { ...state.sortField, ...payload };
    },
    actSetTableViewMode: (
      state: ICampaignState,
      action: PayloadAction<string>,
    ) => {
      state.tableViewMode = action?.payload;
    },
    actShowProfileStatistic: (
      state: ICampaignState,
      action: PayloadAction<boolean>,
    ) => {
      state.showProfileStatistic = action?.payload;
    },
    actSetPageSize: (state: ICampaignState, action: PayloadAction<number>) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const {
  actSaveGetListCampaign,
  actSaveSelectedCampaign,
  actSaveCreateCampaign,
  actSaveUpdateCampaign,
  actSaveDeleteCampaign,
  actSetModalCampaignOpen,
  actSetCurrentModalStep,
  actSetSortField,
  actSetTableViewMode,
  actShowProfileStatistic,
  actSetPageSize,
} = campaignSlice.actions;
export const campaignSelector = (state: RootState) => state.Campaign;
export default campaignSlice.reducer;
