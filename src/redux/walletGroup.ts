import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IWalletGroup, IDeleteDependency, ISorter } from "@/electron/type";
import { getNewPageSize, updateOrDelete, DEFAULT_PAGE_SIZE } from "./util";
import { RootState } from "./store";

interface IWalletGroupState {
  listWalletGroup: IWalletGroup[];
  page: number;
  pageSize: number;
  totalData: number;
  selectedWalletGroup: IWalletGroup | null;
  dependencies: { [key: string]: IDeleteDependency };
  isModalDependencyOpen: boolean;
  sortField: ISorter | {};
}

const initialState: IWalletGroupState = {
  listWalletGroup: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalData: 0,
  selectedWalletGroup: null,
  dependencies: {},
  isModalDependencyOpen: false,
  sortField: {},
};

export const walletGroupSlice = createSlice({
  name: "WalletGroup",
  initialState,
  reducers: {
    actSaveGetListWalletGroup: (
      state: IWalletGroupState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listWalletGroup = payload?.data;
      state.page = payload?.page;
      state.pageSize = getNewPageSize(state.pageSize, payload?.pageSize);
      state.totalData = payload?.totalData;
    },
    actSaveSelectedWalletGroup: (
      state: IWalletGroupState,
      action: PayloadAction<IWalletGroup | null>,
    ) => {
      state.selectedWalletGroup = action.payload;
    },
    actSaveCreateWalletGroup: (
      state: IWalletGroupState,
      action: PayloadAction<IWalletGroup>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listWalletGroup);

      if (newListData.length < state.pageSize) {
        newListData = [payload, ...newListData];
      } else {
        newListData = [
          payload,
          ...newListData.slice(0, newListData.length - 1),
        ];
      }

      state.listWalletGroup = newListData;
    },
    actSaveUpdateWalletGroup: (
      state: IWalletGroupState,
      action: PayloadAction<IWalletGroup>,
    ) => {
      const { payload } = action;

      state.listWalletGroup = updateOrDelete(
        payload?.id!,
        state?.listWalletGroup,
        payload,
      );
    },
    actSaveDeleteWalletGroup: (
      state: IWalletGroupState,
      action: PayloadAction<IWalletGroup>,
    ) => {
      const { payload } = action;

      state.listWalletGroup = updateOrDelete(
        payload?.id!,
        state?.listWalletGroup,
      );
    },
    actSaveWalletGroupDependency: (
      state: IWalletGroupState,
      action: PayloadAction<{
        [key: string]: IDeleteDependency;
      }>,
    ) => {
      const { payload } = action;
      state.dependencies = payload;
    },
    actSetModalDependencyOpen: (
      state: IWalletGroupState,
      action: PayloadAction<boolean>,
    ) => {
      const { payload } = action;
      state.isModalDependencyOpen = payload;
    },
    actSetSortField: (
      state: IWalletGroupState,
      action: PayloadAction<ISorter | null>,
    ) => {
      const { payload } = action;
      state.sortField = { ...state.sortField, ...payload };
    },
    actSetPageSize: (
      state: IWalletGroupState,
      action: PayloadAction<number>,
    ) => {
      state.pageSize = getNewPageSize(state.pageSize, action.payload);
    },
  },
});

export const {
  actSaveGetListWalletGroup,
  actSaveSelectedWalletGroup,
  actSaveCreateWalletGroup,
  actSaveUpdateWalletGroup,
  actSaveDeleteWalletGroup,
  actSaveWalletGroupDependency,
  actSetModalDependencyOpen,
  actSetSortField,
  actSetPageSize,
} = walletGroupSlice.actions;
export const walletGroupSelector = (state: RootState) => state.WalletGroup;
export default walletGroupSlice.reducer;
