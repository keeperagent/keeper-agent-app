import { ipcMain } from "electron";
import { whatsappService } from "@/electron/chatGateway/adapters/whatsapp";
import { WhatsAppAction } from "@/electron/chatGateway/types";
import { MESSAGE } from "@/electron/constant";

export const whatsappController = () => {
  ipcMain.on(
    MESSAGE.RESTART_WHATSAPP,
    async (_event, payload: { action?: WhatsAppAction } | undefined) => {
      const action = payload?.action || WhatsAppAction.START;

      if (action === WhatsAppAction.CONNECT) {
        whatsappService.connect();
      } else if (action === WhatsAppAction.DISCONNECT) {
        whatsappService.disconnect();
      } else if (action === WhatsAppAction.STATUS) {
        whatsappService.emitStatus();
      } else {
        whatsappService.start();
      }
    },
  );
};
