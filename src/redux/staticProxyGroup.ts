import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IStaticProxyGroup } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface IStaticProxyGroupState {
  listStaticProxyGroup: IStaticProxyGroup[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedStaticProxyGroup: IStaticProxyGroup | null;
}

const initialState: IStaticProxyGroupState = {
  listStaticProxyGroup: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedStaticProxyGroup: null,
};

export const staticProxyGroupSlice = createSlice({
  name: "StaticProxyGroup",
  initialState,
  reducers: {
    actSaveGetListStaticProxyGroup: (
      state: IStaticProxyGroupState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listStaticProxyGroup = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedStaticProxyGroup: (
      state: IStaticProxyGroupState,
      action: PayloadAction<IStaticProxyGroup | null>,
    ) => {
      state.selectedStaticProxyGroup = action.payload;
    },
    actSaveCreateStaticProxyGroup: (
      state: IStaticProxyGroupState,
      action: PayloadAction<IStaticProxyGroup>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listStaticProxyGroup);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listStaticProxyGroup = newListData;
    },
    actSaveUpdateStaticProxyGroup: (
      state: IStaticProxyGroupState,
      action: PayloadAction<IStaticProxyGroup>,
    ) => {
      const { payload } = action;

      state.listStaticProxyGroup = updateOrDelete(
        payload?.id!,
        state?.listStaticProxyGroup,
        payload,
      );
    },
    actSaveDeleteStaticProxyGroup: (
      state: IStaticProxyGroupState,
      action: PayloadAction<IStaticProxyGroup>,
    ) => {
      const { payload } = action;

      state.listStaticProxyGroup = updateOrDelete(
        payload?.id!,
        state?.listStaticProxyGroup,
      );
    },
    actSetPageSize: (
      state: IStaticProxyGroupState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const {
  actSaveGetListStaticProxyGroup,
  actSaveSelectedStaticProxyGroup,
  actSaveCreateStaticProxyGroup,
  actSaveUpdateStaticProxyGroup,
  actSaveDeleteStaticProxyGroup,
  actSetPageSize,
} = staticProxyGroupSlice.actions;
export const staticProxyGroupSelector = (state: RootState) =>
  state.StaticProxyGroup;
export default staticProxyGroupSlice.reducer;
