import { useState } from "react";
import { MESSAGE } from "@/electron/constant";
import { useIpcAction } from "./useIpcAction";

const useGetCacheSecretKey = () => {
  const [hasEncryptKey, setHasEncryptKey] = useState(false);
  const [cachedEncryptKey, setCachedEncryptKey] = useState("");
  const { execute, loading } = useIpcAction(
    MESSAGE.GET_SECRET_KEY_CACHE,
    MESSAGE.GET_SECRET_KEY_CACHE_RES,
    {
      onSuccess: (payload) => {
        setHasEncryptKey(Boolean(payload?.hasSecretKey));
        setCachedEncryptKey(payload?.secretKey || "");
      },
    },
  );
  const getCacheSecretKey = (campaignId: number) => {
    setHasEncryptKey(false);
    setCachedEncryptKey("");
    execute({ campaignId });
  };
  return { loading, getCacheSecretKey, hasEncryptKey, cachedEncryptKey };
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
