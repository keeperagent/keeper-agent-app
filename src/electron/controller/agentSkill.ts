import { MESSAGE } from "@/electron/constant";
import { agentSkillDB } from "@/electron/database/agentSkill";
import {
  saveSkillFolder,
  deleteSkillDir,
  readAndValidateSkillMdAtPath,
  getFolderName,
} from "@/electron/service/agentSkill";
import type {
  IpcGetListAgentSkillPayload,
  IpcCreateAgentSkillPayload,
  IpcUpdateAgentSkillPayload,
  IpcDeletePayload,
} from "@/electron/ipcTypes";
import { recreateAllAgents } from "./appAgent";
import { onIpc } from "./helpers";

const AGENT_SKILL_DUPLICATE_NAME_ERR =
  "This skill name is already in use. Try a different name.";

export const agentSkillController = () => {
  onIpc<IpcGetListAgentSkillPayload>(
    MESSAGE.GET_LIST_AGENT_SKILL,
    MESSAGE.GET_LIST_AGENT_SKILL_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortField } = payload || {};
      const [res] = await agentSkillDB.getListAgentSkill(
        page,
        pageSize,
        searchText,
        sortField,
      );
      event.reply(MESSAGE.GET_LIST_AGENT_SKILL_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcCreateAgentSkillPayload>(
    MESSAGE.CREATE_AGENT_SKILL,
    MESSAGE.CREATE_AGENT_SKILL_RES,
    async (event, payload) => {
      let { data } = payload;
      const filePath = data?.filePath;
      if (!filePath) {
        event.reply(MESSAGE.CREATE_AGENT_SKILL_RES, {
          data: null,
          error: "Please select a .zip or .md file.",
        });
        return;
      }

      const validation = await readAndValidateSkillMdAtPath(filePath);
      if (validation?.error) {
        event.reply(MESSAGE.CREATE_AGENT_SKILL_RES, {
          data: null,
          error: validation.error,
        });
        return;
      }

      const folderName = await getFolderName(filePath);
      data = {
        ...data,
        name: data?.name || validation?.name || "",
        description: data?.description || validation?.description,
        folderName,
      };

      const skillName = data?.name?.toLowerCase();
      const [listRes] = await agentSkillDB.getListAgentSkill(1, 1, skillName);
      const existingSkill = listRes?.data?.find(
        (skill) => skill?.name?.toLowerCase() === skillName,
      );

      if (existingSkill) {
        event.reply(MESSAGE.CREATE_AGENT_SKILL_RES, {
          data: null,
          error: AGENT_SKILL_DUPLICATE_NAME_ERR,
        });
        return;
      }

      const [res] = await agentSkillDB.createAgentSkill(data);
      if (res?.folderName) {
        await saveSkillFolder(folderName, filePath);
      }

      event.reply(MESSAGE.CREATE_AGENT_SKILL_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcUpdateAgentSkillPayload>(
    MESSAGE.UPDATE_AGENT_SKILL,
    MESSAGE.UPDATE_AGENT_SKILL_RES,
    async (event, payload) => {
      let { data } = payload;
      const filePath = data?.filePath;

      if (!filePath) {
        const [res] = await agentSkillDB.updateAgentSkill(data);
        event.reply(MESSAGE.UPDATE_AGENT_SKILL_RES, {
          data: res,
        });
        // Recreate agents so skill enable/disable takes effect immediately
        recreateAllAgents();
        return;
      }

      const validation = await readAndValidateSkillMdAtPath(filePath);
      if (validation?.error) {
        event.reply(MESSAGE.CREATE_AGENT_SKILL_RES, {
          data: null,
          error: validation.error,
        });
        return;
      }

      const folderName = await getFolderName(filePath);
      data = {
        ...data,
        name: data?.name || validation?.name || "",
        description: data?.description || validation?.description,
        folderName,
      };

      const skillName = data?.name?.toLowerCase();
      const [listRes] = await agentSkillDB.getListAgentSkill(1, 1, skillName);
      const existingSkill = listRes?.data?.find(
        (skill) =>
          skill?.name?.toLowerCase() === skillName && skill?.id !== data?.id,
      );

      if (existingSkill) {
        event.reply(MESSAGE.CREATE_AGENT_SKILL_RES, {
          data: null,
          error: AGENT_SKILL_DUPLICATE_NAME_ERR,
        });
        return;
      }

      const [oldSkill] = await agentSkillDB.getOneAgentSkill(data?.id!);
      const [res] = await agentSkillDB.updateAgentSkill(data);
      await saveSkillFolder(folderName, filePath);
      if (oldSkill?.folderName) {
        await deleteSkillDir(oldSkill.folderName);
      }

      event.reply(MESSAGE.UPDATE_AGENT_SKILL_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_AGENT_SKILL,
    MESSAGE.DELETE_AGENT_SKILL_RES,
    async (event, payload) => {
      const ids = payload?.data || [];
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const [existingSkill] = await agentSkillDB.getOneAgentSkill(id);
        if (existingSkill?.folderName) {
          await deleteSkillDir(existingSkill.folderName);
        }
      }

      const [res] = await agentSkillDB.deleteAgentSkill(ids);
      event.reply(MESSAGE.DELETE_AGENT_SKILL_RES, {
        data: res,
      });
    },
  );
};
