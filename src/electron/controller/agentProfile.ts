import path from "path";
import fs from "fs-extra";
import { MESSAGE } from "@/electron/constant";
import { Op } from "sequelize";
import { agentProfileDB } from "@/electron/database/agentProfile";
import { agentTaskDB } from "@/electron/database/agentTask";
import { appLogDB } from "@/electron/database/appLog";
import { AppLogModel } from "@/electron/database";
import { AppLogActorType } from "@/electron/type";
import { sendToRenderer } from "@/electron/main";
import { getMemoryDir } from "@/electron/service/agentSkill";
import { MEMORY_TEMPLATE } from "@/electron/agentCore";
import { agentProfileChatBridge } from "@/electron/chatGateway/agentProfileBridge";
import { agentChatBridge } from "@/electron/chatGateway/bridge";
import type {
  IpcGetListAgentProfilePayload,
  IpcGetOneAgentProfilePayload,
  IpcCreateAgentProfilePayload,
  IpcUpdateAgentProfilePayload,
  IpcDeletePayload,
  IpcGetAgentProfileMemoryPayload,
  IpcSaveAgentProfileMemoryPayload,
  IpcGetListAgentProfileLogPayload,
  IpcAgentProfileCreateSessionPayload,
  IpcAgentProfileRunPayload,
  IpcAgentProfileStopPayload,
  IpcAgentProfileResetSessionPayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

const getAgentProfileMemoryFile = (agentProfileId: number): string =>
  `AGENT_PROFILE_${agentProfileId}.md`;

export const agentProfileController = () => {
  onIpc<IpcGetListAgentProfilePayload>(
    MESSAGE.GET_LIST_AGENT_PROFILE,
    MESSAGE.GET_LIST_AGENT_PROFILE_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, isActive } = payload || {};
      const [res] = await agentProfileDB.getListAgentProfile(
        page,
        pageSize,
        searchText,
        isActive,
      );
      event.reply(MESSAGE.GET_LIST_AGENT_PROFILE_RES, { data: res });
    },
  );

  onIpc<IpcGetOneAgentProfilePayload>(
    MESSAGE.GET_ONE_AGENT_PROFILE,
    MESSAGE.GET_ONE_AGENT_PROFILE_RES,
    async (event, payload) => {
      const { id } = payload || {};
      const [res] = await agentProfileDB.getOneAgentProfile(id);
      event.reply(MESSAGE.GET_ONE_AGENT_PROFILE_RES, { data: res });
    },
  );

  onIpc<IpcCreateAgentProfilePayload>(
    MESSAGE.CREATE_AGENT_PROFILE,
    MESSAGE.CREATE_AGENT_PROFILE_RES,
    async (event, payload) => {
      const { data } = payload;
      const [res, err] = await agentProfileDB.createAgentProfile(data);
      if (err) {
        event.reply(MESSAGE.CREATE_AGENT_PROFILE_RES, { error: err?.message });
        return;
      }
      event.reply(MESSAGE.CREATE_AGENT_PROFILE_RES, { data: res });
    },
  );

  onIpc<IpcUpdateAgentProfilePayload>(
    MESSAGE.UPDATE_AGENT_PROFILE,
    MESSAGE.UPDATE_AGENT_PROFILE_RES,
    async (event, payload) => {
      const { data } = payload;
      const [res, err] = await agentProfileDB.updateAgentProfile(data);
      if (err) {
        event.reply(MESSAGE.UPDATE_AGENT_PROFILE_RES, { error: err?.message });
        return;
      }
      if (data?.id) {
        agentChatBridge.invalidateProfileSession(data.id).catch(() => {});
      }
      event.reply(MESSAGE.UPDATE_AGENT_PROFILE_RES, { data: res });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_AGENT_PROFILE,
    MESSAGE.DELETE_AGENT_PROFILE_RES,
    async (event, payload) => {
      const listId = payload?.data || [];
      await AppLogModel.destroy({
        where: {
          actorType: AppLogActorType.AGENT,
          actorId: { [Op.in]: listId },
        },
      });
      const [unassignedCount] =
        await agentTaskDB.unassignTasksByAgentIds(listId);
      const [res, deleteErr] = await agentProfileDB.deleteAgentProfile(listId);
      if (deleteErr) {
        event.reply(MESSAGE.DELETE_AGENT_PROFILE_RES, {
          error: deleteErr?.message,
        });
        return;
      }
      for (const profileId of listId) {
        agentChatBridge.cleanupProfileSession(profileId).catch(() => {});
      }
      if (unassignedCount > 0) {
        sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);
      }
      event.reply(MESSAGE.DELETE_AGENT_PROFILE_RES, { data: res });
    },
  );

  onIpc<IpcGetAgentProfileMemoryPayload>(
    MESSAGE.GET_AGENT_PROFILE_MEMORY,
    MESSAGE.GET_AGENT_PROFILE_MEMORY_RES,
    async (event, payload) => {
      const { agentProfileId } = payload || {};
      const memoryDir = getMemoryDir();
      const memoryFile = getAgentProfileMemoryFile(agentProfileId);
      const memoryPath = path.join(memoryDir, memoryFile);

      let content = MEMORY_TEMPLATE;
      try {
        if (await fs.pathExists(memoryPath)) {
          content = await fs.readFile(memoryPath, "utf-8");
        }
      } catch {}

      event.reply(MESSAGE.GET_AGENT_PROFILE_MEMORY_RES, { data: content });
    },
  );

  onIpc<IpcSaveAgentProfileMemoryPayload>(
    MESSAGE.SAVE_AGENT_PROFILE_MEMORY,
    MESSAGE.SAVE_AGENT_PROFILE_MEMORY_RES,
    async (event, payload) => {
      const { agentProfileId, content } = payload || {};
      const memoryDir = getMemoryDir();
      const memoryFile = getAgentProfileMemoryFile(agentProfileId);
      const memoryPath = path.join(memoryDir, memoryFile);

      try {
        await fs.ensureDir(memoryDir);
        await fs.writeFile(memoryPath, content || MEMORY_TEMPLATE, "utf-8");
        event.reply(MESSAGE.SAVE_AGENT_PROFILE_MEMORY_RES, { data: true });
      } catch (err: any) {
        event.reply(MESSAGE.SAVE_AGENT_PROFILE_MEMORY_RES, {
          data: false,
          error: err?.message,
        });
      }
    },
  );

  onIpc<IpcGetListAgentProfileLogPayload>(
    MESSAGE.GET_LIST_AGENT_PROFILE_LOG,
    MESSAGE.GET_LIST_AGENT_PROFILE_LOG_RES,
    async (event, payload) => {
      const { agentProfileId, page, pageSize } = payload || {};
      const [res] = await appLogDB.getListAppLogByAgentProfileId(
        agentProfileId,
        page,
        pageSize,
      );
      event.reply(MESSAGE.GET_LIST_AGENT_PROFILE_LOG_RES, { data: res });
    },
  );

  onIpc<IpcAgentProfileCreateSessionPayload>(
    MESSAGE.AGENT_PROFILE_CREATE_SESSION,
    MESSAGE.AGENT_PROFILE_CREATE_SESSION_RES,
    async (event, payload) => {
      const { agentProfileId } = payload || {};
      const sessionId =
        await agentProfileChatBridge.createSession(agentProfileId);
      event.reply(MESSAGE.AGENT_PROFILE_CREATE_SESSION_RES, {
        data: sessionId,
      });
    },
  );

  onIpc<IpcAgentProfileRunPayload>(
    MESSAGE.AGENT_PROFILE_RUN,
    MESSAGE.AGENT_PROFILE_RUN_RES,
    async (event, payload) => {
      const { sessionId, input, encryptKey } = payload || {};
      const result = await agentProfileChatBridge.runAgent(
        sessionId,
        input,
        encryptKey,
        event,
      );
      event.reply(MESSAGE.AGENT_PROFILE_RUN_RES, { data: result });
    },
  );

  onIpc<IpcAgentProfileStopPayload>(
    MESSAGE.AGENT_PROFILE_STOP,
    MESSAGE.AGENT_PROFILE_STOP_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      agentProfileChatBridge.stopAgent(sessionId);
      event.reply(MESSAGE.AGENT_PROFILE_STOP_RES, { data: true });
    },
  );

  onIpc<IpcAgentProfileResetSessionPayload>(
    MESSAGE.AGENT_PROFILE_RESET_SESSION,
    MESSAGE.AGENT_PROFILE_RESET_SESSION_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      await agentProfileChatBridge.resetSession(sessionId);
      event.reply(MESSAGE.AGENT_PROFILE_RESET_SESSION_RES, { data: true });
    },
  );
};
