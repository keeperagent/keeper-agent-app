import { useState } from "react";
import { uid } from "uid/secure";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
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

    await new Promise<void>((resolve) => {
      const handler = (_event: any, payload: any) => {
        const { requestId } = payload;
        if (requestId !== uniqueID) {
          return;
        }
        window?.electron?.removeListener(
          MESSAGE.UPDATE_PREFERENCE_RES,
          handler,
        );
        setLoading(false);
        if (payload?.code === RESPONSE_CODE.DUPLICATE_ERROR || !payload?.data) {
          setIsSuccess(false);
          resolve();
          return;
        }
        setIsSuccess(true);
        dispatch(actSaveUpdatePreference(payload?.data));
        resolve();
      };
      window?.electron?.on(MESSAGE.UPDATE_PREFERENCE_RES, handler);
    });
  };

  return { updatePreference, loading, isSuccess };
};

const useCheckClaudeCLIAvailable = () => {
  const checkClaudeCLIAvailable = (): Promise<boolean> =>
    new Promise((resolve) => {
      const uniqueID = uid(25);
      window?.electron?.send(MESSAGE.CHECK_CLAUDE_CLI_AVAILABLE, {
        requestId: uniqueID,
      });
      const handler = (_event: any, payload: any) => {
        if (payload?.requestId !== uniqueID) {
          return;
        }
        window?.electron?.removeListener(
          MESSAGE.CHECK_CLAUDE_CLI_AVAILABLE_RES,
          handler,
        );
        resolve(Boolean(payload?.data));
      };
      window?.electron?.on(MESSAGE.CHECK_CLAUDE_CLI_AVAILABLE_RES, handler);
    });

  return { checkClaudeCLIAvailable };
};

const useCheckCodexCLIAvailable = () => {
  const checkCodexCLIAvailable = (): Promise<boolean> =>
    new Promise((resolve) => {
      const uniqueID = uid(25);
      window?.electron?.send(MESSAGE.CHECK_CODEX_CLI_AVAILABLE, {
        requestId: uniqueID,
      });
      const handler = (_event: any, payload: any) => {
        if (payload?.requestId !== uniqueID) {
          return;
        }
        window?.electron?.removeListener(
          MESSAGE.CHECK_CODEX_CLI_AVAILABLE_RES,
          handler,
        );
        resolve(Boolean(payload?.data));
      };
      window?.electron?.on(MESSAGE.CHECK_CODEX_CLI_AVAILABLE_RES, handler);
    });

  return { checkCodexCLIAvailable };
};

export {
  useGetPreference,
  useUpdatePreference,
  useCheckClaudeCLIAvailable,
  useCheckCodexCLIAvailable,
};
