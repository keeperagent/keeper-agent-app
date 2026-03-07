import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IProxyIp } from "@/electron/type";
import { updateOrDelete } from "./util";
import { RootState } from "./store";
import { DEFAULT_PAGE_SIZE, safePageSize } from "./util";

interface IProxyIpState {
  listProxyIp: IProxyIp[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedProxyIp: IProxyIp | null;
}

const initialState: IProxyIpState = {
  listProxyIp: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedProxyIp: null,
};

export const proxyIpSlice = createSlice({
  name: "ProxyIp",
  initialState,
  reducers: {
    actSaveGetListProxyIp: (
      state: IProxyIpState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listProxyIp = payload?.data;
      state.page = payload?.page;
      state.pageSize = safePageSize(payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedProxyIp: (
      state: IProxyIpState,
      action: PayloadAction<IProxyIp | null>,
    ) => {
      state.selectedProxyIp = action.payload;
    },
    actSaveCreateProxyIp: (
      state: IProxyIpState,
      action: PayloadAction<IProxyIp>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listProxyIp);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listProxyIp = newListData;
    },
    actSaveUpdateProxyIp: (
      state: IProxyIpState,
      action: PayloadAction<IProxyIp>,
    ) => {
      const { payload } = action;

      state.listProxyIp = updateOrDelete(
        payload?.id!,
        state?.listProxyIp,
        payload,
      );
    },
    actSaveDeleteProxyIp: (
      state: IProxyIpState,
      action: PayloadAction<IProxyIp>,
    ) => {
      const { payload } = action;

      state.listProxyIp = updateOrDelete(payload?.id!, state?.listProxyIp);
    },
    actSetPageSize: (state: IProxyIpState, action: PayloadAction<number>) => {
      state.pageSize = safePageSize(action.payload);
    },
  },
});

export const {
  actSaveGetListProxyIp,
  actSaveSelectedProxyIp,
  actSaveCreateProxyIp,
  actSaveUpdateProxyIp,
  actSaveDeleteProxyIp,
  actSetPageSize,
} = proxyIpSlice.actions;
export const proxyIpSelector = (state: RootState) => state.ProxyIp;
export default proxyIpSlice.reducer;
