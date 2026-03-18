import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { ILog } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface IUserLogState {
  listLog: ILog[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedLog: ILog | null;
}

const initialState: IUserLogState = {
  listLog: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedLog: null,
};

export const userLogSlice = createSlice({
  name: "UserLog",
  initialState,
  reducers: {
    actSaveGetListUserLog: (
      state: IUserLogState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listLog = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedUserLog: (
      state: IUserLogState,
      action: PayloadAction<ILog | null>,
    ) => {
      state.selectedLog = action.payload;
    },
    actSaveCreateLog: (state: IUserLogState, action: PayloadAction<ILog>) => {
      const { payload } = action;
      let newListData = current(state.listLog);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listLog = newListData;
    },
    actSaveUpdateUserLog: (
      state: IUserLogState,
      action: PayloadAction<ILog>,
    ) => {
      const { payload } = action;

      state.listLog = updateOrDelete(payload?.id!, state?.listLog, payload);
    },
    actSaveDeleteUserLog: (
      state: IUserLogState,
      action: PayloadAction<ILog>,
    ) => {
      const { payload } = action;

      state.listLog = updateOrDelete(payload?.id!, state?.listLog);
    },
    actSetPageSize: (state: IUserLogState, action: PayloadAction<number>) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const {
  actSaveGetListUserLog,
  actSaveSelectedUserLog,
  actSaveCreateLog,
  actSaveUpdateUserLog,
  actSaveDeleteUserLog,
  actSetPageSize,
} = userLogSlice.actions;
export const userLogSelector = (state: RootState) => state.UserLog;
export default userLogSlice.reducer;
