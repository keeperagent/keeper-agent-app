import { useCallback, useEffect, useState, DependencyList } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";

export type IpcActionOptions<TRes = any> = {
  onSuccess?: (payload: TRes, dispatch: AppDispatch) => void;
  onError?: (errorMessage: string, dispatch: AppDispatch) => void;
  /**
   * Re-subscribe to the response channel whenever these values change.
   * Mirrors the useEffect dependency array. Defaults to [] (mount only).
   */
  deps?: DependencyList;
};

/**
 * Generic primitive for the send-IPC → receive-response → loading/isSuccess
 * pattern shared by nearly every CRUD hook
 */
const useIpcAction = <TReq = any, TRes = any>(
  channel: string,
  resChannel: string,
  options: IpcActionOptions<TRes> = {},
) => {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { onSuccess, onError, deps = [] } = options;

  useEffect(() => {
    const handler = (_event: any, payload: TRes) => {
      setLoading(false);
      const hasError = (payload as any)?.error;
      setIsSuccess(!hasError);
      if (!hasError) {
        onSuccess?.(payload, dispatch);
      } else {
        onError?.((payload as any).error, dispatch);
      }
    };

    const unsubscribe = window?.electron?.on(resChannel, handler);

    return () => {
      unsubscribe?.();
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
