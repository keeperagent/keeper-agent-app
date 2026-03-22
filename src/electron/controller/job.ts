import { MESSAGE } from "@/electron/constant";
import { jobDB } from "@/electron/database/job";
import { scheduleManager } from "@/electron/schedule";
import { workflowManager } from "@/electron/simulator/workflow";
import type {
  IpcDeletePayload,
  IpcUpdateJobPayload,
  IpcMarkJobCompletedPayload,
  IpcCheckJobExistedPayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const runJobController = () => {
  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_JOB,
    MESSAGE.DELETE_JOB_RES,
    async (event, payload) => {
      const { data = [] } = payload;

      for (const jobId of data) {
        const [job] = await jobDB.getOneJob(jobId);
        if (!job) {
          continue;
        }

        const workflow = await workflowManager.getWorkflow(
          job?.workflowId!,
          job?.campaignId!,
          job?.scheduleId!,
        );
        await workflow.stopWorkflow();
        workflowManager.clearWorkflow(
          job?.workflowId!,
          job?.campaignId!,
          job?.scheduleId!,
        );
      }

      const err = await jobDB.deleteJob({ id: data });
      event.reply(MESSAGE.DELETE_JOB_RES, {
        error: err?.message,
      });
    },
  );

  onIpc<IpcUpdateJobPayload>(
    MESSAGE.UPDATE_JOB,
    MESSAGE.UPDATE_JOB_RES,
    async (event, payload) => {
      const { id, ...fields } = payload;
      const [updated, err] = await jobDB.updateJob({ id, ...fields });
      event.reply(MESSAGE.UPDATE_JOB_RES, {
        data: updated,
        error: err?.message,
      });
    },
  );

  onIpc<IpcMarkJobCompletedPayload>(
    MESSAGE.MARK_JOB_COMPLETED,
    MESSAGE.MARK_JOB_COMPLETED_RES,
    async (event, payload) => {
      const { jobId } = payload;
      await scheduleManager.markJobCompleted(jobId);

      event.reply(MESSAGE.MARK_JOB_COMPLETED_RES, {});
    },
  );

  onIpc<IpcCheckJobExistedPayload>(
    MESSAGE.CHECK_JOB_EXISTED,
    MESSAGE.CHECK_JOB_EXISTED_RES,
    async (event, payload) => {
      const { campaignId, workflowId } = payload;
      const [existedJob] = await jobDB.findOneJob({
        campaignId,
        workflowId,
        isRunWithSchedule: true,
      });

      event.reply(MESSAGE.CHECK_JOB_EXISTED_RES, {
        id: existedJob?.id,
        isExisted: Boolean(existedJob),
        workflowName: existedJob?.workflow?.name,
        campaignName: existedJob?.campaign?.name,
        scheduleName: existedJob?.schedule?.name,
        workflowId: existedJob?.workflowId,
        campaignId: existedJob?.campaignId,
      });
    },
  );
};
