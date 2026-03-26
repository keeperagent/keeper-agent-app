import { MESSAGE } from "@/electron/constant";
import { scheduleDB } from "@/electron/database/schedule";
import { workflowManager } from "@/electron/simulator/workflow";
import { agentTaskScheduler } from "@/electron/service/agentJobScheduler";
import { onIpc } from "./helpers";
import { logEveryWhere } from "@/electron/service/util";
import type {
  IpcGetListSchedulePayload,
  IpcGetOneSchedulePayload,
  IpcCreateSchedulePayload,
  IpcUpdateSchedulePayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";

export const runScheduleController = () => {
  onIpc<IpcGetListSchedulePayload>(
    MESSAGE.GET_LIST_SCHEDULE,
    MESSAGE.GET_LIST_SCHEDULE_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortBy, scheduleId } = payload;

      const [res] = await scheduleDB.getListSchedule(
        page,
        pageSize,
        searchText,
        sortBy,
        scheduleId,
      );

      event.reply(MESSAGE.GET_LIST_SCHEDULE_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcGetOneSchedulePayload>(
    MESSAGE.GET_ONE_SCHEDULE,
    MESSAGE.GET_ONE_SCHEDULE_RES,
    async (event, payload) => {
      const { scheduleId } = payload;

      const [schedule] = await scheduleDB.getOneSchedule(scheduleId);

      event.reply(MESSAGE.GET_ONE_SCHEDULE_RES, {
        data: schedule,
      });
    },
  );

  onIpc<IpcCreateSchedulePayload>(
    MESSAGE.CREATE_SCHEDULE,
    MESSAGE.CREATE_SCHEDULE_RES,
    async (event, payload) => {
      const { data } = payload;

      const [res, err] = await scheduleDB.createSchedule(data);
      event.reply(MESSAGE.CREATE_SCHEDULE_RES, {
        data: res,
        error: err?.message,
      });
    },
  );

  onIpc<IpcUpdateSchedulePayload>(
    MESSAGE.UPDATE_SCHEDULE,
    MESSAGE.UPDATE_SCHEDULE_RES,
    async (event, payload) => {
      const { data } = payload;

      const [res, err] = await scheduleDB.updateSchedule(data);

      if (res?.type === "agent") {
        agentTaskScheduler.reschedule(res);
      }

      event.reply(MESSAGE.UPDATE_SCHEDULE_RES, {
        data: res,
        error: err?.message,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_SCHEDULE,
    MESSAGE.DELETE_SCHEDULE_RES,
    async (event, payload) => {
      const { data } = payload;

      for (const scheduleId of data) {
        const [schedule] = await scheduleDB.getOneSchedule(scheduleId);
        if (!schedule) {
          continue;
        }

        const { listJob = [] } = schedule;
        for (const job of listJob) {
          const workflow = await workflowManager.getWorkflow(
            job?.workflowId || 0,
            job?.campaignId || 0,
            schedule?.id || 0,
          );
          await workflow.stopWorkflow();
          workflowManager.clearWorkflow(
            job?.workflowId || 0,
            job?.campaignId || 0,
            schedule?.id || 0,
          );
        }
      }

      const err = await scheduleDB.deleteSchedule(data);
      event.reply(MESSAGE.DELETE_SCHEDULE_RES, {
        error: err?.message,
      });
    },
  );

  onIpc<{ scheduleId: number }>(
    MESSAGE.RUN_SCHEDULE_NOW,
    MESSAGE.RUN_SCHEDULE_NOW_RES,
    async (event, payload) => {
      event.reply(MESSAGE.RUN_SCHEDULE_NOW_RES, { error: null });
      agentTaskScheduler.runNow(payload.scheduleId).catch((err) => {
        logEveryWhere({
          message: `agentTaskScheduler.runNow(${payload.scheduleId}) error: ${err?.message}`,
        });
      });
    },
  );

  onIpc(
    MESSAGE.GET_RUNNING_AGENT_SCHEDULE,
    MESSAGE.GET_RUNNING_AGENT_SCHEDULE_RES,
    async (event) => {
      event.reply(MESSAGE.GET_RUNNING_AGENT_SCHEDULE_RES, {
        data: agentTaskScheduler.getRunningScheduleIds(),
      });
    },
  );
};
