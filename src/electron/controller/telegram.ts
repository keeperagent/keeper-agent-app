import { ipcMain } from "electron";
import { telegramBotService } from "@/electron/service/telegramBot";
import { MESSAGE } from "@/electron/constant";

export const telegramController = () => {
  ipcMain.on(MESSAGE.RESTART_TELEGRAM_BOT, async (_event, _payload) => {
    telegramBotService.start();
  });
};
