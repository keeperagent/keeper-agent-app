import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IAgentTask } from "@/electron/type";
import { updateOrDelete } from "./util";
import { RootState } from "./store";

interface IAgentTaskState {
  listAgentTask: IAgentTask[];
  selectedTask: IAgentTask | null;
}

const initialState: IAgentTaskState = {
  listAgentTask: [],
  selectedTask: null,
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
      if (state.selectedTask) {
        const updated = (action.payload || []).find(
          (task) => task.id === state.selectedTask!.id,
        );
        if (updated) {
          state.selectedTask = updated;
        }
      }
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
      if (state.selectedTask?.id === payload.id) {
        state.selectedTask = payload;
      }
    },
    actSaveDeleteAgentTask: (
      state: IAgentTaskState,
      action: PayloadAction<number>,
    ) => {
      const id = action.payload;
      state.listAgentTask = updateOrDelete(id, state.listAgentTask);
    },
    actSetSelectedTask: (
      state: IAgentTaskState,
      action: PayloadAction<IAgentTask | null>,
    ) => {
      state.selectedTask = action.payload;
    },
  },
});

export const {
  actSaveGetListAgentTask,
  actSaveCreateAgentTask,
  actSaveUpdateAgentTask,
  actSaveDeleteAgentTask,
  actSetSelectedTask,
} = agentTaskSlice.actions;
export const agentTaskSelector = (state: RootState) => state.AgentTask;
export default agentTaskSlice.reducer;
