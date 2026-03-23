import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IAgentRegistry, IGetListResponse } from "@/electron/type";
import { getNewPageSize, updateOrDelete } from "./util";
import { RootState } from "./store";

interface IAgentRegistryState {
  listAgentRegistry: IAgentRegistry[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedAgentRegistry: IAgentRegistry | null;
}

const initialState: IAgentRegistryState = {
  listAgentRegistry: [],
  totalData: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  selectedAgentRegistry: null,
};

export const agentRegistrySlice = createSlice({
  name: "AgentRegistry",
  initialState,
  reducers: {
    actSaveGetListAgentRegistry: (
      state: IAgentRegistryState,
      action: PayloadAction<
        IGetListResponse<IAgentRegistry> | undefined | null
      >,
    ) => {
      const { payload } = action;
      state.listAgentRegistry = payload.data || [];
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveCreateAgentRegistry: (
      state: IAgentRegistryState,
      action: PayloadAction<IAgentRegistry>,
    ) => {
      const payload = action.payload;
      const list = current(state.listAgentRegistry);
      state.listAgentRegistry = [payload, ...list];
    },
    actSaveUpdateAgentRegistry: (
      state: IAgentRegistryState,
      action: PayloadAction<IAgentRegistry>,
    ) => {
      const payload = action.payload;
      state.listAgentRegistry = updateOrDelete(
        payload?.id!,
        state.listAgentRegistry,
        payload,
      );
      if (state.selectedAgentRegistry?.id === payload?.id) {
        state.selectedAgentRegistry = payload;
      }
    },
    actSaveDeleteAgentRegistry: (
      state: IAgentRegistryState,
      action: PayloadAction<number>,
    ) => {
      const id = action.payload;
      state.listAgentRegistry = updateOrDelete(id, state.listAgentRegistry);
      if (state.selectedAgentRegistry?.id === id) {
        state.selectedAgentRegistry = null;
      }
    },
    actSaveSelectedAgentRegistry: (
      state: IAgentRegistryState,
      action: PayloadAction<IAgentRegistry | null>,
    ) => {
      state.selectedAgentRegistry = action.payload;
    },
  },
});

export const {
  actSaveGetListAgentRegistry,
  actSaveCreateAgentRegistry,
  actSaveUpdateAgentRegistry,
  actSaveDeleteAgentRegistry,
  actSaveSelectedAgentRegistry,
} = agentRegistrySlice.actions;
export const agentRegistrySelector = (state: RootState) => state.AgentRegistry;
export default agentRegistrySlice.reducer;
