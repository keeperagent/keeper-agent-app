import { useCallback, useEffect, useState } from "react";
import { MESSAGE } from "@/electron/constant";
import { IMcpToken, IMcpConnection } from "@/electron/type";
import type {
  IpcCreateMcpTokenPayload,
  IpcDeleteMcpTokenPayload,
} from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGetListMcpToken = () => {
  const [tokens, setTokens] = useState<IMcpToken[]>([]);
  const [connections, setConnections] = useState<IMcpConnection[]>([]);

  const { execute, loading } = useIpcAction(
    MESSAGE.GET_LIST_MCP_TOKEN,
    MESSAGE.GET_LIST_MCP_TOKEN_RES,
    {
      onSuccess: (payload) => {
        setTokens(payload?.data?.tokens || []);
        setConnections(payload?.data?.connections || []);
      },
    },
  );

  const getListMcpToken = useCallback(() => execute({}), [execute]);

  // Listen for live connection updates pushed from main process
  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      setConnections(payload?.data || []);
    };
    window?.electron?.on(MESSAGE.MCP_CONNECTIONS_UPDATED, handler);

    return () => {
      window?.electron?.removeAllListeners(MESSAGE.MCP_CONNECTIONS_UPDATED);
    };
  }, []);

  return { tokens, connections, loading, getListMcpToken };
};

const useCreateMcpToken = () => {
  const [createdToken, setCreatedToken] = useState<
    (IMcpToken & { plainToken?: string }) | null
  >(null);

  const { execute, loading, isSuccess } =
    useIpcAction<IpcCreateMcpTokenPayload>(
      MESSAGE.CREATE_MCP_TOKEN,
      MESSAGE.CREATE_MCP_TOKEN_RES,
      {
        onSuccess: (payload) => setCreatedToken(payload?.data || null),
      },
    );

  const createMcpToken = (data: IMcpToken & { plainToken: string }) =>
    execute({ data });

  const clearCreatedToken = () => setCreatedToken(null);

  return {
    loading,
    isSuccess,
    createdToken,
    createMcpToken,
    clearCreatedToken,
  };
};

const useDeleteMcpToken = () => {
  const { execute, loading, isSuccess } =
    useIpcAction<IpcDeleteMcpTokenPayload>(
      MESSAGE.DELETE_MCP_TOKEN,
      MESSAGE.DELETE_MCP_TOKEN_RES,
    );

  const deleteMcpToken = (ids: number[]) => execute({ data: ids });

  return { loading, isSuccess, deleteMcpToken };
};

export { useGetListMcpToken, useCreateMcpToken, useDeleteMcpToken };
