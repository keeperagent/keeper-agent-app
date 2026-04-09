import { useCallback, useEffect, useState, DependencyList } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";

export type IpcActionOptions<TRes = any> = {
  /**
   * Called whenever the response channel fires. Receives the raw IPC payload
   * and the Redux dispatch function so callers can update the store without
   * needing a separate useDispatch() call.
   */
  onSuccess?: (payload: TRes, dispatch: AppDispatch) => void;
  /**
   * Re-subscribe to the response channel whenever these values change.
   * Mirrors the useEffect dependency array. Defaults to [] (mount only).
   */
  deps?: DependencyList;
};

/**
 * Generic primitive for the send-IPC → receive-response → loading/isSuccess
 * pattern shared by nearly every CRUD hook.
 *
 * Complex patterns (streaming progress, promise+requestId) should be
 * implemented directly without this helper.
 */
const useIpcAction = <TReq = any, TRes = any>(
  channel: string,
  resChannel: string,
  options: IpcActionOptions<TRes> = {},
) => {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { onSuccess, deps = [] } = options;

  useEffect(() => {
    window?.electron?.on(resChannel, (_event: any, payload: TRes) => {
      setLoading(false);
      setIsSuccess(true);
      onSuccess?.(payload, dispatch);
    });

    return () => {
      window?.electron?.removeAllListeners(resChannel);
    };
  }, deps);

  const execute = useCallback(
    (payload?: TReq) => {
      setLoading(true);
      setIsSuccess(false);
      window?.electron?.send(channel, payload);
    },
    [channel],
  );

  return { execute, loading, isSuccess };
};

export { useIpcAction };
