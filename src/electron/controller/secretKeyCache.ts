import { MESSAGE } from "@/electron/constant";
import { secretKeyCache } from "@/electron/service/secretKeyCache";
import type {
  IpcGetSecretKeyCachePayload,
  IpcSetSecretKeyCachePayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const runSecretKeyController = () => {
  onIpc<IpcGetSecretKeyCachePayload>(
    MESSAGE.GET_SECRET_KEY_CACHE,
    MESSAGE.GET_SECRET_KEY_CACHE_RES,
    async (event, payload) => {
      const { campaignId } = payload;

      const value = secretKeyCache.get(secretKeyCache.getCacheKey(campaignId));

      event.reply(MESSAGE.GET_SECRET_KEY_CACHE_RES, {
        hasSecretKey: Boolean(value),
        secretKey: value || "",
      });
    },
  );

  onIpc<IpcSetSecretKeyCachePayload>(
    MESSAGE.SET_SECRET_KEY_CACHE,
    MESSAGE.SET_SECRET_KEY_CACHE_RES,
    async (event, payload) => {
      const { campaignId, value } = payload;
      secretKeyCache.set(secretKeyCache.getCacheKey(campaignId), value);

      event.reply(MESSAGE.SET_SECRET_KEY_CACHE_RES, {});
    },
  );
};
