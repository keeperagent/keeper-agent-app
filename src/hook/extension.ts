import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  MESSAGE,
  RESPONSE_CODE,
  EXTENSION_NAME_SEARCH,
} from "@/electron/constant";
import { actSaveGetListExtension } from "@/redux/extension";
import type { IpcGetListExtensionPayload } from "@/electron/ipcTypes";
import { IFile } from "@/types/interface";
import { actSetMapExtensionID } from "@/redux/workflowRunner";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";

const useGetListExtension = () => {
  const { execute, loading } = useIpcAction<IpcGetListExtensionPayload>(
    MESSAGE.GET_LIST_EXTENSION,
    MESSAGE.GET_LIST_EXTENSION_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetListExtension(payload?.data)),
    },
  );
  const getListExtension = ({ searchText }: { searchText?: string }) =>
    execute({ searchText });
  return { loading, getListExtension };
};

const useDeleteExtension = () => {
  const [listDeletedId, setListDeletedId] = useState<number[]>([]);
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_EXTENSION,
    MESSAGE.DELETE_EXTENSION_RES,
  );
  const deleteExtension = (listId: number[]) => {
    setListDeletedId(listId);
    execute({ data: listId });
  };
  return { deleteExtension, loading, isSuccess, listDeletedId };
};

// Streaming import with chunk progress and per-file error codes — incompatible
// with the fire-once pattern of useIpcAction.
const useImportExtension = () => {
  const [downloadedPercentage, setDownloadedPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isGetExtensionIdSuccess, setIsGetExtensionIdSuccess] = useState<
    boolean | any
  >(null);
  const [isGetExtensionId, setIsGetExtensionId] = useState<boolean>(false);
  const [mapErrorWithFile, setError] = useState<{ [key: number]: string }>({});
  const [error, setErrorMessage] = useState<string | null>(null);

  const dispatch = useDispatch();
  const { translate } = useTranslation();

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      const {
        data = {},
        code,
        isDone,
        isSuccess: success,
        isGettingExtensionId,
        percentage,
        error,
      } = payload;
      setIsGetExtensionId(Boolean(isGettingExtensionId));
      if (percentage) {
        setDownloadedPercentage(percentage);
      }
      if (isDone) {
        setLoading(false);
        setIsUploaded(true);
        setIsSuccess(success);
      }
      if (isSuccess) {
        setErrorMessage("");
      } else {
        setErrorMessage(error);
      }
      if (code === RESPONSE_CODE.INVALID_FILE_TYPE) {
        setError((prev) => ({
          ...prev,
          [data?.index]: translate("hook.formatFileError"),
        }));
      } else if (code === RESPONSE_CODE.NOT_EXTENSION) {
        setError((prev) => ({
          ...prev,
          [data?.index]: translate("hook.notExtension"),
        }));
      } else if (code === RESPONSE_CODE.DATABASE_ERROR) {
        setError((prev) => ({
          ...prev,
          [data?.index]: translate("hook.cannotSaveExtension"),
        }));
      }
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.IMPORT_EXTENSION_RES,
      handler,
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  const importExtension = (listFile: IFile[] | { link: string }[]) => {
    setDownloadedPercentage(0);
    setLoading(true);
    setIsSuccess(null);
    setIsUploaded(false);
    window?.electron?.send(MESSAGE.IMPORT_EXTENSION, { listFile });
  };

  const cancelImportExtension = () => {
    window?.electron?.send(MESSAGE.CANCEL_IMPORT_EXTENSION, {});
    setLoading(false);
    setDownloadedPercentage(0);
    setIsSuccess(null);
  };

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      const { isGetIdSuccess, res } = payload;
      setIsGetExtensionIdSuccess(isGetIdSuccess);
      if (isGetIdSuccess) {
        dispatch(actSaveGetListExtension(res));
      }
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.GET_EXTENSION_ID_ON_BROWSER_RES,
      handler,
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  const getExtensionId = (extensionPath: string, id?: number) => {
    setIsGetExtensionId(true);
    window?.electron?.send(MESSAGE.GET_EXTENSION_ID_ON_BROWSER, {
      extensionPath,
      id,
    });
  };

  return {
    importExtension,
    cancelImportExtension,
    getExtensionId,
    loading,
    isSuccess,
    isUploaded,
    mapErrorWithFile,
    isGetExtensionIdSuccess,
    isGetExtensionId,
    downloadedPercentage,
    error,
  };
};

const useCreateBaseProfileExtension = () => {
  const [isCreateBaseSuccess, setIsCreateBaseSuccess] = useState(false);
  const { execute: createBaseProfileExtension, loading } = useIpcAction(
    MESSAGE.CREATE_BASE_PROFILE_EXTENSION,
    MESSAGE.CREATE_BASE_PROFILE_EXTENSION_RES,
    {
      onSuccess: (payload) =>
        setIsCreateBaseSuccess(payload?.isCreateBaseSuccess || false),
    },
  );
  return {
    isLoadingCreateBase: loading,
    isCreateBaseSuccess,
    createBaseProfileExtension,
  };
};

const useGetListExtensionByName = () => {
  const { execute, loading } = useIpcAction(
    MESSAGE.GET_LIST_EXTENSIONB_BY_NAME,
    MESSAGE.GET_LIST_EXTENSIONB_BY_NAME_RES,
    {
      onSuccess: ({ data }: any, dispatch) => {
        if (!data) return;
        const mapExtensionID: { [key: string]: string } = {};
        Object?.keys(data)?.forEach((extensionNameSearch: string) => {
          Object.keys(EXTENSION_NAME_SEARCH)?.forEach(
            (extensionKey: string) => {
              if (EXTENSION_NAME_SEARCH[extensionKey] === extensionNameSearch) {
                mapExtensionID[extensionKey] = data[extensionNameSearch];
              }
            },
          );
        });
        dispatch(actSetMapExtensionID(mapExtensionID));
      },
    },
  );
  const getListExtensionByName = (listExtensionName: string[]) =>
    execute({ listExtensionName });
  return { loading, getListExtensionByName };
};

export {
  useGetListExtension,
  useDeleteExtension,
  useImportExtension,
  useGetListExtensionByName,
  useCreateBaseProfileExtension,
};
