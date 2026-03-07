import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IResource } from "@/electron/type";
import { updateOrDelete } from "./util";
import { RootState } from "./store";
import { DEFAULT_PAGE_SIZE, safePageSize } from "./util";

interface IResourceState {
  listResource: IResource[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedResource: IResource | null;
}

const initialState: IResourceState = {
  listResource: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedResource: null,
};

export const resourceSlice = createSlice({
  name: "Resource",
  initialState,
  reducers: {
    actSaveGetListResource: (
      state: IResourceState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listResource = payload?.data;
      state.page = payload?.page;
      state.pageSize = safePageSize(payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedResource: (
      state: IResourceState,
      action: PayloadAction<IResource | null>,
    ) => {
      state.selectedResource = action.payload;
    },
    actSaveCreateResource: (
      state: IResourceState,
      action: PayloadAction<IResource>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listResource);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listResource = newListData;
    },
    actSaveUpdateResource: (
      state: IResourceState,
      action: PayloadAction<IResource>,
    ) => {
      const { payload } = action;

      state.listResource = updateOrDelete(
        payload?.id!,
        state?.listResource,
        payload,
      );
    },
    actSaveDeleteResource: (
      state: IResourceState,
      action: PayloadAction<IResource>,
    ) => {
      const { payload } = action;

      state.listResource = updateOrDelete(payload?.id!, state?.listResource);
    },
    actSetPageSize: (state: IResourceState, action: PayloadAction<number>) => {
      state.pageSize = safePageSize(action.payload);
    },
  },
});

export const {
  actSaveGetListResource,
  actSaveSelectedResource,
  actSaveCreateResource,
  actSaveUpdateResource,
  actSaveDeleteResource,
  actSetPageSize,
} = resourceSlice.actions;
export const resourceSelector = (state: RootState) => state.Resource;
export default resourceSlice.reducer;
