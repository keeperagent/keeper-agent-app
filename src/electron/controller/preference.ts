import { ipcMain } from "electron";
import { preferenceDB } from "@/electron/database/preference";
import { browserDownloader } from "@/electron/service/browserDownloader";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import { IpcUpdatePreferencePayload } from "@/electron/ipcTypes";
import { onIpc } from "./helpers";
import { recreateAllAgents } from "./appAgent";

export const perferenceController = () => {
  ipcMain.on(MESSAGE.INIT_PREFERENCE, async (_event, _payload) => {
    const [preference] = await preferenceDB.getOnePreference();

    if (!preference) {
      await preferenceDB.createPreference({
        nodeBlackList: [],
        maxConcurrentJob: 50,
        maxLogAge: 15,
        maxHistoryLogAge: 30,
      });
    }
  });

  onIpc(
    MESSAGE.GET_ONE_PREFERENCE,
    MESSAGE.GET_ONE_PREFERENCE_RES,
    async (event, _payload) => {
      const [res] = await preferenceDB.getOnePreference();

      let downloaded: any = false;
      if (res?.browserRevision) {
        downloaded = browserDownloader?.revisionInfo(
          res?.browserRevision,
        )?.downloaded;
      }

      event.reply(MESSAGE.GET_ONE_PREFERENCE_RES, {
        data: { ...res, isRevisionDownloaded: Boolean(downloaded) },
      });
    },
  );

  onIpc<IpcUpdatePreferencePayload>(
    MESSAGE.UPDATE_PREFERENCE,
    MESSAGE.UPDATE_PREFERENCE_RES,
    async (event, payload) => {
      const { requestId, data, isUpdateAgentTool } = payload;
      const [res, err] = await preferenceDB.updatePreference(data);

      if (err) {
        event.reply(MESSAGE.UPDATE_PREFERENCE_RES, {
          code: RESPONSE_CODE.DUPLICATE_ERROR,
          requestId,
        });
        return;
      }

      let downloaded: any = false;
      if (res?.browserRevision) {
        downloaded = browserDownloader?.revisionInfo(
          res?.browserRevision,
        )?.downloaded;
      }

      event.reply(MESSAGE.UPDATE_PREFERENCE_RES, {
        data: { ...res, isRevisionDownloaded: Boolean(downloaded) },
        requestId,
      });

      if (isUpdateAgentTool) {
        recreateAllAgents();
      }
    },
  );
};
