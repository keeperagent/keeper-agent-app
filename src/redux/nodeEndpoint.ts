import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { INodeEndpoint } from "@/electron/type";
import { updateOrDelete } from "./util";
import { RootState } from "./store";
import { DEFAULT_PAGE_SIZE, safePageSize } from "./util";

interface INodeEndpointState {
  listNodeEndpoint: INodeEndpoint[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedNodeEndpoint: INodeEndpoint | null;
}

const initialState: INodeEndpointState = {
  listNodeEndpoint: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedNodeEndpoint: null,
};

export const nodeEndpointSlice = createSlice({
  name: "NodeEndpoint",
  initialState,
  reducers: {
    actSaveGetListNodeEndpoint: (
      state: INodeEndpointState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listNodeEndpoint = payload?.data;
      state.page = payload?.page;
      state.pageSize = safePageSize(payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedNodeEndpoint: (
      state: INodeEndpointState,
      action: PayloadAction<INodeEndpoint | null>,
    ) => {
      state.selectedNodeEndpoint = action.payload;
    },
    actSaveCreateNodeEndpoint: (
      state: INodeEndpointState,
      action: PayloadAction<INodeEndpoint>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listNodeEndpoint);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listNodeEndpoint = newListData;
    },
    actSaveUpdateNodeEndpoint: (
      state: INodeEndpointState,
      action: PayloadAction<INodeEndpoint>,
    ) => {
      const { payload } = action;

      state.listNodeEndpoint = updateOrDelete(
        payload?.id!,
        state?.listNodeEndpoint,
        payload,
      );
    },
    actSaveDeleteNodeEndpoint: (
      state: INodeEndpointState,
      action: PayloadAction<INodeEndpoint>,
    ) => {
      const { payload } = action;

      state.listNodeEndpoint = updateOrDelete(
        payload?.id!,
        state?.listNodeEndpoint,
      );
    },
    actSetPageSize: (
      state: INodeEndpointState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = safePageSize(action.payload);
    },
  },
});

export const {
  actSaveGetListNodeEndpoint,
  actSaveSelectedNodeEndpoint,
  actSaveCreateNodeEndpoint,
  actSaveUpdateNodeEndpoint,
  actSaveDeleteNodeEndpoint,
  actSetPageSize,
} = nodeEndpointSlice.actions;
export const nodeEndpointSelector = (state: RootState) => state.NodeEndpoint;
export default nodeEndpointSlice.reducer;
