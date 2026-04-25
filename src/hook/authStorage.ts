import { useEffect } from "react";
import { MESSAGE } from "@/electron/constant";
import { store } from "@/redux/store";
import { actRestoreAuth } from "@/redux/auth";

// Plain functions — safe to call from anywhere (hooks, Apollo links, plain modules)
const saveAuthToken = (token: string, user: any) => {
  window?.electron?.send(MESSAGE.SAVE_AUTH_TOKEN, { token, user });
};

const clearAuthToken = () => {
  window?.electron?.send(MESSAGE.CLEAR_AUTH_TOKEN);
};

const useAuthStorage = () => {
  return { saveAuthToken, clearAuthToken };
};

/**
 * Requests persisted auth state from the main process on mount.
 * Must use `store.dispatch` directly because this hook is called inside `App`,
 * which renders the Redux <Provider> itself (so useDispatch is not available).
 */
const useRestoreAuth = () => {
  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      store.dispatch(
        actRestoreAuth({
          token: payload?.token || null,
          user: payload?.user || null,
        }),
      );
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.GET_AUTH_STATE_RES,
      handler,
    );
    window?.electron?.send(MESSAGE.GET_AUTH_STATE);
    return () => {
      unsubscribe?.();
    };
  }, []);
};

export { saveAuthToken, clearAuthToken, useAuthStorage, useRestoreAuth };
