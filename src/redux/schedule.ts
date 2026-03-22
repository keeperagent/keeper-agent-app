import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { ISchedule, ISorter } from "@/electron/type";
import { RootState } from "./store";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";

interface IScheduleState {
  listSchedule: ISchedule[];
  scheduleJobQueue: any;
  selectedSchedule: ISchedule | null;
  isModalOpen: boolean;
  totalData: number;
  pageSize: number;
  tableViewMode: string | null;
  sortField: ISorter | {};
  runningAgentScheduleIds: number[];
}

const initialState: IScheduleState = {
  listSchedule: [],
  scheduleJobQueue: [],
  selectedSchedule: null,
  isModalOpen: false,
  totalData: 0,
  pageSize: DEFAULT_PAGE_SIZE,
  tableViewMode: null,
  sortField: {},
  runningAgentScheduleIds: [],
};

export const scheduleSlice = createSlice({
  name: "Schedule",
  initialState,
  reducers: {
    actSaveGetListSchedule: (
      state: IScheduleState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listSchedule = payload?.data;
      state.totalData = payload?.data?.length;
    },
    actSaveCreateSchedule: (
      state: IScheduleState,
      action: PayloadAction<ISchedule>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listSchedule);
      newListData = [payload, ...newListData];
      state.listSchedule = newListData;
    },
    actSaveUpdateSchedule: (
      state: IScheduleState,
      action: PayloadAction<ISchedule>,
    ) => {
      const { payload } = action;
      state.listSchedule = updateOrDelete(
        payload?.id!,
        state?.listSchedule,
        payload,
      );
    },
    actSaveScheduleQueue: (
      state: IScheduleState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;

      state.scheduleJobQueue = payload;
    },
    actSaveSelectedSchedule: (
      state: IScheduleState,
      action: PayloadAction<ISchedule | null>,
    ) => {
      const { payload } = action;
      state.selectedSchedule = payload;
    },
    actSetModalOpen: (state: IScheduleState, action: PayloadAction<any>) => {
      const { payload } = action;
      state.isModalOpen = payload;
    },
    actSetTableViewMode: (
      state: IScheduleState,
      action: PayloadAction<string>,
    ) => {
      const { payload } = action;
      state.tableViewMode = payload;
    },
    actSetSortField: (
      state: IScheduleState,
      action: PayloadAction<ISorter>,
    ) => {
      const { payload } = action;
      state.sortField = { ...state.sortField, ...payload };
    },
    actSetPageSize: (state: IScheduleState, action: PayloadAction<number>) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
    actSetActiveAgentRuns: (
      state: IScheduleState,
      action: PayloadAction<number[]>,
    ) => {
      state.runningAgentScheduleIds = action.payload;
    },
  },
});

export const {
  actSaveGetListSchedule,
  actSaveScheduleQueue,
  actSaveSelectedSchedule,
  actSetModalOpen,
  actSetTableViewMode,
  actSaveCreateSchedule,
  actSaveUpdateSchedule,
  actSetSortField,
  actSetPageSize,
  actSetActiveAgentRuns,
} = scheduleSlice.actions;
export const scheduleSelector = (state: RootState) => state.Schedule;
export default scheduleSlice.reducer;
