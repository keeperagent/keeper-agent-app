import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { IExtension } from "@/electron/type";
import { updateOrDelete } from "./util";
import { RootState } from "./store";

interface IExtensionState {
  listExtension: IExtension[];
  totalData: number;
  selectedExtension: IExtension | null;
}

const initialState: IExtensionState = {
  listExtension: [],
  totalData: 0,
  selectedExtension: null,
};

export const extensionSlice = createSlice({
  name: "Extension",
  initialState,
  reducers: {
    actSaveGetListExtension: (
      state: IExtensionState,
      action: PayloadAction<any>,
    ) => {
      const { payload } = action;
      state.listExtension = payload?.data;
      state.totalData = payload?.data?.length;
    },
    actSaveSelectedExtension: (
      state: IExtensionState,
      action: PayloadAction<IExtension | null>,
    ) => {
      state.selectedExtension = action.payload;
    },
    actSaveCreateExtension: (
      state: IExtensionState,
      action: PayloadAction<IExtension>,
    ) => {
      const { payload } = action;
      let newListData = current(state.listExtension);
      newListData = [payload, ...newListData];
      state.listExtension = newListData;
    },
    actSaveUpdateExtension: (
      state: IExtensionState,
      action: PayloadAction<IExtension>,
    ) => {
      const { payload } = action;

      state.listExtension = updateOrDelete(
        payload?.id!,
        state?.listExtension,
        payload,
      );
    },
    actSaveDeleteExtension: (
      state: IExtensionState,
      action: PayloadAction<IExtension>,
    ) => {
      const { payload } = action;
      const newListData = current(state.listExtension);

      state.listExtension = updateOrDelete(payload?.id as number, newListData);
    },
  },
});

export const {
  actSaveGetListExtension,
  actSaveSelectedExtension,
  actSaveCreateExtension,
  actSaveUpdateExtension,
  actSaveDeleteExtension,
} = extensionSlice.actions;
export const extensionSelector = (state: RootState) => state.Extension;
export default extensionSlice.reducer;
