import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IProxyIpGroup } from "@/electron/type";
import { updateOrDelete } from "./util";
import { RootState } from "./store";
import { DEFAULT_PAGE_SIZE, safePageSize } from "./util";

interface IProxyIpGroupState {
  listProxyIpGroup: IProxyIpGroup[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedProxyIpGroup: IProxyIpGroup | null;
}

const initialState: IProxyIpGroupState = {
  listProxyIpGroup: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedProxyIpGroup: null,
};

export const proxyIpGroupSlice = createSlice({
  name: "ProxyIpGroup",
  initialState,
  reducers: {
    actSaveGetListProxyIpGroup: (
      state: IProxyIpGroupState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listProxyIpGroup = payload?.data;
      state.page = payload?.page;
      state.pageSize = safePageSize(payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedProxyIpGroup: (
      state: IProxyIpGroupState,
      action: PayloadAction<IProxyIpGroup | null>,
    ) => {
      state.selectedProxyIpGroup = action.payload;
    },
    actSaveCreateProxyIpGroup: (
      state: IProxyIpGroupState,
      action: PayloadAction<IProxyIpGroup>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listProxyIpGroup);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listProxyIpGroup = newListData;
    },
    actSaveUpdateProxyIpGroup: (
      state: IProxyIpGroupState,
      action: PayloadAction<IProxyIpGroup>,
    ) => {
      const { payload } = action;

      state.listProxyIpGroup = updateOrDelete(
        payload?.id!,
        state?.listProxyIpGroup,
        payload,
      );
    },
    actSaveDeleteProxyIpGroup: (
      state: IProxyIpGroupState,
      action: PayloadAction<IProxyIpGroup>,
    ) => {
      const { payload } = action;

      state.listProxyIpGroup = updateOrDelete(
        payload?.id!,
        state?.listProxyIpGroup,
      );
    },
    actSetPageSize: (
      state: IProxyIpGroupState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = safePageSize(action.payload);
    },
  },
});

export const {
  actSaveGetListProxyIpGroup,
  actSaveSelectedProxyIpGroup,
  actSaveCreateProxyIpGroup,
  actSaveUpdateProxyIpGroup,
  actSaveDeleteProxyIpGroup,
  actSetPageSize,
} = proxyIpGroupSlice.actions;
export const proxyIpGroupSelector = (state: RootState) => state.ProxyIpGroup;
export default proxyIpGroupSlice.reducer;
