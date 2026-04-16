import {
  AgentTaskStatus,
  AppLogType,
  AppLogTaskAction,
  AppLogActorType,
} from "@/electron/type";
import { MESSAGE } from "@/electron/constant";
import { agentTaskDB } from "@/electron/database/agentTask";
import { appLogDB } from "@/electron/database/appLog";
import { agentTaskDispatcher } from "@/electron/service/agentTaskDispatcher";
import { agentTaskExecutor } from "@/electron/service/agentTaskExecutor";
import { sendToRenderer } from "@/electron/main";
import type {
  IpcGetListAgentTaskPayload,
  IpcGetOneAgentTaskPayload,
  IpcCreateAgentTaskPayload,
  IpcUpdateAgentTaskPayload,
  IpcDeletePayload,
  IpcGetAgentAnalyticsPayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const agentTaskController = () => {
  onIpc<IpcGetListAgentTaskPayload>(
    MESSAGE.GET_LIST_AGENT_TASK,
    MESSAGE.GET_LIST_AGENT_TASK_RES,
    async (event, _payload) => {
      const [result, err] = await agentTaskDB.getListAgentTask();
      if (err) {
        event.reply(MESSAGE.GET_LIST_AGENT_TASK_RES, { error: err.message });
        return;
      }
      event.reply(MESSAGE.GET_LIST_AGENT_TASK_RES, { data: result });
    },
  );

  onIpc<IpcGetOneAgentTaskPayload>(
    MESSAGE.GET_ONE_AGENT_TASK,
    MESSAGE.GET_ONE_AGENT_TASK_RES,
    async (event, payload) => {
      const { id } = payload || {};
      const [result, err] = await agentTaskDB.getOneAgentTask(id);
      if (err) {
        event.reply(MESSAGE.GET_ONE_AGENT_TASK_RES, { error: err.message });
        return;
      }
      event.reply(MESSAGE.GET_ONE_AGENT_TASK_RES, { data: result });
    },
  );

  onIpc<IpcCreateAgentTaskPayload>(
    MESSAGE.CREATE_AGENT_TASK,
    MESSAGE.CREATE_AGENT_TASK_RES,
    async (event, payload) => {
      const { data } = payload;
      const [result, err] = await agentTaskDB.createAgentTask({
        ...data,
        status: AgentTaskStatus.INIT,
        retryCount: 0,
      });
      if (err) {
        event.reply(MESSAGE.CREATE_AGENT_TASK_RES, { error: err.message });
        return;
      }
      event.reply(MESSAGE.CREATE_AGENT_TASK_RES, { data: result });
      if (result?.id) {
        appLogDB.createAppLog({
          logType: AppLogType.TASK,
          taskId: result.id,
          actorType: result.creatorType || AppLogActorType.USER,
          action: AppLogTaskAction.TASK_CREATED,
          status: AgentTaskStatus.INIT,
          message: result.title,
          startedAt: Date.now(),
        });
      }
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
      agentTaskDispatcher.dispatch();
    },
  );

  onIpc<IpcUpdateAgentTaskPayload>(
    MESSAGE.UPDATE_AGENT_TASK,
    MESSAGE.UPDATE_AGENT_TASK_RES,
    async (event, payload) => {
      const { id, data } = payload;
      if (data.status === AgentTaskStatus.CANCELLED) {
        agentTaskExecutor.cancelTask(id);
      }
      const [result, err] = await agentTaskDB.updateAgentTask(id, data);
      if (err) {
        event.reply(MESSAGE.UPDATE_AGENT_TASK_RES, { error: err.message });
        return;
      }
      event.reply(MESSAGE.UPDATE_AGENT_TASK_RES, { data: result });
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
      agentTaskDispatcher.dispatch();
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_AGENT_TASK,
    MESSAGE.DELETE_AGENT_TASK_RES,
    async (event, payload) => {
      const ids = payload?.data || [];
      for (const id of ids) {
        agentTaskExecutor.cancelTask(id);
      }
      const [result, err] = await agentTaskDB.deleteAgentTask(ids);
      if (err) {
        event.reply(MESSAGE.DELETE_AGENT_TASK_RES, { error: err.message });
        return;
      }
      event.reply(MESSAGE.DELETE_AGENT_TASK_RES, { data: result });
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
      agentTaskDispatcher.dispatch();
    },
  );

  onIpc<IpcGetAgentAnalyticsPayload>(
    MESSAGE.GET_AGENT_ANALYTICS,
    MESSAGE.GET_AGENT_ANALYTICS_RES,
    async (event, payload) => {
      const { fromTimestamp } = payload;
      const [result] = await agentTaskDB.getAgentAnalytics(fromTimestamp);
      event.reply(MESSAGE.GET_AGENT_ANALYTICS_RES, { data: result });
    },
  );
};
