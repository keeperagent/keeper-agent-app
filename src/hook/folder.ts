import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { MESSAGE } from "@/electron/constant";
import {
  actSaveBrowserFolderStatistic,
  actSaveDatabaseStatistic,
  actSaveExtensionFolderStatistic,
  actSaveProfileFolderStatistic,
  actSaveTempFolderStatistic,
  actSaveSkillFolderStatistic,
  actSaveFolderPath,
} from "@/redux/folder";
import { message } from "antd";

const FOLDER_CONFIG = {
  profile: {
    req: MESSAGE.GET_PROFILE_FOLDER_STATISTIC,
    res: MESSAGE.GET_PROFILE_FOLDER_STATISTIC_RES,
    saveAction: actSaveProfileFolderStatistic,
  },
  extension: {
    req: MESSAGE.GET_EXTENSION_FOLDER_STATISTIC,
    res: MESSAGE.GET_EXTENSION_FOLDER_STATISTIC_RES,
    saveAction: actSaveExtensionFolderStatistic,
  },
  temp: {
    req: MESSAGE.GET_TEMP_FOLDER_STATISTIC,
    res: MESSAGE.GET_TEMP_FOLDER_STATISTIC_RES,
    saveAction: actSaveTempFolderStatistic,
  },
  skill: {
    req: MESSAGE.GET_SKILL_FOLDER_STATISTIC,
    res: MESSAGE.GET_SKILL_FOLDER_STATISTIC_RES,
    saveAction: actSaveSkillFolderStatistic,
  },
  browser: {
    req: MESSAGE.GET_BROWSER_FOLDER_STATISTIC,
    res: MESSAGE.GET_BROWSER_FOLDER_STATISTIC_RES,
    saveAction: actSaveBrowserFolderStatistic,
  },
};

export type FolderType = keyof typeof FOLDER_CONFIG;

const useGetFolderStatistic = (folderType: FolderType) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { req, res, saveAction } = FOLDER_CONFIG[folderType];

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      setLoading(false);
      const { data, error, totalFolder, totalSize } = payload;
      if (error) {
        message?.error(error);
        return;
      }
      dispatch(saveAction({ listFolder: data, totalFolder, totalSize }));
    };
    window?.electron?.on(res, handler);

    return () => {
      window?.electron?.removeListener(res, handler);
    };
  }, []);

  const getFolderStatistic = (limit: number) => {
    setLoading(true);
    window?.electron?.send(req, { limit });
  };

  return { loading, getFolderStatistic };
};

const useGetDatabaseFileStatistic = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      setLoading(false);
      const { data } = payload;
      dispatch(actSaveDatabaseStatistic(data));
    };
    window?.electron?.on(MESSAGE.GET_DATABASE_FILE_STATISTIC_RES, handler);

    return () => {
      window?.electron?.removeListener(
        MESSAGE.GET_DATABASE_FILE_STATISTIC_RES,
        handler,
      );
    };
  }, []);

  const getDatabaseFileStatistic = () => {
    setLoading(true);
    window?.electron?.send(MESSAGE.GET_DATABASE_FILE_STATISTIC);
  };

  return { loading, getDatabaseFileStatistic };
};

const useGetFolderPath = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      setLoading(false);
      const { data } = payload;
      dispatch(actSaveFolderPath(data));
    };
    window?.electron?.on(MESSAGE.GET_FOLDER_PATH_RES, handler);

    return () => {
      window?.electron?.removeListener(MESSAGE.GET_FOLDER_PATH_RES, handler);
    };
  }, []);

  const getFolderPath = () => {
    setLoading(true);
    window?.electron?.send(MESSAGE.GET_FOLDER_PATH);
  };

  return { loading, getFolderPath };
};

export { useGetFolderStatistic, useGetDatabaseFileStatistic, useGetFolderPath };
