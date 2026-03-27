import path from "path";
import fs from "fs-extra";
import { MESSAGE } from "@/electron/constant";
import { Op } from "sequelize";
import { agentRegistryDB } from "@/electron/database/agentRegistry";
import { appLogDB } from "@/electron/database/appLog";
import { AppLogModel } from "@/electron/database";
import { AppLogActorType } from "@/electron/type";
import { getMemoryDir } from "@/electron/service/agentSkill";
import { agentRegistryChatBridge } from "@/electron/chatGateway/agentRegistryBridge";
import type {
  IpcGetListAgentRegistryPayload,
  IpcGetOneAgentRegistryPayload,
  IpcCreateAgentRegistryPayload,
  IpcUpdateAgentRegistryPayload,
  IpcDeletePayload,
  IpcGetAgentRegistryMemoryPayload,
  IpcSaveAgentRegistryMemoryPayload,
  IpcGetListAgentRegistryLogPayload,
  IpcRegistryAgentCreateSessionPayload,
  IpcRegistryAgentRunPayload,
  IpcRegistryAgentStopPayload,
  IpcRegistryAgentResetSessionPayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

const MEMORY_TEMPLATE = "# Agent Memory\n";

const getRegistryMemoryFile = (agentRegistryId: number): string =>
  `AGENT_REGISTRY_${agentRegistryId}.md`;

export const agentRegistryController = () => {
  onIpc<IpcGetListAgentRegistryPayload>(
    MESSAGE.GET_LIST_AGENT_REGISTRY,
    MESSAGE.GET_LIST_AGENT_REGISTRY_RES,
    async (event, payload) => {
      const { page, pageSize, searchText } = payload || {};
      const [res] = await agentRegistryDB.getListAgentRegistry(
        page,
        pageSize,
        searchText,
      );
      event.reply(MESSAGE.GET_LIST_AGENT_REGISTRY_RES, { data: res });
    },
  );

  onIpc<IpcGetOneAgentRegistryPayload>(
    MESSAGE.GET_ONE_AGENT_REGISTRY,
    MESSAGE.GET_ONE_AGENT_REGISTRY_RES,
    async (event, payload) => {
      const { id } = payload || {};
      const [res] = await agentRegistryDB.getOneAgentRegistry(id);
      event.reply(MESSAGE.GET_ONE_AGENT_REGISTRY_RES, { data: res });
    },
  );

  onIpc<IpcCreateAgentRegistryPayload>(
    MESSAGE.CREATE_AGENT_REGISTRY,
    MESSAGE.CREATE_AGENT_REGISTRY_RES,
    async (event, payload) => {
      const { data } = payload;
      const [res] = await agentRegistryDB.createAgentRegistry(data);
      event.reply(MESSAGE.CREATE_AGENT_REGISTRY_RES, { data: res });
    },
  );

  onIpc<IpcUpdateAgentRegistryPayload>(
    MESSAGE.UPDATE_AGENT_REGISTRY,
    MESSAGE.UPDATE_AGENT_REGISTRY_RES,
    async (event, payload) => {
      const { data } = payload;
      const [res] = await agentRegistryDB.updateAgentRegistry(data);
      event.reply(MESSAGE.UPDATE_AGENT_REGISTRY_RES, { data: res });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_AGENT_REGISTRY,
    MESSAGE.DELETE_AGENT_REGISTRY_RES,
    async (event, payload) => {
      const listId = payload?.data || [];
      await AppLogModel.destroy({
        where: {
          actorType: AppLogActorType.AGENT,
          actorId: { [Op.in]: listId },
        },
      });
      const [res] = await agentRegistryDB.deleteAgentRegistry(listId);
      event.reply(MESSAGE.DELETE_AGENT_REGISTRY_RES, { data: res });
    },
  );

  onIpc<IpcGetAgentRegistryMemoryPayload>(
    MESSAGE.GET_AGENT_REGISTRY_MEMORY,
    MESSAGE.GET_AGENT_REGISTRY_MEMORY_RES,
    async (event, payload) => {
      const { agentRegistryId } = payload || {};
      const memoryDir = getMemoryDir();
      const memoryFile = getRegistryMemoryFile(agentRegistryId);
      const memoryPath = path.join(memoryDir, memoryFile);

      let content = MEMORY_TEMPLATE;
      try {
        if (await fs.pathExists(memoryPath)) {
          content = await fs.readFile(memoryPath, "utf-8");
        }
      } catch {}

      event.reply(MESSAGE.GET_AGENT_REGISTRY_MEMORY_RES, { data: content });
    },
  );

  onIpc<IpcSaveAgentRegistryMemoryPayload>(
    MESSAGE.SAVE_AGENT_REGISTRY_MEMORY,
    MESSAGE.SAVE_AGENT_REGISTRY_MEMORY_RES,
    async (event, payload) => {
      const { agentRegistryId, content } = payload || {};
      const memoryDir = getMemoryDir();
      const memoryFile = getRegistryMemoryFile(agentRegistryId);
      const memoryPath = path.join(memoryDir, memoryFile);

      try {
        await fs.ensureDir(memoryDir);
        await fs.writeFile(memoryPath, content || MEMORY_TEMPLATE, "utf-8");
        event.reply(MESSAGE.SAVE_AGENT_REGISTRY_MEMORY_RES, { data: true });
      } catch (err: any) {
        event.reply(MESSAGE.SAVE_AGENT_REGISTRY_MEMORY_RES, {
          data: false,
          error: err?.message,
        });
      }
    },
  );

  onIpc<IpcGetListAgentRegistryLogPayload>(
    MESSAGE.GET_LIST_AGENT_REGISTRY_LOG,
    MESSAGE.GET_LIST_AGENT_REGISTRY_LOG_RES,
    async (event, payload) => {
      const { agentRegistryId, page, pageSize } = payload || {};
      const [res] = await appLogDB.getListAppLogByAgentRegistryId(
        agentRegistryId,
        page,
        pageSize,
      );
      event.reply(MESSAGE.GET_LIST_AGENT_REGISTRY_LOG_RES, { data: res });
    },
  );

  // Registry agent chat session IPC
  onIpc<IpcRegistryAgentCreateSessionPayload>(
    MESSAGE.REGISTRY_AGENT_CREATE_SESSION,
    MESSAGE.REGISTRY_AGENT_CREATE_SESSION_RES,
    async (event, payload) => {
      const { agentRegistryId } = payload || {};
      const sessionId = await agentRegistryChatBridge.createSession(
        agentRegistryId,
        event,
      );
      event.reply(MESSAGE.REGISTRY_AGENT_CREATE_SESSION_RES, {
        data: sessionId,
      });
    },
  );

  onIpc<IpcRegistryAgentRunPayload>(
    MESSAGE.REGISTRY_AGENT_RUN,
    MESSAGE.REGISTRY_AGENT_RUN_RES,
    async (event, payload) => {
      const { sessionId, input, encryptKey } = payload || {};
      const result = await agentRegistryChatBridge.runAgent(
        sessionId,
        input,
        encryptKey,
        event,
      );
      event.reply(MESSAGE.REGISTRY_AGENT_RUN_RES, { data: result });
    },
  );

  onIpc<IpcRegistryAgentStopPayload>(
    MESSAGE.REGISTRY_AGENT_STOP,
    MESSAGE.REGISTRY_AGENT_STOP_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      agentRegistryChatBridge.stopAgent(sessionId);
      event.reply(MESSAGE.REGISTRY_AGENT_STOP_RES, { data: true });
    },
  );

  onIpc<IpcRegistryAgentResetSessionPayload>(
    MESSAGE.REGISTRY_AGENT_RESET_SESSION,
    MESSAGE.REGISTRY_AGENT_RESET_SESSION_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      await agentRegistryChatBridge.resetSession(sessionId);
      event.reply(MESSAGE.REGISTRY_AGENT_RESET_SESSION_RES, { data: true });
    },
  );

  onIpc<{ sessionId: string }>(
    MESSAGE.REGISTRY_AGENT_DESTROY_SESSION,
    MESSAGE.REGISTRY_AGENT_DESTROY_SESSION_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      await agentRegistryChatBridge.destroySession(sessionId);
      event.reply(MESSAGE.REGISTRY_AGENT_DESTROY_SESSION_RES, { data: true });
    },
  );
};
