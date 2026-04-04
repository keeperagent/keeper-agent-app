import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import { browserDownloader } from "@/electron/service/browserDownloader";
import { ensureBaseProfile } from "@/electron/simulator/workflowRunner/baseBrowser";
import { onIpc } from "./helpers";
import type { IpcDownloadBrowserPayload } from "@/electron/ipcTypes";

export const browserController = () => {
  onIpc(
    MESSAGE.CHECK_BROWSER_INSTALLED,
    MESSAGE.CHECK_BROWSER_INSTALLED_RES,
    async (event) => {
      event.reply(MESSAGE.CHECK_BROWSER_INSTALLED_RES, {
        isAvailable: browserDownloader.isChromiumInstalled(),
      });
    },
  );

  onIpc<IpcDownloadBrowserPayload>(
    MESSAGE.DOWNLOAD_BROWSER,
    MESSAGE.DOWNLOAD_BROWSER_RES,
    async (event) => {
      const isInstalled = browserDownloader.isChromiumInstalled();
      if (isInstalled) {
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

      const isAvailable = await browserDownloader.downloadChromium(callback);
      if (isAvailable) {
        await ensureBaseProfile();
      }

      event.reply(MESSAGE.DOWNLOAD_BROWSER_RES, {
        isDone: true,
        isAvailable,
      });
    },
  );
};
