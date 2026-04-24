import { ipcMain, BrowserWindow } from "electron";
import { preferenceService } from "@/electron/service/preference";
import { browserDownloader } from "@/electron/service/browserDownloader";
import { MESSAGE, RESPONSE_CODE, DEFAULT_MCP_PORT } from "@/electron/constant";
import { IpcUpdatePreferencePayload } from "@/electron/ipcTypes";
import { keeperMcpServer } from "@/electron/mcpServer/index";
import { logEveryWhere } from "@/electron/service/util";
import { LLMProvider } from "@/electron/type";
import { claudeCliAuth } from "@/electron/agentCore/claudeCli/claudeCliAuth";
import { codexCliAuth } from "@/electron/agentCore/codexCli/codexCliAuth";
import { onIpc } from "./helpers";
import { recreateAllAgents } from "./appAgent";

export const perferenceController = () => {
  ipcMain.on(MESSAGE.INIT_PREFERENCE, async (_event, _payload) => {
    const [preference] = await preferenceService.getOnePreference();

    if (!preference || !preference?.maxConcurrentJob) {
      await preferenceService.updatePreference({
        nodeBlackList: preference?.nodeBlackList || [],
        maxConcurrentJob: 30,
        maxLogAge: preference?.maxLogAge || 15,
        maxHistoryLogAge: preference?.maxHistoryLogAge || 30,
        llmProvider: LLMProvider.CLAUDE,
      });
    }
  });

  onIpc(
    MESSAGE.GET_ONE_PREFERENCE,
    MESSAGE.GET_ONE_PREFERENCE_RES,
    async (event, _payload) => {
      const [res] = await preferenceService.getOnePreference();

      event.reply(MESSAGE.GET_ONE_PREFERENCE_RES, {
        data: {
          ...res,
          isChromeDownloaded: browserDownloader.isChromiumInstalled(),
        },
      });
    },
  );

  onIpc<IpcUpdatePreferencePayload>(
    MESSAGE.UPDATE_PREFERENCE,
    MESSAGE.UPDATE_PREFERENCE_RES,
    async (event, payload) => {
      const { requestId, data, recreateAgents } = payload;
      const [res, err] = await preferenceService.updatePreference(data);

      if (err) {
        event.reply(MESSAGE.UPDATE_PREFERENCE_RES, {
          code: RESPONSE_CODE.DUPLICATE_ERROR,
          requestId,
        });
        return;
      }

      event.reply(MESSAGE.UPDATE_PREFERENCE_RES, {
        data: {
          ...res,
          isChromeDownloaded: browserDownloader.isChromiumInstalled(),
        },
        requestId,
      });

      if (recreateAgents) {
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

  onIpc(
    MESSAGE.CHECK_CLAUDE_CLI_AVAILABLE,
    MESSAGE.CHECK_CLAUDE_CLI_AVAILABLE_RES,
    async (event, payload) => {
      event.reply(MESSAGE.CHECK_CLAUDE_CLI_AVAILABLE_RES, {
        data: claudeCliAuth.isAvailable(),
        requestId: payload?.requestId,
      });
    },
  );

  onIpc(
    MESSAGE.CHECK_CODEX_CLI_AVAILABLE,
    MESSAGE.CHECK_CODEX_CLI_AVAILABLE_RES,
    async (event, payload) => {
      event.reply(MESSAGE.CHECK_CODEX_CLI_AVAILABLE_RES, {
        data: codexCliAuth.isAvailable(),
        requestId: payload?.requestId,
      });
    },
  );
};

export const applyScreenCaptureProtection = async (
  targetWindow?: BrowserWindow,
) => {
  try {
    const [preference] = await preferenceService.getOnePreference();
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
