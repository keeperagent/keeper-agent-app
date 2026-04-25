import { useRef } from "react";
import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import { IAgentSkill } from "@/electron/type";
import {
  actSaveGetListAgentSkill,
  actSaveCreateAgentSkill,
  actSaveUpdateAgentSkill,
  actSaveDeleteAgentSkill,
} from "@/redux/agentSkill";
import type { IpcGetListAgentSkillPayload } from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGetListAgentSkill = () => {
  const {
    execute: getListAgentSkill,
    loading,
    isSuccess,
  } = useIpcAction<IpcGetListAgentSkillPayload>(
    MESSAGE.GET_LIST_AGENT_SKILL,
    MESSAGE.GET_LIST_AGENT_SKILL_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetListAgentSkill(payload?.data)),
    },
  );
  return { loading, isSuccess, getListAgentSkill };
};

const useCreateAgentSkill = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_AGENT_SKILL,
    MESSAGE.CREATE_AGENT_SKILL_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.error) {
          message.error(payload.error);
          return;
        }
        if (payload?.data) {
          dispatch(actSaveCreateAgentSkill(payload.data));
        }
      },
    },
  );
  const createAgentSkill = (data: Partial<IAgentSkill>) => execute({ data });
  return { loading, isSuccess, createAgentSkill };
};

const useUpdateAgentSkill = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_AGENT_SKILL,
    MESSAGE.UPDATE_AGENT_SKILL_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.error) {
          message.error(payload.error);
          return;
        }
        dispatch(actSaveUpdateAgentSkill(payload?.data));
      },
    },
  );
  const updateAgentSkill = (data: IAgentSkill) => execute({ data });
  return { loading, isSuccess, updateAgentSkill };
};

const useDeleteAgentSkill = () => {
  const pendingIdRef = useRef<number | null>(null);
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_AGENT_SKILL,
    MESSAGE.DELETE_AGENT_SKILL_RES,
    {
      onSuccess: (_payload, dispatch) => {
        if (pendingIdRef.current != null) {
          dispatch(actSaveDeleteAgentSkill(pendingIdRef.current));
          pendingIdRef.current = null;
        }
      },
    },
  );
  const deleteAgentSkill = (id: number) => {
    pendingIdRef.current = id;
    execute({ data: [id] });
  };
  return { loading, isSuccess, deleteAgentSkill };
};

export {
  useGetListAgentSkill,
  useCreateAgentSkill,
  useUpdateAgentSkill,
  useDeleteAgentSkill,
};
