import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import {
  actSaveCreateResource,
  actSaveGetListResource,
  actSaveUpdateResource,
} from "@/redux/resource";
import type { IpcGetListResourcePayload } from "@/electron/ipcTypes";
import { IResource } from "@/electron/type";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";

const useImportResource = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.IMPORT_RESOURCE,
    MESSAGE.IMPORT_RESOURCE_RES,
    {
      onError: (errorMsg) => {
        message?.error(errorMsg);
      },
    },
  );
  const importResource = ({
    groupId,
    listFilePath,
    encryptKey,
  }: {
    groupId: number;
    listFilePath: string[];
    encryptKey?: string;
  }) => execute({ groupId, listFilePath, encryptKey });
  return { loading, isSuccess, importResource };
};

const useExportResource = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.EXPORT_RESOURCE,
    MESSAGE.EXPORT_RESOURCE_RES,
    {
      onSuccess: () => {
        message.success(translate("hook.exportDataDone"));
      },
      onError: (errorMsg) => {
        message?.error(errorMsg);
      },
    },
  );
  const exportResource = ({
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
  return { loading, isSuccess, exportResource };
};

const useGetListResource = () => {
  const { execute: getListResource, loading } =
    useIpcAction<IpcGetListResourcePayload>(
      MESSAGE.GET_LIST_RESOURCE,
      MESSAGE.GET_LIST_RESOURCE_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListResource(payload?.data)),
      },
    );
  return { loading, getListResource };
};

const useDeleteResource = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_RESOURCE,
    MESSAGE.DELETE_RESOURCE_RES,
  );
  const deleteResource = (listId: number[]) => execute({ data: listId });
  return { deleteResource, loading, isSuccess };
};

const useUpdateResource = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_RESOURCE,
    MESSAGE.UPDATE_RESOURCE_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveUpdateResource(payload.data)),
    },
  );
  const updateResource = (data: IResource, encryptKey?: string) =>
    execute({ data, encryptKey });
  return { updateResource, loading, isSuccess };
};

const useCreateResource = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_RESOURCE,
    MESSAGE.CREATE_RESOURCE_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveCreateResource(payload.data)),
      onError: (errorMsg) => message.error(errorMsg),
    },
  );
  const createResource = (data: IResource, encryptKey?: string) =>
    execute({ data, encryptKey });
  return { createResource, loading, isSuccess };
};

export {
  useGetListResource,
  useDeleteResource,
  useUpdateResource,
  useCreateResource,
  useImportResource,
  useExportResource,
};
