import { useState } from "react";
import { uid } from "uid/secure";
import { MESSAGE } from "@/electron/constant";
import {
  actSaveGetOnePreference,
  actSaveUpdatePreference,
} from "@/redux/preference";
import { IPreference } from "@/electron/type";
import { useIpcAction } from "./useIpcAction";
import { useDispatch } from "react-redux";

const useGetPreference = () => {
  const { execute: getPreference, loading } = useIpcAction(
    MESSAGE.GET_ONE_PREFERENCE,
    MESSAGE.GET_ONE_PREFERENCE_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetOnePreference(payload?.data)),
    },
  );
  return { loading, getPreference };
};

// Uses a unique requestId to correlate concurrent updates — not compatible
// with the shared listener pattern used by useIpcAction.
const useUpdatePreference = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const updatePreference = async (
    data: IPreference,
    isUpdateAgentTool?: boolean,
  ) => {
    setLoading(true);
    setIsSuccess(false);

    const uniqueID = uid(25);
    window?.electron?.send(MESSAGE.UPDATE_PREFERENCE, {
      data,
      requestId: uniqueID,
      isUpdateAgentTool,
    });

    await new Promise(async (resolve) => {
      window?.electron?.on(
        MESSAGE.UPDATE_PREFERENCE_RES,
        (event: any, payload: any) => {
          const { requestId } = payload;
          if (requestId !== uniqueID) {
            return;
          }
          setLoading(false);
          setIsSuccess(true);
          dispatch(actSaveUpdatePreference(payload?.data));
          resolve(true);
        },
      );
    });

    window?.electron?.removeAllListeners(MESSAGE.UPDATE_PREFERENCE_RES);
  };

  return { updatePreference, loading, isSuccess };
};

export { useGetPreference, useUpdatePreference };
