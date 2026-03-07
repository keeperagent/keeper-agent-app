import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

export type IDownloadStatus = {
  downloadedBytes: number;
  totalBytes: number;
  isDone: boolean;
  isProcessing: boolean;
  isAvailable: boolean;
};

interface IBrowserState {
  currentVersion: string;
  lastestVersion: string;
  downloadStatus: IDownloadStatus;
}

const initialState: IBrowserState = {
  currentVersion: "",
  lastestVersion: "",
  downloadStatus: {
    downloadedBytes: 0,
    totalBytes: 0,
    isDone: false,
    isProcessing: false,
    isAvailable: false,
  },
};

export const browserSlice = createSlice({
  name: "Browser",
  initialState,
  reducers: {
    actSaveDownloadStatus: (
      state: IBrowserState,
      action: PayloadAction<IDownloadStatus>
    ) => {
      const { payload } = action;
      state.downloadStatus = payload;
    },
  },
});

export const { actSaveDownloadStatus } = browserSlice.actions;
export const browserSelector = (state: RootState) => state.Browser;
export default browserSlice.reducer;
