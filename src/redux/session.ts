import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { actUserLogout } from "./auth";

interface ISessionState {
  isMasterKeyUnlocked: boolean;
}

const initialState: ISessionState = {
  isMasterKeyUnlocked: false,
};

export const sessionSlice = createSlice({
  name: "Session",
  initialState,
  reducers: {
    actSetMasterKeyUnlocked: (
      state: ISessionState,
      action: PayloadAction<boolean>,
    ) => {
      state.isMasterKeyUnlocked = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(actUserLogout, (state) => {
      state.isMasterKeyUnlocked = false;
    });
  },
});

export const { actSetMasterKeyUnlocked } = sessionSlice.actions;
export const sessionSelector = (state: RootState) => state.Session;
export default sessionSlice.reducer;
