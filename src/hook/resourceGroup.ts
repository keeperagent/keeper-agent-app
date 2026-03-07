import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import {
  actSaveCreateResourceGroup,
  actSaveGetListResourceGroup,
  actSaveUpdateResourceGroup,
  actSaveSelectedResourceGroup,
} from "@/redux/resourceGroup";
import type { IpcGetListResourceGroupPayload } from "@/electron/ipcTypes";
import { IResourceGroup } from "@/electron/type";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";

const useGetListResourceGroup = () => {
  const { execute: getListResourceGroup, loading } =
    useIpcAction<IpcGetListResourceGroupPayload>(
      MESSAGE.GET_LIST_RESOURCE_GROUP,
      MESSAGE.GET_LIST_RESOURCE_GROUP_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListResourceGroup(payload?.data)),
      },
    );
  return { loading, getListResourceGroup };
};

const useGetOneResourceGroup = () => {
  const { execute, loading } = useIpcAction(
    MESSAGE.GET_ONE_RESOURCE_GROUP,
    MESSAGE.GET_ONE_RESOURCE_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveSelectedResourceGroup(payload?.data)),
    },
  );
  const getOneResourceGroup = (id: number) => execute({ id });
  return { loading, getOneResourceGroup };
};

const useDeleteResourceGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_RESOURCE_GROUP,
    MESSAGE.DELETE_RESOURCE_GROUP_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) message.error(error);
      },
    },
  );
  const deleteResourceGroup = (listGroupId: number[]) =>
    execute({ data: listGroupId });
  return { deleteResourceGroup, loading, isSuccess };
};

const useUpdateResourceGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_RESOURCE_GROUP,
    MESSAGE.UPDATE_RESOURCE_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveUpdateResourceGroup(payload?.data)),
    },
  );
  const updateResourceGroup = (data: IResourceGroup) => execute({ data });
  return { updateResourceGroup, loading, isSuccess };
};

const useCreateResourceGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_RESOURCE_GROUP,
    MESSAGE.CREATE_RESOURCE_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveCreateResourceGroup(payload?.data)),
    },
  );
  const createResourceGroup = (data: IResourceGroup) => execute({ data });
  return { createResourceGroup, loading, isSuccess };
};

const useExportResourceGroupConfig = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.EXPORT_RESOURCE_GROUP,
    MESSAGE.EXPORT_RESOURCE_GROUP_RES,
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
  const exportResourceGroupConfig = ({
    resourceGroupId,
    folderPath,
    fileName,
  }: {
    resourceGroupId: number;
    folderPath: string;
    fileName: string;
  }) => execute({ folderPath, resourceGroupId, fileName });
  return { loading, isSuccess, exportResourceGroupConfig };
};

const useImportResourceGroupConfig = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.IMPORT_RESOURCE_GROUP,
    MESSAGE.IMPORT_RESOURCE_GROUP_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) {
          message?.error(error);
        } else {
          message.success(translate("hook.importDataDone"));
        }
      },
    },
  );
  const importResourceGroupConfig = (
    resourceGroupId: number,
    filePath: string,
  ) => execute({ resourceGroupId, filePath });
  return { loading, isSuccess, importResourceGroupConfig };
};

export {
  useGetListResourceGroup,
  useDeleteResourceGroup,
  useUpdateResourceGroup,
  useCreateResourceGroup,
  useGetOneResourceGroup,
  useExportResourceGroupConfig,
  useImportResourceGroupConfig,
};
