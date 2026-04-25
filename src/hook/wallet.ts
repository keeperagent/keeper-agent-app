import { useState, useEffect } from "react";
import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import {
  actSaveCreateWallet,
  actSaveGetListWallet,
  actSaveUpdateWallet,
} from "@/redux/wallet";
import type { IpcGetListWalletPayload } from "@/electron/ipcTypes";
import { IWallet } from "@/electron/type";
import { SQL_FOREIGNKEY_ERROR } from "@/config/constant";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";

const useGetListWallet = () => {
  const { execute: getListWallet, loading } =
    useIpcAction<IpcGetListWalletPayload>(
      MESSAGE.GET_LIST_WALLET,
      MESSAGE.GET_LIST_WALLET_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListWallet(payload?.data)),
      },
    );
  return { loading, getListWallet };
};

const useImportWallet = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.IMPORT_WALLET,
    MESSAGE.IMPORT_WALLET_RES,
  );
  const importWallet = ({
    groupId,
    listFilePath,
    encryptKey,
  }: {
    groupId: number;
    listFilePath: string[];
    encryptKey?: string;
  }) => execute({ groupId, listFilePath, encryptKey });
  return { loading, isSuccess, importWallet };
};

const useExportWallet = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.EXPORT_WALLET,
    MESSAGE.EXPORT_WALLET_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) {
          message.error(error);
        } else {
          message.success(translate("hook.exportDataDone"));
        }
      },
    },
  );
  const exportWallet = ({
    folderPath,
    fileName,
    encryptKey,
    groupId,
    listWalletId,
  }: {
    folderPath: string;
    fileName: string;
    encryptKey?: string;
    groupId: number;
    listWalletId: number[];
  }) => execute({ folderPath, fileName, encryptKey, groupId, listWalletId });
  return { loading, isSuccess, exportWallet };
};

const useDeleteWallet = () => {
  const [hasDependencyError, setHasDependencyError] = useState(false);
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_WALLET,
    MESSAGE.DELETE_WALLET_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) {
          const errMessage = error?.message;
          if (errMessage === SQL_FOREIGNKEY_ERROR) {
            message.error(translate("wallet.canNotDeleteWallet"));
            setHasDependencyError(true);
          } else {
            message.error(errMessage);
            setHasDependencyError(false);
          }
        }
      },
    },
  );
  const deleteWallet = (listId: number[]) => execute({ data: listId });
  return {
    deleteWallet,
    loading,
    isSuccess,
    hasDependencyError,
    setHasDependencyError,
  };
};

const useUpdateWallet = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_WALLET,
    MESSAGE.UPDATE_WALLET_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveUpdateWallet(payload.data)),
    },
  );
  const updateWallet = (data: IWallet, encryptKey: string) =>
    execute({ data, encryptKey });
  return { updateWallet, loading, isSuccess };
};

const useCreateWallet = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_WALLET,
    MESSAGE.CREATE_WALLET_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveCreateWallet(payload?.data)),
    },
  );
  const createWallet = (data: IWallet, encryptKey?: string) =>
    execute({ data, encryptKey });
  return { createWallet, loading, isSuccess };
};

// Streaming hooks — each response chunk carries partial progress, so the
// standard fire-once pattern of useIpcAction doesn't apply here.
const useGenerateRandomWallet = () => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [count, setCount] = useState(0);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      const { data = {} } = payload;
      if (data?.isDone) {
        setIsSuccess(true);
        setLoading(false);
      } else {
        setCount(data?.count);
        setLeft(data?.left);
      }
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.GENERATE_RANDOM_WALLET_RES,
      handler,
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  const generateRandomWallet = ({
    total,
    groupId,
    encryptKey,
    chainType,
  }: {
    total: number;
    groupId: number;
    encryptKey?: string;
    chainType?: string;
  }) => {
    setLoading(true);
    setIsSuccess(false);
    window?.electron?.send(MESSAGE.GENERATE_RANDOM_WALLET, {
      total,
      groupId,
      encryptKey,
      chainType,
    });
  };

  return { generateRandomWallet, loading, isSuccess, count, left };
};

const useGenerateWalletFromPhrase = () => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [count, setCount] = useState(0);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      const { data = {} } = payload;
      if (data?.isDone) {
        setIsSuccess(true);
        setLoading(false);
        if (data?.error) {
          message.error(data?.error?.message);
        }
      } else {
        setCount(data?.count);
        setLeft(data?.left);
      }
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.GENERATE_WALLET_FROM_PHRASE_RES,
      handler,
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  const generateWalletFromPhrase = ({
    total,
    groupId,
    phrase,
    encryptKey,
    chainType,
  }: {
    total: number;
    groupId: number;
    phrase: string;
    encryptKey?: string;
    chainType?: string;
  }) => {
    setLoading(true);
    setIsSuccess(false);
    window?.electron?.send(MESSAGE.GENERATE_WALLET_FROM_PHRASE, {
      total,
      groupId,
      phrase,
      encryptKey,
      chainType,
    });
  };

  return { generateWalletFromPhrase, loading, isSuccess, count, left };
};

export {
  useGetListWallet,
  useUpdateWallet,
  useCreateWallet,
  useDeleteWallet,
  useGenerateRandomWallet,
  useGenerateWalletFromPhrase,
  useImportWallet,
  useExportWallet,
};
