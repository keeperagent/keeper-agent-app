import { getWalletTradeReplay } from "@/electron/service/walletTrade";
import { MESSAGE } from "@/electron/constant";
import type { IpcGetWalletTradeReplayPayload } from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const walletTradeController = () => {
  onIpc<IpcGetWalletTradeReplayPayload>(
    MESSAGE.GET_WALLET_TRADE_REPLAY,
    MESSAGE.GET_WALLET_TRADE_REPLAY_RES,
    async (event, payload) => {
      const { walletAddress, chain, tokenAddress, singleTradeDetail } = payload;
      const [res, err] = await getWalletTradeReplay(
        walletAddress,
        chain,
        tokenAddress,
        singleTradeDetail,
      );
      if (err) {
        event.reply(MESSAGE.GET_WALLET_TRADE_REPLAY_RES, {
          error: err?.message || "Failed to get wallet trade PnL",
        });
        return;
      }
      event.reply(MESSAGE.GET_WALLET_TRADE_REPLAY_RES, {
        data: res,
      });
    },
  );
};
