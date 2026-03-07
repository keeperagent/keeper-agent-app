import { useEffect, useState } from "react";
import { MESSAGE } from "@/electron/constant";
import { sleep } from "@/service/util";

const useChooseFolder = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window?.electron?.on(
      MESSAGE.CHOOSE_FOLDER_RES,
      (_event: any, _payload: any) => {
        setLoading(false);
      },
    );

    return () => {
      window?.electron?.removeAllListeners(MESSAGE.CHOOSE_FOLDER_RES);
    };
  }, []);

  const chooseFolder = async (): Promise<string | null> => {
    setLoading(true);
    window?.electron?.send(MESSAGE.CHOOSE_FOLDER);

    let isDone = false;
    let folderPath: string | null = null;
    await new Promise(async (resolve) => {
      window?.electron?.on(
        MESSAGE.CHOOSE_FOLDER_RES,
        (event: any, payload: any) => {
          const { data } = payload;
          folderPath = data;

          setLoading(false);
          isDone = true;
        },
      );

      while (!isDone) {
        await sleep(10);
      }

      resolve(true);
    });

    return folderPath;
  };

  return { loading, chooseFolder };
};

export { useChooseFolder };
