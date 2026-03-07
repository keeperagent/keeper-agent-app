import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IProfileGroup, ISorter } from "@/electron/type";
import { updateOrDelete } from "./util";
import { RootState } from "./store";
import { DEFAULT_PAGE_SIZE, safePageSize } from "./util";

interface IProfileGroupState {
  listProfileGroup: IProfileGroup[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedProfileGroup: IProfileGroup | null;
  sortField: ISorter | {};
}

const initialState: IProfileGroupState = {
  listProfileGroup: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedProfileGroup: null,
  sortField: {},
};

export const profileGroupSlice = createSlice({
  name: "ProfileGroup",
  initialState,
  reducers: {
    actSaveGetListProfileGroup: (
      state: IProfileGroupState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listProfileGroup = payload?.data;
      state.page = payload?.page;
      state.pageSize = safePageSize(payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedProfileGroup: (
      state: IProfileGroupState,
      action: PayloadAction<IProfileGroup | null>,
    ) => {
      state.selectedProfileGroup = action.payload;
    },
    actSaveCreateProfileGroup: (
      state: IProfileGroupState,
      action: PayloadAction<IProfileGroup>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listProfileGroup);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listProfileGroup = newListData;
    },
    actSaveUpdateProfileGroup: (
      state: IProfileGroupState,
      action: PayloadAction<IProfileGroup>,
    ) => {
      const { payload } = action;

      state.listProfileGroup = updateOrDelete(
        payload?.id!,
        state?.listProfileGroup,
        payload,
      );
    },
    actSaveDeleteProfileGroup: (
      state: IProfileGroupState,
      action: PayloadAction<IProfileGroup>,
    ) => {
      const { payload } = action;

      state.listProfileGroup = updateOrDelete(
        payload?.id!,
        state?.listProfileGroup,
      );
    },
    actSetSortField: (
      state: IProfileGroupState,
      action: PayloadAction<ISorter | null>,
    ) => {
      const { payload } = action;
      state.sortField = { ...state.sortField, ...payload };
    },
    actSetPageSize: (
      state: IProfileGroupState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = safePageSize(action.payload);
    },
  },
});

export const {
  actSaveGetListProfileGroup,
  actSaveSelectedProfileGroup,
  actSaveCreateProfileGroup,
  actSaveUpdateProfileGroup,
  actSaveDeleteProfileGroup,
  actSetSortField,
  actSetPageSize,
} = profileGroupSlice.actions;
export const profileGroupSelector = (state: RootState) => state.ProfileGroup;
export default profileGroupSlice.reducer;
