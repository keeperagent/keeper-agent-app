import { ipcMain } from "electron";
import { telegramBotService } from "@/electron/chatGateway/adapters/telegram";
import { MESSAGE } from "@/electron/constant";

export const telegramController = () => {
  ipcMain.on(MESSAGE.RESTART_TELEGRAM_BOT, async (_event, _payload) => {
    telegramBotService.start();
  });
};
