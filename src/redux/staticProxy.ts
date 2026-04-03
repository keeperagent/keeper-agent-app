import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IStaticProxy } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface IStaticProxyState {
  listStaticProxy: IStaticProxy[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedStaticProxy: IStaticProxy | null;
}

const initialState: IStaticProxyState = {
  listStaticProxy: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedStaticProxy: null,
};

export const staticProxySlice = createSlice({
  name: "StaticProxy",
  initialState,
  reducers: {
    actSaveGetListStaticProxy: (
      state: IStaticProxyState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listStaticProxy = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedStaticProxy: (
      state: IStaticProxyState,
      action: PayloadAction<IStaticProxy | null>,
    ) => {
      state.selectedStaticProxy = action.payload;
    },
    actSaveCreateStaticProxy: (
      state: IStaticProxyState,
      action: PayloadAction<IStaticProxy>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listStaticProxy);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listStaticProxy = newListData;
    },
    actSaveUpdateStaticProxy: (
      state: IStaticProxyState,
      action: PayloadAction<IStaticProxy>,
    ) => {
      const { payload } = action;

      state.listStaticProxy = updateOrDelete(
        payload?.id!,
        state?.listStaticProxy,
        payload,
      );
    },
    actSaveDeleteStaticProxy: (
      state: IStaticProxyState,
      action: PayloadAction<IStaticProxy>,
    ) => {
      const { payload } = action;

      state.listStaticProxy = updateOrDelete(
        payload?.id!,
        state?.listStaticProxy,
      );
    },
    actSetPageSize: (
      state: IStaticProxyState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const {
  actSaveGetListStaticProxy,
  actSaveSelectedStaticProxy,
  actSaveCreateStaticProxy,
  actSaveUpdateStaticProxy,
  actSaveDeleteStaticProxy,
  actSetPageSize,
} = staticProxySlice.actions;
export const staticProxySelector = (state: RootState) => state.StaticProxy;
export default staticProxySlice.reducer;
