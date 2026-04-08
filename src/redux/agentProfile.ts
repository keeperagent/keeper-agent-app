import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IAgentProfile } from "@/electron/type";
import { DEFAULT_PAGE_SIZE, getNewPageSize, updateOrDelete } from "./util";
import { RootState } from "./store";

interface IAgentProfileState {
  listAgentProfile: IAgentProfile[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedAgentProfile: IAgentProfile | null;
}

const initialState: IAgentProfileState = {
  listAgentProfile: [],
  totalData: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  selectedAgentProfile: null,
};

export const agentProfileSlice = createSlice({
  name: "AgentProfile",
  initialState,
  reducers: {
    actSaveGetListAgentProfile: (
      state: IAgentProfileState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listAgentProfile = payload?.data || [];
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveCreateAgentProfile: (
      state: IAgentProfileState,
      action: PayloadAction<IAgentProfile>,
    ) => {
      const payload = action.payload;
      const list = current(state.listAgentProfile);
      state.listAgentProfile = [payload, ...list];
    },
    actSaveUpdateAgentProfile: (
      state: IAgentProfileState,
      action: PayloadAction<IAgentProfile>,
    ) => {
      const payload = action.payload;
      state.listAgentProfile = updateOrDelete(
        payload?.id!,
        state.listAgentProfile,
        payload,
      );
      if (state.selectedAgentProfile?.id === payload?.id) {
        state.selectedAgentProfile = payload;
      }
    },
    actSaveDeleteAgentProfile: (
      state: IAgentProfileState,
      action: PayloadAction<number>,
    ) => {
      const id = action.payload;
      state.listAgentProfile = updateOrDelete(id, state.listAgentProfile);
      if (state.selectedAgentProfile?.id === id) {
        state.selectedAgentProfile = null;
      }
    },
    actSaveSelectedAgentProfile: (
      state: IAgentProfileState,
      action: PayloadAction<IAgentProfile | null>,
    ) => {
      state.selectedAgentProfile = action.payload;
    },
  },
});

export const {
  actSaveGetListAgentProfile,
  actSaveCreateAgentProfile,
  actSaveUpdateAgentProfile,
  actSaveDeleteAgentProfile,
  actSaveSelectedAgentProfile,
} = agentProfileSlice.actions;
export const agentProfileSelector = (state: RootState) => state.AgentProfile;
export default agentProfileSlice.reducer;
