import { MESSAGE } from "@/electron/constant";
import { globalSearch } from "@/electron/service/search";
import type { IpcGlobalSearchPayload } from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const searchController = () => {
  onIpc<IpcGlobalSearchPayload>(
    MESSAGE.GLOBAL_SEARCH,
    MESSAGE.GLOBAL_SEARCH_RES,
    async (event, payload) => {
      const { searchText } = payload;
      const [result, error] = await globalSearch(searchText);

      event.reply(MESSAGE.GLOBAL_SEARCH_RES, {
        data: result,
        error: error?.message,
      });
    },
  );
};
