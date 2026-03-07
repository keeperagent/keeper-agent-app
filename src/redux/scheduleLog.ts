import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IScheduleLog, ISorter } from "@/electron/type";
import { RootState } from "./store";
import { DEFAULT_PAGE_SIZE, safePageSize } from "./util";

interface IScheduleLogState {
  listScheduleLog: IScheduleLog[];
  page: number;
  pageSize: number;
  totalData: number;
  sorter: ISorter;
}

const initialState: IScheduleLogState = {
  listScheduleLog: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  sorter: {
    field: "",
    order: "",
  },
};

export const scheduleLogSlice = createSlice({
  name: "ScheduleLog",
  initialState,
  reducers: {
    actSaveGetListScheduleLog: (
      state: IScheduleLogState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listScheduleLog = payload?.data;
      state.page = payload?.page;
      state.pageSize = safePageSize(payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSetSorter: (
      state: IScheduleLogState,
      action: PayloadAction<ISorter>,
    ) => {
      const { payload } = action;
      state.sorter = payload;
    },
    actSetPageSize: (
      state: IScheduleLogState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = safePageSize(action.payload);
    },
  },
});

export const { actSaveGetListScheduleLog, actSetSorter, actSetPageSize } =
  scheduleLogSlice.actions;
export const scheduleLogSelector = (state: RootState) => state.ScheduleLog;
export default scheduleLogSlice.reducer;
