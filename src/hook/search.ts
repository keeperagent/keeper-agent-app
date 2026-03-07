import { MESSAGE } from "@/electron/constant";
import { actSaveGlobalSearchResult } from "@/redux/search";
import type { IpcGlobalSearchPayload } from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGlobalSearch = () => {
  const { execute: globalSearch, loading } =
    useIpcAction<IpcGlobalSearchPayload>(
      MESSAGE.GLOBAL_SEARCH,
      MESSAGE.GLOBAL_SEARCH_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGlobalSearchResult(payload?.data)),
      },
    );
  return { loading, globalSearch };
};

export { useGlobalSearch };
