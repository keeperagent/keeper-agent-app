import dayjs from "dayjs";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LOG_TYPE } from "@/electron/constant";
import { IStructuredLogPayload } from "@/electron/type";
import { RootState } from "./store";

export type ILogMessage = {
  workflowId: number;
  campaignId: number;
  message: string;
  id: string;
  time: string;
  campaignName?: string;
  workflowName?: string;
  threadId?: string;
  type?: LOG_TYPE;
};

interface ISystemLogState {
  logs: ILogMessage[];
  isShowLog: boolean;
  isFilterByWorkflow: boolean;
}

const initialState: ISystemLogState = {
  logs: [],
  isShowLog: false,
  isFilterByWorkflow: true,
};

export const systemLogSlice = createSlice({
  name: "SystemLog",
  initialState,
  reducers: {
    actAppendLog: (state: ISystemLogState, action: PayloadAction<any>) => {
      const { payload } = action;
      let message: IStructuredLogPayload;
      try {
        message = JSON.parse(payload?.message || "{}");
      } catch {
        return; // skip malformed payload so one bad log doesn't break the rest
      }

      // prevent duplicate log by checking @id
      if (state?.logs?.find((log) => log.id === payload?.id)) {
        return;
      }

      state.logs.push({
        id: payload?.id,
        workflowId: message?.workflowId || 0,
        campaignId: message?.campaignId || 0,
        message: message?.message || "",
        time: dayjs().format("HH:mm:ss"),
        campaignName: message?.campaignName,
        workflowName: message?.workflowName,
        threadId:
          message?.threadId != null ? String(message.threadId) : undefined,
        type: message?.type,
      });

      // truncate logs if logs > 5000 lines
      const maxLength = 5000;
      if (state.logs.length > maxLength) {
        state.logs = state.logs.slice(state.logs.length - maxLength);
      }
    },
    actSetIsShowLog: (
      state: ISystemLogState,
      action: PayloadAction<boolean>,
    ) => {
      const { payload } = action;
      state.isShowLog = payload;
    },
    actSetIsFilterByWorkflow: (
      state: ISystemLogState,
      action: PayloadAction<boolean>,
    ) => {
      state.isFilterByWorkflow = action.payload;
    },
  },
});

export const { actAppendLog, actSetIsShowLog, actSetIsFilterByWorkflow } =
  systemLogSlice.actions;
export const systemLogSelector = (state: RootState) => state.SystemLog;
export default systemLogSlice.reducer;
