import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import { preferenceDB } from "@/electron/database/preference";
import { browserDownloader } from "@/electron/service/browserDownloader";
import { onIpc } from "./helpers";
import type { IpcDownloadBrowserPayload } from "@/electron/ipcTypes";

export const browserController = () => {
  onIpc<IpcDownloadBrowserPayload>(
    MESSAGE.DOWNLOAD_BROWSER,
    MESSAGE.DOWNLOAD_BROWSER_RES,
    async (event, payload) => {
      const { revision } = payload;

      const isDownloaded = browserDownloader.revisionInfo(revision)?.downloaded;
      if (isDownloaded) {
        event.reply(MESSAGE.DOWNLOAD_BROWSER_RES, {
          isDone: true,
          code: RESPONSE_CODE.OBJECT_EXISTED,
          isAvailable: true,
        });
        return;
      }

      const callback = (downloadedBytes: number, totalBytes: number) => {
        event.reply(MESSAGE.DOWNLOAD_BROWSER_RES, {
          data: { downloadedBytes, totalBytes },
          isDone: false,
        });
      };

      const isAvailable = await browserDownloader.downloadRevision(
        revision,
        callback,
      );

      if (isAvailable) {
        const [preference] = await preferenceDB.getOnePreference();
        await preferenceDB.updatePreference({
          ...preference,
          browserRevision: revision,
        });
      }

      event.reply(MESSAGE.DOWNLOAD_BROWSER_RES, {
        isDone: true,
        isAvailable,
      });
    },
  );
};
