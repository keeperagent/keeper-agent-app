import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IAppLog } from "@/electron/type";
import { RootState } from "./store";
import { DEFAULT_PAGE_SIZE, getNewPageSize } from "./util";

interface IAppLogState {
  listAppLog: IAppLog[];
  page: number;
  pageSize: number;
  totalData: number;
}

const initialState: IAppLogState = {
  listAppLog: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
};

export const appLogSlice = createSlice({
  name: "AppLog",
  initialState,
  reducers: {
    actSaveGetListAppLog: (state: IAppLogState, action: PayloadAction<any>) => {
      const { payload } = action;
      state.listAppLog = payload?.data || [];
      state.page = payload?.page || 1;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData || 0;
    },
    actSetAppLogPageSize: (
      state: IAppLogState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const { actSaveGetListAppLog, actSetAppLogPageSize } =
  appLogSlice.actions;
export const appLogSelector = (state: RootState) => state.AppLog;
export default appLogSlice.reducer;
