import { MESSAGE } from "@/electron/constant";
import { actSaveGetStatistic } from "@/redux/preference";
import { useIpcAction } from "./useIpcAction";

const useGetStatistic = () => {
  const { execute: getStatistic, loading } = useIpcAction(
    MESSAGE.GET_STATISTIC,
    MESSAGE.GET_STATISTIC_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetStatistic(payload?.data)),
    },
  );
  return { loading, getStatistic };
};

export { useGetStatistic };
