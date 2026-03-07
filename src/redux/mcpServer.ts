import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IMcpServer, IGetListResponse, ISorter } from "@/electron/type";
import { updateOrDelete } from "./util";
import { RootState } from "./store";
import { DEFAULT_PAGE_SIZE, safePageSize } from "./util";

interface IMcpServerState {
  listMcpServer: IMcpServer[];
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  sortField: ISorter | {};
  isModalOpen: boolean;
  selectedMcpServer: IMcpServer | null;
}

const initialState: IMcpServerState = {
  listMcpServer: [],
  page: 1,
  pageSize: 1000,
  totalData: 0,
  totalPage: 0,
  sortField: {},
  isModalOpen: false,
  selectedMcpServer: null,
};

export const mcpServerSlice = createSlice({
  name: "McpServer",
  initialState,
  reducers: {
    actSaveGetListMcpServer: (
      state: IMcpServerState,
      action: PayloadAction<IGetListResponse<IMcpServer> | undefined | null>,
    ) => {
      const payload = action.payload;
      if (!payload) {
        state.listMcpServer = [];
        state.page = 1;
        state.pageSize = DEFAULT_PAGE_SIZE;
        state.totalData = 0;
        state.totalPage = 0;
        return;
      }
      state.listMcpServer = payload.data || [];
      state.page = payload.page || 1;
      state.pageSize = safePageSize(payload.pageSize);
      state.totalData = payload.totalData || 0;
      state.totalPage = payload.totalPage || 0;
    },
    actSaveCreateMcpServer: (
      state: IMcpServerState,
      action: PayloadAction<IMcpServer>,
    ) => {
      const payload = action.payload;
      const list = current(state.listMcpServer);
      state.listMcpServer = [payload, ...list];
    },
    actSaveUpdateMcpServer: (
      state: IMcpServerState,
      action: PayloadAction<IMcpServer>,
    ) => {
      const payload = action.payload;
      state.listMcpServer = updateOrDelete(
        payload?.id!,
        state.listMcpServer,
        payload,
      );
    },
    actSaveDeleteMcpServer: (
      state: IMcpServerState,
      action: PayloadAction<number>,
    ) => {
      const id = action.payload;
      state.listMcpServer = updateOrDelete(id, state.listMcpServer);
    },
    actSetSortFieldMcpServer: (
      state: IMcpServerState,
      action: PayloadAction<ISorter | null>,
    ) => {
      const payload = action.payload;
      state.sortField = { ...state.sortField, ...payload };
    },
    actSetModalOpenMcpServer: (
      state: IMcpServerState,
      action: PayloadAction<boolean>,
    ) => {
      state.isModalOpen = action.payload;
    },
    actSaveSelectedMcpServer: (
      state: IMcpServerState,
      action: PayloadAction<IMcpServer | null>,
    ) => {
      state.selectedMcpServer = action.payload;
    },
  },
});

export const {
  actSaveGetListMcpServer,
  actSaveCreateMcpServer,
  actSaveUpdateMcpServer,
  actSaveDeleteMcpServer,
  actSetSortFieldMcpServer,
  actSetModalOpenMcpServer,
  actSaveSelectedMcpServer,
} = mcpServerSlice.actions;
export const mcpServerSelector = (state: RootState) => state.McpServer;
export default mcpServerSlice.reducer;
