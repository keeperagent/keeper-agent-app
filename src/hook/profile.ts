import { useRef, useState, useEffect } from "react";
import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import { actSaveGetListProfile, actSaveUpdateProfile } from "@/redux/profile";
import type { IpcGetListProfilePayload } from "@/electron/ipcTypes";
import { IProfile } from "@/electron/type";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";

const useGetListProfile = () => {
  const { execute: getListProfile, loading } =
    useIpcAction<IpcGetListProfilePayload>(
      MESSAGE.GET_LIST_PROFILE,
      MESSAGE.GET_LIST_PROFILE_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListProfile(payload?.data)),
      },
    );
  return { loading, getListProfile };
};

const useDeleteProfile = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_PROFILE,
    MESSAGE.DELETE_PROFILE_RES,
  );
  const deleteProfile = (listId: number[]) => execute({ data: listId });
  return { deleteProfile, loading, isSuccess };
};

const useUpdateProfile = () => {
  const profileRef = useRef<IProfile | null>(null);
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_PROFILE,
    MESSAGE.UPDATE_PROFILE_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (profileRef.current) {
          dispatch(
            actSaveUpdateProfile({
              ...profileRef.current,
              name: payload?.data?.name,
            }),
          );
          profileRef.current = null;
        }
      },
    },
  );
  const updateProfile = (data: IProfile) => {
    profileRef.current = data;
    execute({ data });
  };
  return { updateProfile, loading, isSuccess };
};

// Streaming hook — batches profiles in chunks until isDone, incompatible with useIpcAction.
const useCreateProfile = () => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [count, setCount] = useState(0);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      const { data = {} } = payload;
      if (data?.isDone) {
        setLoading(false);
        setIsSuccess(true);
      } else {
        setCount(data?.count);
        setLeft(data?.left);
      }
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.CREATE_PROFILE_RES,
      handler,
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  const createProfile = ({
    numberOfProfile,
    walletGroupId,
    listResourceGroupId,
    groupId,
  }: {
    numberOfProfile: number;
    walletGroupId: number;
    listResourceGroupId: number[];
    groupId: number;
  }) => {
    setLoading(true);
    setIsSuccess(false);
    window?.electron?.send(MESSAGE.CREATE_PROFILE, {
      numberOfProfile,
      walletGroupId,
      listResourceGroupId,
      groupId,
    });
  };

  return { createProfile, loading, isSuccess, count, left };
};

const useExportProfile = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.EXPORT_PROFILE,
    MESSAGE.EXPORT_PROFILE_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) {
          message?.error(error);
        } else {
          message.success(translate("hook.exportDataDone"));
        }
      },
    },
  );
  const exportProfile = ({
    folderPath,
    fileName,
    encryptKey,
    groupId,
  }: {
    folderPath: string;
    fileName: string;
    encryptKey?: string;
    groupId: number;
  }) => execute({ folderPath, fileName, encryptKey, groupId });
  return { loading, isSuccess, exportProfile };
};

export {
  useGetListProfile,
  useDeleteProfile,
  useUpdateProfile,
  useCreateProfile,
  useExportProfile,
};
