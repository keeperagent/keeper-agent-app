import { walletActivityDB } from "@/electron/database/walletActivity";
import { MESSAGE } from "@/electron/constant";
import type { IpcGetListWalletActivityPayload } from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const walletActivityController = () => {
  onIpc<IpcGetListWalletActivityPayload>(
    MESSAGE.GET_LIST_WALLET_ACTIVITY,
    MESSAGE.GET_LIST_WALLET_ACTIVITY_RES,
    async (event, payload) => {
      const { page, pageSize, walletAddress, walletGroupId, searchText } =
        payload;
      const [res, err] = await walletActivityDB.getListWalletActivity(
        page,
        pageSize,
        walletAddress,
        walletGroupId,
        searchText,
      );
      if (err) {
        event.reply(MESSAGE.GET_LIST_WALLET_ACTIVITY_RES, {
          error: err?.message || "Failed to get wallet activity",
        });
        return;
      }
      event.reply(MESSAGE.GET_LIST_WALLET_ACTIVITY_RES, {
        data: res,
      });
    },
  );
};
