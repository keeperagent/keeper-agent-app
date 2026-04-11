import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { ISetting, IGetListResponse } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface ISettingState {
  listSetting: ISetting[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedSetting: ISetting | null;
}

const initialState: ISettingState = {
  listSetting: [],
  totalData: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  selectedSetting: null,
};

export const settingSlice = createSlice({
  name: "Setting",
  initialState,
  reducers: {
    actSaveGetListSetting: (
      state: ISettingState,
      action: PayloadAction<IGetListResponse<ISetting>>,
    ) => {
      const { payload } = action;
      state.listSetting = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveCreateSetting: (
      state: ISettingState,
      action: PayloadAction<ISetting>,
    ) => {
      const payload = action.payload;
      const list = current(state.listSetting);
      state.listSetting = [payload, ...list];
    },
    actSaveUpdateSetting: (
      state: ISettingState,
      action: PayloadAction<ISetting>,
    ) => {
      const payload = action.payload;
      state.listSetting = updateOrDelete(
        payload?.id!,
        state.listSetting,
        payload,
      );
    },
    actSaveDeleteSetting: (
      state: ISettingState,
      action: PayloadAction<number>,
    ) => {
      const id = action.payload;
      state.listSetting = updateOrDelete(id, state.listSetting);
    },
    actSaveSelectedSetting: (
      state: ISettingState,
      action: PayloadAction<ISetting | null>,
    ) => {
      state.selectedSetting = action.payload;
    },
  },
});

export const {
  actSaveGetListSetting,
  actSaveCreateSetting,
  actSaveUpdateSetting,
  actSaveDeleteSetting,
  actSaveSelectedSetting,
} = settingSlice.actions;
export const settingSelector = (state: RootState) => state.Setting;
export default settingSlice.reducer;
