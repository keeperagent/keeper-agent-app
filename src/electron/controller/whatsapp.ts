import { ipcMain } from "electron";
import { whatsappService } from "@/electron/chatGateway/adapters/whatsapp";
import { MESSAGE } from "@/electron/constant";

export const whatsappController = () => {
  ipcMain.on(MESSAGE.RESTART_WHATSAPP, async () => {
    whatsappService.start();
  });
};
