import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IResourceGroup, ISorter } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface IResourceGroupState {
  listResourceGroup: IResourceGroup[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedResourceGroup: IResourceGroup | null;
  sortField: ISorter | {};
}

const initialState: IResourceGroupState = {
  listResourceGroup: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedResourceGroup: null,
  sortField: {},
};

export const resourceGroupSlice = createSlice({
  name: "ResourceGroup",
  initialState,
  reducers: {
    actSaveGetListResourceGroup: (
      state: IResourceGroupState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listResourceGroup = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedResourceGroup: (
      state: IResourceGroupState,
      action: PayloadAction<IResourceGroup | null>,
    ) => {
      state.selectedResourceGroup = action.payload;
    },
    actSaveCreateResourceGroup: (
      state: IResourceGroupState,
      action: PayloadAction<IResourceGroup>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listResourceGroup);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listResourceGroup = newListData;
    },
    actSaveUpdateResourceGroup: (
      state: IResourceGroupState,
      action: PayloadAction<IResourceGroup>,
    ) => {
      const { payload } = action;

      state.listResourceGroup = updateOrDelete(
        payload?.id!,
        state?.listResourceGroup,
        payload,
      );
    },
    actSaveDeleteResourceGroup: (
      state: IResourceGroupState,
      action: PayloadAction<IResourceGroup>,
    ) => {
      const { payload } = action;

      state.listResourceGroup = updateOrDelete(
        payload?.id!,
        state?.listResourceGroup,
      );
    },
    actSetSortField: (
      state: IResourceGroupState,
      action: PayloadAction<ISorter | null>,
    ) => {
      const { payload } = action;
      state.sortField = { ...state.sortField, ...payload };
    },
    actSetPageSize: (
      state: IResourceGroupState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const {
  actSaveGetListResourceGroup,
  actSaveSelectedResourceGroup,
  actSaveCreateResourceGroup,
  actSaveUpdateResourceGroup,
  actSaveDeleteResourceGroup,
  actSetSortField,
  actSetPageSize,
} = resourceGroupSlice.actions;
export const resourceGroupSelector = (state: RootState) => state.ResourceGroup;
export default resourceGroupSlice.reducer;
