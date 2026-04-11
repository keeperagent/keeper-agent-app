import { useState } from "react";
import { MESSAGE } from "@/electron/constant";
import type {
  IpcUpdateJobPayload,
  IpcMarkJobCompletedPayload,
} from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useUpdateJob = () => {
  const { execute, loading, isSuccess } = useIpcAction<IpcUpdateJobPayload>(
    MESSAGE.UPDATE_JOB,
    MESSAGE.UPDATE_JOB_RES,
  );
  const updateJob = (payload: IpcUpdateJobPayload) => execute(payload);
  return { updateJob, loading, isSuccess };
};

const useDeleteJob = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_JOB,
    MESSAGE.DELETE_JOB_RES,
  );
  const deleteJob = (listId: number[]) => execute({ data: listId });
  return { deleteJob, loading, isSuccess };
};

const useMarkJobCompleted = () => {
  const { execute, loading, isSuccess } =
    useIpcAction<IpcMarkJobCompletedPayload>(
      MESSAGE.MARK_JOB_COMPLETED,
      MESSAGE.MARK_JOB_COMPLETED_RES,
    );
  const markJobCompleted = (jobId: number) => execute({ jobId });
  return { markJobCompleted, loading, isSuccess };
};

const useCheckJobExisted = () => {
  const [existedJob, setExistedJob] = useState<any>(null);
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CHECK_JOB_EXISTED,
    MESSAGE.CHECK_JOB_EXISTED_RES,
    {
      onSuccess: ({
        id,
        workflowName,
        campaignName,
        scheduleName,
        workflowId,
        campaignId,
      }: any) => {
        setExistedJob({
          id,
          workflowName,
          campaignName,
          scheduleName,
          workflowId,
          campaignId,
        });
      },
    },
  );

  const checkJobExisted = (workflowId: number, campaignId: number) => {
    setExistedJob(null);
    execute({ workflowId, campaignId });
  };

  const clearExistedJob = () => setExistedJob(null);

  return { checkJobExisted, clearExistedJob, loading, isSuccess, existedJob };
};

export { useUpdateJob, useDeleteJob, useMarkJobCompleted, useCheckJobExisted };
