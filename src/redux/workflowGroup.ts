import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IWorkflowGroup, ISorter } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface IWorkflowGroupState {
  listWorkflowGroup: IWorkflowGroup[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedWorkflowGroup: IWorkflowGroup | null;
  sortField: ISorter | {};
}

const initialState: IWorkflowGroupState = {
  listWorkflowGroup: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedWorkflowGroup: null,
  sortField: {},
};

export const workflowGroupSlice = createSlice({
  name: "WorkflowGroup",
  initialState,
  reducers: {
    actSaveGetListWorkflowGroup: (
      state: IWorkflowGroupState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listWorkflowGroup = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedWorkflowGroup: (
      state: IWorkflowGroupState,
      action: PayloadAction<IWorkflowGroup | null>,
    ) => {
      state.selectedWorkflowGroup = action.payload;
    },
    actSaveCreateWorkflowGroup: (
      state: IWorkflowGroupState,
      action: PayloadAction<IWorkflowGroup>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listWorkflowGroup);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listWorkflowGroup = newListData;
    },
    actSaveUpdateWorkflowGroup: (
      state: IWorkflowGroupState,
      action: PayloadAction<IWorkflowGroup>,
    ) => {
      const { payload } = action;

      state.listWorkflowGroup = updateOrDelete(
        payload?.id!,
        state?.listWorkflowGroup,
        payload,
      );
    },
    actSaveDeleteWorkflowGroup: (
      state: IWorkflowGroupState,
      action: PayloadAction<IWorkflowGroup>,
    ) => {
      const { payload } = action;

      state.listWorkflowGroup = updateOrDelete(
        payload?.id!,
        state?.listWorkflowGroup,
      );
    },
    actSetSortField: (
      state: IWorkflowGroupState,
      action: PayloadAction<ISorter | null>,
    ) => {
      const { payload } = action;
      state.sortField = { ...state.sortField, ...payload };
    },
    actSetPageSize: (
      state: IWorkflowGroupState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const {
  actSaveGetListWorkflowGroup,
  actSaveSelectedWorkflowGroup,
  actSaveCreateWorkflowGroup,
  actSaveUpdateWorkflowGroup,
  actSaveDeleteWorkflowGroup,
  actSetSortField,
  actSetPageSize,
} = workflowGroupSlice.actions;
export const workflowGroupSelector = (state: RootState) => state.WorkflowGroup;
export default workflowGroupSlice.reducer;
