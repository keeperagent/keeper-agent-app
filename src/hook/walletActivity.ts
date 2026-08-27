import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import { actSaveGetListWalletActivity } from "@/redux/walletActivity";
import type { IpcGetListWalletActivityPayload } from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGetListWalletActivity = () => {
  const { execute: getListWalletActivity, loading } =
    useIpcAction<IpcGetListWalletActivityPayload>(
      MESSAGE.GET_LIST_WALLET_ACTIVITY,
      MESSAGE.GET_LIST_WALLET_ACTIVITY_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListWalletActivity(payload?.data)),
        onError: (error) => message.error(error),
      },
    );
  return { loading, getListWalletActivity };
};

export { useGetListWalletActivity };
