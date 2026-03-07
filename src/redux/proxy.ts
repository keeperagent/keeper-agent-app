import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IProxy } from "@/electron/type";
import { updateOrDelete } from "./util";
import { RootState } from "./store";
import { DEFAULT_PAGE_SIZE, safePageSize } from "./util";

interface IProxyState {
  listProxy: IProxy[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedProxy: IProxy | null;
  selectedService: string;
}

const initialState: IProxyState = {
  listProxy: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedProxy: null,
  selectedService: "",
};

export const proxySlice = createSlice({
  name: "Proxy",
  initialState,
  reducers: {
    actSaveGetListProxy: (state: IProxyState, action: PayloadAction<any>) => {
      const { payload } = action;
      state.listProxy = payload?.data;
      state.page = payload?.page;
      state.pageSize = safePageSize(payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedProxy: (
      state: IProxyState,
      action: PayloadAction<IProxy | null>,
    ) => {
      state.selectedProxy = action.payload;
    },
    actSaveCreateProxy: (state: IProxyState, action: PayloadAction<IProxy>) => {
      const { payload } = action;
      let newListData = current(state.listProxy);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listProxy = newListData;
    },
    actSaveUpdateProxy: (state: IProxyState, action: PayloadAction<IProxy>) => {
      const { payload } = action;
      state.listProxy = updateOrDelete(payload?.id!, state?.listProxy, payload);
    },
    actSaveDeleteProxy: (state: IProxyState, action: PayloadAction<IProxy>) => {
      const { payload } = action;
      state.listProxy = updateOrDelete(payload?.id!, state?.listProxy);
    },
    actSetSelectedService: (
      state: IProxyState,
      action: PayloadAction<string>,
    ) => {
      const { payload } = action;
      state.selectedService = payload;
    },
    actSetPageSize: (state: IProxyState, action: PayloadAction<number>) => {
      state.pageSize = safePageSize(action.payload);
    },
  },
});

export const {
  actSaveGetListProxy,
  actSaveSelectedProxy,
  actSaveCreateProxy,
  actSaveUpdateProxy,
  actSaveDeleteProxy,
  actSetSelectedService,
  actSetPageSize,
} = proxySlice.actions;
export const proxySelector = (state: RootState) => state.Proxy;
export default proxySlice.reducer;
