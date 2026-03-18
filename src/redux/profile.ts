import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IProfile } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface IProfileState {
  listProfile: IProfile[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedProfile: IProfile | null;
  tableViewMode: string;
}

const initialState: IProfileState = {
  listProfile: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedProfile: null,
  tableViewMode: "",
};

export const profileSlice = createSlice({
  name: "Profile",
  initialState,
  reducers: {
    actSaveGetListProfile: (
      state: IProfileState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listProfile = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedProfile: (
      state: IProfileState,
      action: PayloadAction<IProfile | null>,
    ) => {
      state.selectedProfile = action.payload;
    },
    actSaveCreateProfile: (
      state: IProfileState,
      action: PayloadAction<IProfile>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listProfile);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listProfile = newListData;
    },
    actSaveUpdateProfile: (
      state: IProfileState,
      action: PayloadAction<IProfile>,
    ) => {
      const { payload } = action;

      state.listProfile = updateOrDelete(
        payload?.id!,
        state?.listProfile,
        payload,
      );
    },
    actSaveDeleteProfile: (
      state: IProfileState,
      action: PayloadAction<IProfile>,
    ) => {
      const { payload } = action;

      state.listProfile = updateOrDelete(payload?.id!, state?.listProfile);
    },
    actSetTableViewMode: (
      state: IProfileState,
      action: PayloadAction<string>,
    ) => {
      const { payload } = action;
      state.tableViewMode = payload;
    },
    actSetPageSize: (state: IProfileState, action: PayloadAction<number>) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const {
  actSaveGetListProfile,
  actSaveSelectedProfile,
  actSaveCreateProfile,
  actSaveUpdateProfile,
  actSaveDeleteProfile,
  actSetTableViewMode,
  actSetPageSize,
} = profileSlice.actions;
export const profileSelector = (state: RootState) => state.Profile;
export default profileSlice.reducer;
