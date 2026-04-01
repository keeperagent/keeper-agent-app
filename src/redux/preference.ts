import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IPreference, IStatistic } from "@/electron/type";
import { RootState } from "./store";

interface IPreferenceState {
  preference: IPreference | null;
  statistic: IStatistic | null;
  showResourceHelpAlert: boolean;
  showCampaignHelpAlert: boolean;
  showUploadWalletHelpAlert: boolean;
  showUploadResourceHelpAlert: boolean;
  showUploadWorkflowHelpAlert: boolean;
  showPreferenceHelpAlert: boolean;
}

const initialState: IPreferenceState = {
  preference: null,
  statistic: null,
  showResourceHelpAlert: true,
  showCampaignHelpAlert: true,
  showUploadWalletHelpAlert: true,
  showUploadResourceHelpAlert: true,
  showUploadWorkflowHelpAlert: true,
  showPreferenceHelpAlert: true,
};

export const preferenceSlice = createSlice({
  name: "Preference",
  initialState,
  reducers: {
    actSaveGetOnePreference: (
      state: IPreferenceState,
      action: PayloadAction<IPreference>
    ) => {
      const { payload } = action;
      state.preference = payload;
    },
    actSaveUpdatePreference: (
      state: IPreferenceState,
      action: PayloadAction<IPreference>
    ) => {
      const { payload } = action;
      state.preference = payload;
    },
    actSaveGetStatistic: (
      state: IPreferenceState,
      action: PayloadAction<IStatistic | null>
    ) => {
      const { payload } = action;
      state.statistic = payload;
    },
    actSetShouldShowResourceHelpAlert: (
      state: IPreferenceState,
      action: PayloadAction<boolean>
    ) => {
      state.showResourceHelpAlert = action.payload;
    },
    actSetShouldShowCampaignHelpAlert: (
      state: IPreferenceState,
      action: PayloadAction<boolean>
    ) => {
      state.showCampaignHelpAlert = action.payload;
    },
    actSetShouldShowUploadWalletHelpAlert: (
      state: IPreferenceState,
      action: PayloadAction<boolean>
    ) => {
      state.showUploadWalletHelpAlert = action.payload;
    },
    actSetShouldShowUploadWorkflowHelpAlert: (
      state: IPreferenceState,
      action: PayloadAction<boolean>
    ) => {
      state.showUploadWorkflowHelpAlert = action.payload;
    },
    actSetShouldShowUploadResourceHelpAlert: (
      state: IPreferenceState,
      action: PayloadAction<boolean>
    ) => {
      state.showUploadResourceHelpAlert = action.payload;
    },
    actSetShowPreferenceHelpAlert: (
      state: IPreferenceState,
      action: PayloadAction<boolean>
    ) => {
      state.showPreferenceHelpAlert = action.payload;
    },
  },
});

export const {
  actSaveGetOnePreference,
  actSaveUpdatePreference,
  actSaveGetStatistic,
  actSetShouldShowResourceHelpAlert,
  actSetShouldShowCampaignHelpAlert,
  actSetShouldShowUploadWalletHelpAlert,
  actSetShouldShowUploadWorkflowHelpAlert,
  actSetShouldShowUploadResourceHelpAlert,
  actSetShowPreferenceHelpAlert,
} = preferenceSlice.actions;
export const preferenceSelector = (state: RootState) => state.Preference;
export default preferenceSlice.reducer;
