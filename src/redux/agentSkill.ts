import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IAgentSkill, IGetListResponse, ISorter } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface IAgentSkillState {
  listAgentSkill: IAgentSkill[];
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  sortField: ISorter | {};
  isModalOpen: boolean;
  selectedAgentSkill: IAgentSkill | null;
}

const initialState: IAgentSkillState = {
  listAgentSkill: [],
  page: 1,
  pageSize: 1000,
  totalData: 0,
  totalPage: 0,
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
      const payload = action.payload;
      if (!payload) {
        state.listAgentSkill = [];
        state.page = 1;
        state.pageSize = DEFAULT_PAGE_SIZE;
        state.totalData = 0;
        state.totalPage = 0;
        return;
      }
      state.listAgentSkill = payload.data || [];
      state.page = payload.page || 1;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload.totalData || 0;
      state.totalPage = payload.totalPage || 0;
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
