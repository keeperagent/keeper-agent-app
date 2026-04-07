import { MESSAGE } from "@/electron/constant";
import { encryptKeyCache } from "@/electron/service/encryptKeyCache";
import type {
  IpcGetEncryptKeyCachePayload,
  IpcSetEncryptKeyCachePayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const runEncryptKeyController = () => {
  onIpc<IpcGetEncryptKeyCachePayload>(
    MESSAGE.GET_ENCRYPT_KEY_CACHE,
    MESSAGE.GET_ENCRYPT_KEY_CACHE_RES,
    async (event, payload) => {
      const { campaignId } = payload;

      const value = encryptKeyCache.get(encryptKeyCache.getCacheKey(campaignId));

      event.reply(MESSAGE.GET_ENCRYPT_KEY_CACHE_RES, {
        campaignId,
        hasEncryptKey: Boolean(value),
        encryptKey: value || "",
      });
    },
  );

  onIpc<IpcSetEncryptKeyCachePayload>(
    MESSAGE.SET_ENCRYPT_KEY_CACHE,
    MESSAGE.SET_ENCRYPT_KEY_CACHE_RES,
    async (event, payload) => {
      const { campaignId, value } = payload;
      encryptKeyCache.set(encryptKeyCache.getCacheKey(campaignId), value);

      event.reply(MESSAGE.SET_ENCRYPT_KEY_CACHE_RES, {});
    },
  );
};
