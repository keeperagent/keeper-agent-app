import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { MESSAGE } from "@/electron/constant";
import { IMcpServer } from "@/electron/type";
import type { AppDispatch } from "@/redux/store";
import {
  actSaveGetListMcpServer,
  actSaveCreateMcpServer,
  actSaveUpdateMcpServer,
  actSaveDeleteMcpServer,
} from "@/redux/mcpServer";
import type { IpcGetListMcpServerPayload } from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGetListMcpServer = () => {
  const dispatch = useDispatch<AppDispatch>();
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

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      const { id, status, lastError, toolsCount } = payload?.data || {};
      if (id == null) {
        return;
      }
      dispatch(
        actSaveUpdateMcpServer({
          id,
          status,
          lastError,
          toolsCount,
        } as IMcpServer),
      );
    };
    window?.electron?.on(MESSAGE.MCP_SERVER_STATUS_UPDATED, handler);
    return () => {
      window?.electron?.removeListener(
        MESSAGE.MCP_SERVER_STATUS_UPDATED,
        handler,
      );
    };
  }, []);

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
