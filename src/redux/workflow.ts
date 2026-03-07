import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IWorkflow, ISorter } from "@/electron/type";
import { updateOrDelete } from "./util";
import { RootState } from "./store";
import { DEFAULT_PAGE_SIZE, safePageSize } from "./util";

interface IWorkflowState {
  listWorkflow: IWorkflow[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedWorkflow: IWorkflow | null;
  sortField: ISorter | {};
}

const initialState: IWorkflowState = {
  listWorkflow: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedWorkflow: null,
  sortField: {},
};

export const workflowSlice = createSlice({
  name: "Workflow",
  initialState,
  reducers: {
    actSaveGetListWorkflow: (
      state: IWorkflowState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listWorkflow = payload?.data;
      state.page = payload?.page;
      state.pageSize = safePageSize(payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedWorkflow: (
      state: IWorkflowState,
      action: PayloadAction<IWorkflow | null>,
    ) => {
      state.selectedWorkflow = action.payload;
    },
    actSaveCreateWorkflow: (
      state: IWorkflowState,
      action: PayloadAction<IWorkflow>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listWorkflow);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listWorkflow = newListData;
    },
    actSaveUpdateWorkflow: (
      state: IWorkflowState,
      action: PayloadAction<IWorkflow>,
    ) => {
      const { payload } = action;

      state.listWorkflow = updateOrDelete(
        payload?.id!,
        state?.listWorkflow,
        payload,
      );
    },
    actSaveDeleteWorkflow: (
      state: IWorkflowState,
      action: PayloadAction<IWorkflow>,
    ) => {
      const { payload } = action;

      state.listWorkflow = updateOrDelete(payload?.id!, state?.listWorkflow);
    },
    actSetSortField: (
      state: IWorkflowState,
      action: PayloadAction<ISorter | null>,
    ) => {
      const { payload } = action;
      state.sortField = { ...state.sortField, ...payload };
    },
    actSetPageSize: (state: IWorkflowState, action: PayloadAction<number>) => {
      state.pageSize = safePageSize(action.payload);
    },
  },
});

export const {
  actSaveGetListWorkflow,
  actSaveSelectedWorkflow,
  actSaveCreateWorkflow,
  actSaveUpdateWorkflow,
  actSaveDeleteWorkflow,
  actSetSortField,
  actSetPageSize,
} = workflowSlice.actions;
export const workflowSelector = (state: RootState) => state.Workflow;
export default workflowSlice.reducer;
