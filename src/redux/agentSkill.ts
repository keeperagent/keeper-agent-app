import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IAgentSkill, IGetListResponse, ISorter } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface IAgentSkillState {
  listAgentSkill: IAgentSkill[];
  page: number;
  pageSize: number;
  totalData: number;
  sortField: ISorter | {};
  isModalOpen: boolean;
  selectedAgentSkill: IAgentSkill | null;
}

const initialState: IAgentSkillState = {
  listAgentSkill: [],
  totalData: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  sortField: {},
  isModalOpen: false,
  selectedAgentSkill: null,
};

export const agentSkillSlice = createSlice({
  name: "AgentSkill",
  initialState,
  reducers: {
    actSaveGetListAgentSkill: (
      state: IAgentSkillState,
      action: PayloadAction<IGetListResponse<IAgentSkill> | undefined | null>,
    ) => {
      const { payload } = action;
      state.listAgentSkill = payload.data || [];
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveCreateAgentSkill: (
      state: IAgentSkillState,
      action: PayloadAction<IAgentSkill>,
    ) => {
      const payload = action.payload;
      const list = current(state.listAgentSkill);
      state.listAgentSkill = [payload, ...list];
    },
    actSaveUpdateAgentSkill: (
      state: IAgentSkillState,
      action: PayloadAction<IAgentSkill>,
    ) => {
      const payload = action.payload;
      state.listAgentSkill = updateOrDelete(
        payload?.id!,
        state.listAgentSkill,
        payload,
      );
    },
    actSaveDeleteAgentSkill: (
      state: IAgentSkillState,
      action: PayloadAction<number>,
    ) => {
      const id = action.payload;
      state.listAgentSkill = updateOrDelete(id, state.listAgentSkill);
    },
    actSetSortFieldAgentSkill: (
      state: IAgentSkillState,
      action: PayloadAction<ISorter | null>,
    ) => {
      const payload = action.payload;
      state.sortField = { ...state.sortField, ...payload };
    },
    actSetModalOpenAgentSkill: (
      state: IAgentSkillState,
      action: PayloadAction<boolean>,
    ) => {
      state.isModalOpen = action.payload;
    },
    actSaveSelectedAgentSkill: (
      state: IAgentSkillState,
      action: PayloadAction<IAgentSkill | null>,
    ) => {
      state.selectedAgentSkill = action.payload;
    },
  },
});

export const {
  actSaveGetListAgentSkill,
  actSaveCreateAgentSkill,
  actSaveUpdateAgentSkill,
  actSaveDeleteAgentSkill,
  actSetSortFieldAgentSkill,
  actSetModalOpenAgentSkill,
  actSaveSelectedAgentSkill,
} = agentSkillSlice.actions;
export const agentSkillSelector = (state: RootState) => state.AgentSkill;
export default agentSkillSlice.reducer;
