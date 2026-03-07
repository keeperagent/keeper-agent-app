import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IUser } from "@/types/interface";
import { RootState } from "./store";

interface IAuthState {
  user: IUser | null;
  token: string | null;
  // true while waiting for main process to restore auth state from safeStorage
  isAuthPending: boolean;
  lastVerifyTime: number;
  errorTime: number;
  errorCount: number;
}

const initialState: IAuthState = {
  user: null,
  token: null,
  isAuthPending: true,
  lastVerifyTime: 0,
  errorTime: 0,
  errorCount: 0,
};

export const authSlice = createSlice({
  name: "Auth",
  initialState,
  reducers: {
    actUserSignIn: (state: IAuthState, action: PayloadAction<IAuthState>) => {
      const { payload } = action;
      state.user = payload?.user;
      state.token = payload?.token;
      state.isAuthPending = false;
    },
    actUserLogout: (state: IAuthState) => {
      state.token = null;
      state.user = null;
      state.isAuthPending = false;
    },
    // Called by App.tsx after GET_AUTH_STATE_RES is received from main
    actRestoreAuth: (
      state: IAuthState,
      action: PayloadAction<{ token: string | null; user: IUser | null }>,
    ) => {
      state.token = action.payload?.token || null;
      state.user = action.payload?.user || null;
      state.isAuthPending = false;
    },
    actGetNewAccessToken: (
      state: IAuthState,
      action: PayloadAction<string>,
    ) => {
      state.token = action.payload;
    },
    actSetLastVerifyTime: (
      state: IAuthState,
      action: PayloadAction<number>,
    ) => {
      state.lastVerifyTime = action.payload;
    },
    actSetErrorTime: (state: IAuthState, action: PayloadAction<number>) => {
      state.errorTime = action.payload;
    },
    actSetErrorCount: (state: IAuthState, action: PayloadAction<number>) => {
      state.errorCount = action.payload;
    },
    actSaveUpdateUserInfo: (state: IAuthState, action: PayloadAction<any>) => {
      const { payload } = action;
      state.user = payload;
    },
  },
});

export const {
  actUserSignIn,
  actUserLogout,
  actRestoreAuth,
  actGetNewAccessToken,
  actSetLastVerifyTime,
  actSaveUpdateUserInfo,
  actSetErrorTime,
  actSetErrorCount,
} = authSlice.actions;
export const authSelector = (state: RootState) => state.Auth;
export default authSlice.reducer;
