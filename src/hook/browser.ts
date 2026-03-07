import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { message } from "antd";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import { actSaveDownloadStatus } from "@/redux/browser";
import { useTranslation } from "./useTranslation";

const useDownloadBrowser = () => {
  const [loading, setLoading] = useState(false);
  const [isExist, setRevisionExist] = useState(false);
  const dispatch = useDispatch();
  const { translate, locale } = useTranslation();

  useEffect(() => {
    window?.electron?.on(
      MESSAGE.DOWNLOAD_BROWSER_RES,
      (event: any, payload: any) => {
        const { data = {}, isDone, code, isAvailable } = payload;

        if (code === RESPONSE_CODE.OBJECT_EXISTED) {
          setLoading(false);
          setRevisionExist(true);
          message.info(translate("browser.isExistOnDevice"));

          dispatch(
            actSaveDownloadStatus({
              ...data,
              isDone: true,
              isProcessing: false,
              isAvailable: true,
            }),
          );

          return;
        }

        if (isDone) {
          setLoading(false);

          if (!isAvailable) {
            message.error(translate("browser.notExist"));
          }
        }

        dispatch(
          actSaveDownloadStatus({
            ...data,
            isDone,
            isProcessing: !isDone,
            isAvailable,
          }),
        );
      },
    );

    return () => {
      window?.electron?.removeAllListeners(MESSAGE.DOWNLOAD_BROWSER_RES);
    };
  }, [locale]);

  const downloadBrowser = (revision: string) => {
    setRevisionExist(false);
    setLoading(true);
    window?.electron?.send(MESSAGE.DOWNLOAD_BROWSER, {
      revision,
    });
  };

  return {
    downloadBrowser,
    loading,
    isExist,
  };
};

export { useDownloadBrowser };
