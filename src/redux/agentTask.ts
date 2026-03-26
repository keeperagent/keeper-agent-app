import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IAgentTask } from "@/electron/type";
import { updateOrDelete } from "./util";
import { RootState } from "./store";

interface IAgentTaskState {
  listAgentTask: IAgentTask[];
}

const initialState: IAgentTaskState = {
  listAgentTask: [],
};

export const agentTaskSlice = createSlice({
  name: "AgentTask",
  initialState,
  reducers: {
    actSaveGetListAgentTask: (
      state: IAgentTaskState,
      action: PayloadAction<IAgentTask[]>,
    ) => {
      state.listAgentTask = action.payload || [];
    },
    actSaveCreateAgentTask: (
      state: IAgentTaskState,
      action: PayloadAction<IAgentTask>,
    ) => {
      const payload = action.payload;
      const list = current(state.listAgentTask);
      state.listAgentTask = [payload, ...list];
    },
    actSaveUpdateAgentTask: (
      state: IAgentTaskState,
      action: PayloadAction<IAgentTask>,
    ) => {
      const payload = action.payload;
      state.listAgentTask = updateOrDelete(
        payload?.id!,
        state.listAgentTask,
        payload,
      );
    },
    actSaveDeleteAgentTask: (
      state: IAgentTaskState,
      action: PayloadAction<number>,
    ) => {
      const id = action.payload;
      state.listAgentTask = updateOrDelete(id, state.listAgentTask);
    },
  },
});

export const {
  actSaveGetListAgentTask,
  actSaveCreateAgentTask,
  actSaveUpdateAgentTask,
  actSaveDeleteAgentTask,
} = agentTaskSlice.actions;
export const agentTaskSelector = (state: RootState) => state.AgentTask;
export default agentTaskSlice.reducer;
