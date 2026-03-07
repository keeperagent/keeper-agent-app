import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IJob } from "@/electron/type";
import { RootState } from "./store";

interface IJobState {
  listJob: IJob[];
  totalData: number;
}

const initialState: IJobState = {
  listJob: [],
  totalData: 0,
};

export const jobSlice = createSlice({
  name: "Job",
  initialState,
  reducers: {
    actSetListJob: (state: IJobState, action: PayloadAction<any>) => {
      const { payload } = action;
      state.listJob = payload?.data;
      state.totalData = payload?.totalData;
    },
  },
});

export const { actSetListJob } = jobSlice.actions;
export const jobSelector = (state: RootState) => state.Job;
export default jobSlice.reducer;
