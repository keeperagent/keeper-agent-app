import { useState } from "react";
import { useDispatch } from "react-redux";
import { message } from "antd";
import { uid } from "uid/secure";
import { MESSAGE } from "@/electron/constant";
import { IWorkflow } from "@/electron/type";
import {
  actSaveCreateWorkflow,
  actSaveGetListWorkflow,
  actSaveUpdateWorkflow,
  actSaveSelectedWorkflow,
} from "@/redux/workflow";
import type { IpcGetListWorkflowPayload } from "@/electron/ipcTypes";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";

const useGetListWorkflow = () => {
  const { execute: getListWorkflow, loading } =
    useIpcAction<IpcGetListWorkflowPayload>(
      MESSAGE.GET_LIST_WORKFLOW,
      MESSAGE.GET_LIST_WORKFLOW_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListWorkflow(payload?.data)),
      },
    );

  return { loading, getListWorkflow };
};

const useGetOneWorkflow = () => {
  const { execute, loading } = useIpcAction(
    MESSAGE.GET_ONE_WORKFLOW,
    MESSAGE.GET_ONE_WORKFLOW_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveSelectedWorkflow(payload?.data)),
    },
  );

  const getOneWorkflow = (id: number) => execute({ id });
  return { loading, getOneWorkflow };
};

const useDeleteWorkflow = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_WORKFLOW,
    MESSAGE.DELETE_WORKFLOW_RES,
    {
      onSuccess: ({ error }: any) => {
        if (error) message?.error(error);
      },
    },
  );

  const deleteWorkflow = (listId: number[]) => execute({ data: listId });
  return { deleteWorkflow, loading, isSuccess };
};

// Uses a unique requestId so concurrent saves don't cross-pollinate — not
// compatible with the shared listener in useIpcAction.
const useUpdateWorkflow = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const updateWorkflow = async (data: IWorkflow) => {
    setLoading(true);
    setIsSuccess(false);
    const uniqueID = uid(25);
    window?.electron?.send(MESSAGE.UPDATE_WORKFLOW, {
      data,
      requestId: uniqueID,
    });

    await new Promise(async (resolve) => {
      window?.electron?.on(
        MESSAGE.UPDATE_WORKFLOW_RES,
        (event: any, payload: any) => {
          const { requestId, data } = payload;
          if (requestId !== uniqueID) return;
          setLoading(false);
          setIsSuccess(true);
          dispatch(actSaveUpdateWorkflow(data));
          resolve(true);
        },
      );
    });
  };

  return { updateWorkflow, loading, isSuccess };
};

const useCreateWorkflow = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const createWorkflow = async (data: IWorkflow) => {
    const uniqueID = uid(25);
    setLoading(true);
    setIsSuccess(false);
    window?.electron?.send(MESSAGE.CREATE_WORKFLOW, {
      data,
      requestId: uniqueID,
    });

    await new Promise(async (resolve) => {
      window?.electron?.on(
        MESSAGE.CREATE_WORKFLOW_RES,
        (event: any, payload: any) => {
          const { requestId, data } = payload;
          if (requestId !== uniqueID) return;
          setLoading(false);
          setIsSuccess(true);
          dispatch(actSaveCreateWorkflow(data));
          resolve(true);
        },
      );
    });
  };

  return { createWorkflow, loading, isSuccess };
};

const useExportWorkflow = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.EXPORT_WORKFLOW,
    MESSAGE.EXPORT_WORKFLOW_RES,
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

  const exportWorkflow = ({
    folderPath,
    fileName,
    listWorkflowId,
  }: {
    folderPath: string;
    fileName: string;
    listWorkflowId?: number[];
  }) => execute({ folderPath, fileName, listWorkflowId });

  return { loading, isSuccess, exportWorkflow };
};

const useImportWorkflow = () => {
  const { translate } = useTranslation();
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.IMPORT_WORKFLOW,
    MESSAGE.IMPORT_WORKFLOW_RES,
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

  const importWorkflow = (listFilePath: string[]) => execute({ listFilePath });

  return { loading, isSuccess, importWorkflow };
};

export {
  useGetListWorkflow,
  useGetOneWorkflow,
  useDeleteWorkflow,
  useUpdateWorkflow,
  useCreateWorkflow,
  useExportWorkflow,
  useImportWorkflow,
};
