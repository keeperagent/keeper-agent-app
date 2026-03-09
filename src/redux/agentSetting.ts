import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IAgentSetting, IGetListResponse } from "@/electron/type";
import { updateOrDelete } from "./util";
import { RootState } from "./store";
import { DEFAULT_PAGE_SIZE, safePageSize } from "./util";

interface IAgentSettingState {
  listAgentSetting: IAgentSetting[];
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  selectedAgentSetting: IAgentSetting | null;
}

const initialState: IAgentSettingState = {
  listAgentSetting: [],
  page: 1,
  pageSize: 1000,
  totalData: 0,
  totalPage: 0,
  selectedAgentSetting: null,
};

export const agentSettingSlice = createSlice({
  name: "AgentSetting",
  initialState,
  reducers: {
    actSaveGetListAgentSetting: (
      state: IAgentSettingState,
      action: PayloadAction<
        IGetListResponse<IAgentSetting> | undefined | null
      >,
    ) => {
      const payload = action.payload;
      if (!payload) {
        state.listAgentSetting = [];
        state.page = 1;
        state.pageSize = DEFAULT_PAGE_SIZE;
        state.totalData = 0;
        state.totalPage = 0;
        return;
      }
      state.listAgentSetting = payload.data || [];
      state.page = payload.page || 1;
      state.pageSize = safePageSize(payload.pageSize);
      state.totalData = payload.totalData || 0;
      state.totalPage = payload.totalPage || 0;
    },
    actSaveCreateAgentSetting: (
      state: IAgentSettingState,
      action: PayloadAction<IAgentSetting>,
    ) => {
      const payload = action.payload;
      const list = current(state.listAgentSetting);
      state.listAgentSetting = [payload, ...list];
    },
    actSaveUpdateAgentSetting: (
      state: IAgentSettingState,
      action: PayloadAction<IAgentSetting>,
    ) => {
      const payload = action.payload;
      state.listAgentSetting = updateOrDelete(
        payload?.id!,
        state.listAgentSetting,
        payload,
      );
    },
    actSaveDeleteAgentSetting: (
      state: IAgentSettingState,
      action: PayloadAction<number>,
    ) => {
      const id = action.payload;
      state.listAgentSetting = updateOrDelete(id, state.listAgentSetting);
    },
    actSaveSelectedAgentSetting: (
      state: IAgentSettingState,
      action: PayloadAction<IAgentSetting | null>,
    ) => {
      state.selectedAgentSetting = action.payload;
    },
  },
});

export const {
  actSaveGetListAgentSetting,
  actSaveCreateAgentSetting,
  actSaveUpdateAgentSetting,
  actSaveDeleteAgentSetting,
  actSaveSelectedAgentSetting,
} = agentSettingSlice.actions;
export const agentSettingSelector = (state: RootState) => state.AgentSetting;
export default agentSettingSlice.reducer;
