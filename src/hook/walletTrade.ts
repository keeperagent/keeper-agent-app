import { useState } from "react";
import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import type { IpcGetWalletTradeReplayPayload } from "@/electron/ipcTypes";
import type { IWalletTradeReplay } from "@/electron/type";
import { useIpcAction } from "./useIpcAction";

const useGetWalletTradeReplay = () => {
  const [data, setData] = useState<IWalletTradeReplay | null>(null);

  const { execute, loading } = useIpcAction<
    IpcGetWalletTradeReplayPayload,
    { data?: IWalletTradeReplay }
  >(MESSAGE.GET_WALLET_TRADE_REPLAY, MESSAGE.GET_WALLET_TRADE_REPLAY_RES, {
    onSuccess: (payload) => setData(payload?.data || null),
    onError: (error) => message.error(error),
  });

  const reset = () => setData(null);

  return { data, loading, getWalletTradeReplay: execute, reset };
};

export { useGetWalletTradeReplay };
