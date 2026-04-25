import { useEffect, useState } from "react";
import { MESSAGE } from "@/electron/constant";
import { sleep } from "@/service/util";
import type { AttachedFile } from "@/component/AgentChatView/AttachedFiles";

const useChooseFolder = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (_event: any, _payload: any) => {
      setLoading(false);
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.CHOOSE_FOLDER_RES,
      handler,
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  const chooseFolder = async (): Promise<string | null> => {
    setLoading(true);
    window?.electron?.send(MESSAGE.CHOOSE_FOLDER);

    let isDone = false;
    let folderPath: string | null = null;
    await new Promise(async (resolve) => {
      const unsubscribe = window?.electron?.on(
        MESSAGE.CHOOSE_FOLDER_RES,
        (_event: any, payload: any) => {
          const { data } = payload;
          folderPath = data;

          setLoading(false);
          isDone = true;
        },
      );

      while (!isDone) {
        await sleep(10);
      }

      unsubscribe?.();
      resolve(true);
    });

    return folderPath;
  };

  return { loading, chooseFolder };
};

const useSaveClipboardImage = () => {
  const saveClipboardImage = async (
    base64: string,
    mimeType: string,
    previewUrl: string,
  ): Promise<AttachedFile | null> => {
    const requestId = crypto.randomUUID();
    window.electron.send(MESSAGE.SAVE_CLIPBOARD_IMAGE, {
      base64,
      mimeType,
      requestId,
    });

    let isDone = false;
    let result: AttachedFile | null = null;

    await new Promise(async (resolve) => {
      const unsubscribe = window?.electron?.on(
        MESSAGE.SAVE_CLIPBOARD_IMAGE_RES,
        (_event: any, payload: any) => {
          if (payload?.requestId !== requestId) {
            return;
          }
          const data = payload?.data;
          if (data) {
            result = {
              path: data.path,
              name: data.name,
              extension: data.extension,
              type: "image",
              previewUrl,
              isTemp: true,
            };
          }
          isDone = true;
        },
      );

      while (!isDone) {
        await sleep(10);
      }

      unsubscribe?.();
      resolve(true);
    });

    return result;
  };

  return { saveClipboardImage };
};

const useReadFileAsDataUrl = () => {
  const readFileAsDataUrl = async (
    filePath: string,
  ): Promise<string | null> => {
    const requestId = crypto.randomUUID();
    window.electron.send(MESSAGE.READ_FILE_AS_DATA_URL, {
      path: filePath,
      requestId,
    });

    let isDone = false;
    let dataUrl: string | null = null;

    await new Promise(async (resolve) => {
      const unsubscribe = window?.electron?.on(
        MESSAGE.READ_FILE_AS_DATA_URL_RES,
        (_event: any, payload: any) => {
          if (payload?.requestId !== requestId) {
            return;
          }
          dataUrl = payload?.dataUrl || null;
          isDone = true;
        },
      );

      while (!isDone) {
        await sleep(10);
      }

      unsubscribe?.();
      resolve(true);
    });

    return dataUrl;
  };

  return { readFileAsDataUrl };
};

export { useChooseFolder, useSaveClipboardImage, useReadFileAsDataUrl };
