import { ipcMain, BrowserWindow } from "electron";
import { preferenceDB } from "@/electron/database/preference";
import { browserDownloader } from "@/electron/service/browserDownloader";
import { MESSAGE, RESPONSE_CODE, DEFAULT_MCP_PORT } from "@/electron/constant";
import { IpcUpdatePreferencePayload } from "@/electron/ipcTypes";
import { onIpc } from "./helpers";
import { recreateAllAgents } from "./appAgent";
import { keeperMcpServer } from "@/electron/mcpServer/index";
import { logEveryWhere } from "../service/util";

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

      event.reply(MESSAGE.GET_ONE_PREFERENCE_RES, {
        data: { ...res, isRevisionDownloaded: browserDownloader.isChromiumInstalled() },
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

      event.reply(MESSAGE.UPDATE_PREFERENCE_RES, {
        data: { ...res, isRevisionDownloaded: browserDownloader.isChromiumInstalled() },
        requestId,
      });

      if (isUpdateAgentTool) {
        recreateAllAgents();
      }

      if (Boolean(data?.isMcpServerOn) && !keeperMcpServer.getIsRunning()) {
        const port = res?.mcpServerPort || DEFAULT_MCP_PORT;
        keeperMcpServer.start(port).catch((err) => {
          logEveryWhere({
            message: `Failed to start Keeper MCP server: ${err?.message}`,
          });
        });
      } else if (!data?.isMcpServerOn && keeperMcpServer.getIsRunning()) {
        keeperMcpServer.stop().catch((err) => {
          logEveryWhere({
            message: `Failed to stop Keeper MCP server: ${err?.message}`,
          });
        });
      }

      if (data?.isScreenCaptureProtectionOn !== undefined) {
        const enabled = Boolean(res?.isScreenCaptureProtectionOn);
        for (const win of BrowserWindow.getAllWindows()) {
          win.setContentProtection(enabled);
        }
      }
    },
  );
};

export const applyScreenCaptureProtection = async (
  targetWindow?: BrowserWindow,
) => {
  try {
    const [preference] = await preferenceDB.getOnePreference();
    const enabled = Boolean(preference?.isScreenCaptureProtectionOn);
    const windows = targetWindow
      ? [targetWindow]
      : BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.setContentProtection(enabled);
    }
  } catch (err: any) {
    logEveryWhere({
      message: `Failed to apply screen capture protection: ${err?.message}`,
    });
  }
};
