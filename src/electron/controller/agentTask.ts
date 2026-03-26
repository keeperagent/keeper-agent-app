import { AgentTaskStatus } from "@/electron/type";
import { MESSAGE } from "@/electron/constant";
import { agentTaskDB } from "@/electron/database/agentTask";
import { agentTaskDispatcher } from "@/electron/service/agentTaskDispatcher";
import { agentTaskExecutor } from "@/electron/service/agentTaskExecutor";
import { sendToRenderer } from "@/electron/main";
import type {
  IpcGetListAgentTaskPayload,
  IpcGetOneAgentTaskPayload,
  IpcCreateAgentTaskPayload,
  IpcUpdateAgentTaskPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const agentTaskController = () => {
  onIpc<IpcGetListAgentTaskPayload>(
    MESSAGE.GET_LIST_AGENT_TASK,
    MESSAGE.GET_LIST_AGENT_TASK_RES,
    async (event, _payload) => {
      const [result] = await agentTaskDB.getListAgentTask();
      event.reply(MESSAGE.GET_LIST_AGENT_TASK_RES, { data: result });
    },
  );

  onIpc<IpcGetOneAgentTaskPayload>(
    MESSAGE.GET_ONE_AGENT_TASK,
    MESSAGE.GET_ONE_AGENT_TASK_RES,
    async (event, payload) => {
      const { id } = payload || {};
      const [result] = await agentTaskDB.getOneAgentTask(id);
      event.reply(MESSAGE.GET_ONE_AGENT_TASK_RES, { data: result });
    },
  );

  onIpc<IpcCreateAgentTaskPayload>(
    MESSAGE.CREATE_AGENT_TASK,
    MESSAGE.CREATE_AGENT_TASK_RES,
    async (event, payload) => {
      const { data } = payload;
      const [result] = await agentTaskDB.createAgentTask({
        ...data,
        status: AgentTaskStatus.INIT,
        retryCount: 0,
      });
      event.reply(MESSAGE.CREATE_AGENT_TASK_RES, { data: result });
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
      const [result] = await agentTaskDB.updateAgentTask(id, data);
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
      const [result] = await agentTaskDB.deleteAgentTask(ids);
      event.reply(MESSAGE.DELETE_AGENT_TASK_RES, { data: result });
      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
      agentTaskDispatcher.dispatch();
    },
  );
};
