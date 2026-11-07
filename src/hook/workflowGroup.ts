import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import {
  actSaveCreateWorkflowGroup,
  actSaveGetListWorkflowGroup,
  actSaveUpdateWorkflowGroup,
  actSaveSelectedWorkflowGroup,
} from "@/redux/workflowGroup";
import type { IpcGetListWorkflowGroupPayload } from "@/electron/ipcTypes";
import { IWorkflowGroup } from "@/electron/type";
import { useIpcAction } from "./useIpcAction";

const useGetListWorkflowGroup = () => {
  const { execute: getListWorkflowGroup, loading } =
    useIpcAction<IpcGetListWorkflowGroupPayload>(
      MESSAGE.GET_LIST_WORKFLOW_GROUP,
      MESSAGE.GET_LIST_WORKFLOW_GROUP_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListWorkflowGroup(payload?.data)),
      },
    );
  return { loading, getListWorkflowGroup };
};

const useGetOneWorkflowGroup = () => {
  const { execute, loading } = useIpcAction(
    MESSAGE.GET_ONE_WORKFLOW_GROUP,
    MESSAGE.GET_ONE_WORKFLOW_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveSelectedWorkflowGroup(payload?.data)),
    },
  );
  const getOneWorkflowGroup = (id: number) => execute({ id });
  return { loading, getOneWorkflowGroup };
};

const useDeleteWorkflowGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_WORKFLOW_GROUP,
    MESSAGE.DELETE_WORKFLOW_GROUP_RES,
    {
      onError: (error) => message.error(error),
    },
  );
  const deleteWorkflowGroup = (listGroupId: number[]) =>
    execute({ data: listGroupId });
  return { deleteWorkflowGroup, loading, isSuccess };
};

const useUpdateWorkflowGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_WORKFLOW_GROUP,
    MESSAGE.UPDATE_WORKFLOW_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveUpdateWorkflowGroup(payload?.data)),
      onError: (error) => message.error(error),
    },
  );
  const updateWorkflowGroup = (data: IWorkflowGroup) => execute({ data });
  return { updateWorkflowGroup, loading, isSuccess };
};

const useCreateWorkflowGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_WORKFLOW_GROUP,
    MESSAGE.CREATE_WORKFLOW_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveCreateWorkflowGroup(payload?.data)),
      onError: (error) => message.error(error),
    },
  );
  const createWorkflowGroup = (data: IWorkflowGroup) => execute({ data });
  return { createWorkflowGroup, loading, isSuccess };
};

export {
  useGetListWorkflowGroup,
  useDeleteWorkflowGroup,
  useUpdateWorkflowGroup,
  useCreateWorkflowGroup,
  useGetOneWorkflowGroup,
};
