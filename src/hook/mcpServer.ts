import { useRef } from "react";
import { MESSAGE } from "@/electron/constant";
import { IMcpServer } from "@/electron/type";
import {
  actSaveGetListMcpServer,
  actSaveCreateMcpServer,
  actSaveUpdateMcpServer,
  actSaveDeleteMcpServer,
} from "@/redux/mcpServer";
import type { IpcGetListMcpServerPayload } from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGetListMcpServer = () => {
  const {
    execute: getListMcpServer,
    loading,
    isSuccess,
  } = useIpcAction<IpcGetListMcpServerPayload>(
    MESSAGE.GET_LIST_MCP_SERVER,
    MESSAGE.GET_LIST_MCP_SERVER_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveGetListMcpServer(payload?.data)),
    },
  );
  return { loading, isSuccess, getListMcpServer };
};

const useCreateMcpServer = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_MCP_SERVER,
    MESSAGE.CREATE_MCP_SERVER_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveCreateMcpServer(payload?.data)),
    },
  );
  const createMcpServer = (data: IMcpServer) => execute({ data });
  return { loading, isSuccess, createMcpServer };
};

const useUpdateMcpServer = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_MCP_SERVER,
    MESSAGE.UPDATE_MCP_SERVER_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveUpdateMcpServer(payload?.data)),
    },
  );
  const updateMcpServer = (data: IMcpServer) => execute({ data });
  return { loading, isSuccess, updateMcpServer };
};

const useDeleteMcpServer = () => {
  const pendingIdRef = useRef<number | null>(null);
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_MCP_SERVER,
    MESSAGE.DELETE_MCP_SERVER_RES,
    {
      onSuccess: (_payload, dispatch) => {
        if (pendingIdRef.current != null) {
          dispatch(actSaveDeleteMcpServer(pendingIdRef.current));
          pendingIdRef.current = null;
        }
      },
    },
  );
  const deleteMcpServer = (id: number) => {
    pendingIdRef.current = id;
    execute({ data: [id] });
  };
  return { loading, isSuccess, deleteMcpServer };
};

export {
  useGetListMcpServer,
  useCreateMcpServer,
  useUpdateMcpServer,
  useDeleteMcpServer,
};
