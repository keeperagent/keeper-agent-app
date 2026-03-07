import { useState } from "react";
import { MESSAGE } from "@/electron/constant";
import { useIpcAction } from "./useIpcAction";

const useGetCacheSecretKey = () => {
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const { execute, loading } = useIpcAction(
    MESSAGE.GET_SECRET_KEY_CACHE,
    MESSAGE.GET_SECRET_KEY_CACHE_RES,
    { onSuccess: (payload) => setSecretKey(payload?.data) },
  );
  const getCacheSecretKey = (campaignId: number) => execute({ campaignId });
  return { loading, getCacheSecretKey, secretKey };
};

const useSetCacheSecretKey = () => {
  const { execute, loading } = useIpcAction(
    MESSAGE.SET_SECRET_KEY_CACHE,
    MESSAGE.SET_SECRET_KEY_CACHE_RES,
  );
  const setCacheSecretKey = (campaignId: number, value: string) =>
    execute({ campaignId, value });
  return { loading, setCacheSecretKey };
};

export { useGetCacheSecretKey, useSetCacheSecretKey };
