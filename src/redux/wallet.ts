import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IWallet } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface IWalletState {
  listWallet: IWallet[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedWallet: IWallet | null;
  tableViewMode: string;
}

const initialState: IWalletState = {
  listWallet: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedWallet: null,
  tableViewMode: "",
};

export const walletSlice = createSlice({
  name: "Wallet",
  initialState,
  reducers: {
    actSaveGetListWallet: (state: IWalletState, action: PayloadAction<any>) => {
      const { payload } = action;
      state.listWallet = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedWallet: (
      state: IWalletState,
      action: PayloadAction<IWallet | null>,
    ) => {
      state.selectedWallet = action.payload;
    },
    actSaveCreateWallet: (
      state: IWalletState,
      action: PayloadAction<IWallet>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listWallet);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listWallet = newListData;
    },
    actSaveUpdateWallet: (
      state: IWalletState,
      action: PayloadAction<IWallet>,
    ) => {
      const { payload } = action;

      state.listWallet = updateOrDelete(
        payload?.id!,
        state?.listWallet,
        payload,
      );
    },
    actSaveDeleteWallet: (
      state: IWalletState,
      action: PayloadAction<IWallet>,
    ) => {
      const { payload } = action;

      state.listWallet = updateOrDelete(payload?.id!, state?.listWallet);
    },
    actSetTableViewMode: (
      state: IWalletState,
      action: PayloadAction<string>,
    ) => {
      const { payload } = action;
      state.tableViewMode = payload;
    },
    actSetPageSize: (state: IWalletState, action: PayloadAction<number>) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const {
  actSaveGetListWallet,
  actSaveSelectedWallet,
  actSaveCreateWallet,
  actSaveUpdateWallet,
  actSaveDeleteWallet,
  actSetTableViewMode,
  actSetPageSize,
} = walletSlice.actions;
export const walletSelector = (state: RootState) => state.Wallet;
export default walletSlice.reducer;
