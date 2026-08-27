import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IWalletActivity } from "@/electron/type";
import { getNewPageSize, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface IWalletActivityState {
  listWalletActivity: IWalletActivity[];
  page: number;
  pageSize: number;
  totalData: number;
}

const initialState: IWalletActivityState = {
  listWalletActivity: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
};

export const walletActivitySlice = createSlice({
  name: "WalletActivity",
  initialState,
  reducers: {
    actSaveGetListWalletActivity: (
      state: IWalletActivityState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listWalletActivity = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSetPageSize: (
      state: IWalletActivityState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const { actSaveGetListWalletActivity, actSetPageSize } =
  walletActivitySlice.actions;
export const walletActivitySelector = (state: RootState) =>
  state.WalletActivity;
export default walletActivitySlice.reducer;
