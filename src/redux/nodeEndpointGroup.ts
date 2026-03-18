import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { INodeEndpointGroup } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface INodeEndpointGroupState {
  listNodeEndpointGroup: INodeEndpointGroup[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedNodeEndpointGroup: INodeEndpointGroup | null;
}

const initialState: INodeEndpointGroupState = {
  listNodeEndpointGroup: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedNodeEndpointGroup: null,
};

export const nodeEndpointGroupSlice = createSlice({
  name: "NodeEndpointGroup",
  initialState,
  reducers: {
    actSaveGetListNodeEndpointGroup: (
      state: INodeEndpointGroupState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listNodeEndpointGroup = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedNodeEndpointGroup: (
      state: INodeEndpointGroupState,
      action: PayloadAction<INodeEndpointGroup | null>,
    ) => {
      state.selectedNodeEndpointGroup = action.payload;
    },
    actSaveCreateNodeEndpointGroup: (
      state: INodeEndpointGroupState,
      action: PayloadAction<INodeEndpointGroup>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listNodeEndpointGroup);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listNodeEndpointGroup = newListData;
    },
    actSaveUpdateNodeEndpointGroup: (
      state: INodeEndpointGroupState,
      action: PayloadAction<INodeEndpointGroup>,
    ) => {
      const { payload } = action;

      state.listNodeEndpointGroup = updateOrDelete(
        payload?.id!,
        state?.listNodeEndpointGroup,
        payload,
      );
    },
    actSaveDeleteNodeEndpointGroup: (
      state: INodeEndpointGroupState,
      action: PayloadAction<INodeEndpointGroup>,
    ) => {
      const { payload } = action;

      state.listNodeEndpointGroup = updateOrDelete(
        payload?.id!,
        state?.listNodeEndpointGroup,
      );
    },
    actSetPageSize: (
      state: INodeEndpointGroupState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const {
  actSaveGetListNodeEndpointGroup,
  actSaveSelectedNodeEndpointGroup,
  actSaveCreateNodeEndpointGroup,
  actSaveUpdateNodeEndpointGroup,
  actSaveDeleteNodeEndpointGroup,
  actSetPageSize,
} = nodeEndpointGroupSlice.actions;
export const nodeEndpointGroupSelector = (state: RootState) =>
  state.NodeEndpointGroup;
export default nodeEndpointGroupSlice.reducer;
