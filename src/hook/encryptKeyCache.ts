import { useState } from "react";
import { MESSAGE } from "@/electron/constant";
import { useIpcAction } from "./useIpcAction";

const useGetCacheEncryptKey = () => {
  const [hasEncryptKey, setHasEncryptKey] = useState(false);
  const [cachedEncryptKey, setCachedEncryptKey] = useState("");
  const { execute, loading } = useIpcAction(
    MESSAGE.GET_ENCRYPT_KEY_CACHE,
    MESSAGE.GET_ENCRYPT_KEY_CACHE_RES,
    {
      onSuccess: (payload) => {
        setHasEncryptKey(Boolean(payload?.hasEncryptKey));
        setCachedEncryptKey(payload?.encryptKey || "");
      },
    },
  );
  const getCacheEncryptKey = (campaignId: number) => {
    setHasEncryptKey(false);
    setCachedEncryptKey("");
    execute({ campaignId });
  };
  return { loading, getCacheEncryptKey, hasEncryptKey, cachedEncryptKey };
};

const useSetCacheEncryptKey = () => {
  const { execute, loading } = useIpcAction(
    MESSAGE.SET_ENCRYPT_KEY_CACHE,
    MESSAGE.SET_ENCRYPT_KEY_CACHE_RES,
  );
  const setCacheEncryptKey = (campaignId: number, value: string) =>
    execute({ campaignId, value });
  return { loading, setCacheEncryptKey };
};

export { useGetCacheEncryptKey, useSetCacheEncryptKey };
