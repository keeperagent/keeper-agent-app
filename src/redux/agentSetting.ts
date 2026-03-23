import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IAgentSetting, IGetListResponse } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface IAgentSettingState {
  listAgentSetting: IAgentSetting[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedAgentSetting: IAgentSetting | null;
}

const initialState: IAgentSettingState = {
  listAgentSetting: [],
  totalData: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  selectedAgentSetting: null,
};

export const agentSettingSlice = createSlice({
  name: "AgentSetting",
  initialState,
  reducers: {
    actSaveGetListAgentSetting: (
      state: IAgentSettingState,
      action: PayloadAction<IGetListResponse<IAgentSetting> | undefined | null>,
    ) => {
      const { payload } = action;
      state.listAgentSetting = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
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
