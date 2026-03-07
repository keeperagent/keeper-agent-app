import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface ILayoutState {
  isSidebarOpen: boolean;
  isLightMode: boolean;
  pageName: string;
  isModalInstructionOpen: boolean;
  isReadNodeProviderInstruction: boolean;
  isReadCampaignInstruction: boolean;
  isReadProxyInstruction: boolean;
  isReadResourceInstruction: boolean;
  isReadWorkflowInstruction: boolean;
  isReadWalletInstruction: boolean;
  isReadExtensionInstruction: boolean;
  isReadProfileInstruction: boolean;
  isReadHistoryInstruction: boolean;
  isReadScheduleInstruction: boolean;
  isShowBalance: boolean;
  isModalGlobalSearchOpen: boolean;
  isModalAgentOpen: boolean;
}

const initialState: ILayoutState = {
  isSidebarOpen: true,
  isLightMode: true,
  pageName: "",
  isModalInstructionOpen: false,
  isReadNodeProviderInstruction: false,
  isReadCampaignInstruction: false,
  isReadProxyInstruction: false,
  isReadResourceInstruction: false,
  isReadWorkflowInstruction: false,
  isReadWalletInstruction: false,
  isReadExtensionInstruction: false,
  isReadProfileInstruction: false,
  isReadHistoryInstruction: false,
  isReadScheduleInstruction: false,
  isShowBalance: false,
  isModalGlobalSearchOpen: false,
  isModalAgentOpen: false,
};

export const layoutSlice = createSlice({
  name: "Layout",
  initialState,
  reducers: {
    actSetSidebarOpen: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isSidebarOpen = action.payload;
    },
    actToggleLightMode: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isLightMode = action.payload;
    },
    actSetPageName: (state: ILayoutState, action: PayloadAction<string>) => {
      state.pageName = action.payload;
    },
    actSetModalInstructionOpen: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isModalInstructionOpen = action.payload;
    },
    actSetReadNodeProviderInstruction: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isReadNodeProviderInstruction = action.payload;
    },
    actSetReadCampaignInstruction: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isReadCampaignInstruction = action.payload;
    },
    actSetReadProxyInstruction: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isReadProxyInstruction = action.payload;
    },
    actSetReadResourceInstruction: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isReadResourceInstruction = action.payload;
    },
    actSetReadWorkflowInstruction: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isReadWorkflowInstruction = action.payload;
    },
    actSetReadWalletInstruction: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isReadWalletInstruction = action.payload;
    },
    actSetReadExtensionInstruction: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isReadExtensionInstruction = action.payload;
    },
    actSetReadProfileInstruction: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isReadProfileInstruction = action.payload;
    },
    actSetReadHistoryInstruction: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isReadHistoryInstruction = action.payload;
    },
    actSetReadScheduleInstruction: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isReadScheduleInstruction = action.payload;
    },
    actSetShowBalance: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isShowBalance = action?.payload;
    },
    actSetModalGlobalSearchOpen: (
      state: ILayoutState,
      action: PayloadAction<boolean>
    ) => {
      state.isModalGlobalSearchOpen = action?.payload;
    },
  },
});

export const {
  actSetSidebarOpen,
  actToggleLightMode,
  actSetPageName,
  actSetModalInstructionOpen,
  actSetReadNodeProviderInstruction,
  actSetReadCampaignInstruction,
  actSetReadProxyInstruction,
  actSetReadResourceInstruction,
  actSetReadWorkflowInstruction,
  actSetReadWalletInstruction,
  actSetReadExtensionInstruction,
  actSetReadProfileInstruction,
  actSetReadHistoryInstruction,
  actSetReadScheduleInstruction,
  actSetShowBalance,
  actSetModalGlobalSearchOpen,
} = layoutSlice.actions;
export const layoutSelector = (state: RootState) => state.Layout;
export default layoutSlice.reducer;
