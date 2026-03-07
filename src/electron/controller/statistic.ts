import { countTotalData } from "@/electron/service/statistic";
import { MESSAGE } from "@/electron/constant";
import { onIpc } from "./helpers";

export const runStatisticController = () => {
  onIpc(
    MESSAGE.GET_STATISTIC,
    MESSAGE.GET_STATISTIC_RES,
    async (event, _payload) => {
      const [totalData, err] = await countTotalData();

      event.reply(MESSAGE.GET_STATISTIC_RES, {
        data: totalData,
        error: err,
      });
    },
  );
};
