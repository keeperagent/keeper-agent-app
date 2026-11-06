import { useMemo, useState } from "react";
import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import type { IRelationshipGraphData } from "@/electron/type";
import type { IpcGetRelationshipGraphWalletsPayload } from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const mergeGraphData = (
  core: IRelationshipGraphData | null,
  wallets: IRelationshipGraphData | null,
): IRelationshipGraphData | null => {
  if (!core && !wallets) {
    return null;
  }
  return {
    nodes: [...(core?.nodes || []), ...(wallets?.nodes || [])],
    edges: [...(core?.edges || []), ...(wallets?.edges || [])],
  };
};

// Fires the cheap "core" and expensive "wallets" calls together, merging
// only once both resolve
const useGetRelationshipGraph = () => {
  const [coreData, setCoreData] = useState<IRelationshipGraphData | null>(null);
  const [walletsData, setWalletsData] = useState<IRelationshipGraphData | null>(
    null,
  );

  const { execute: executeCore, loading: coreLoading } = useIpcAction<
    undefined,
    { data?: IRelationshipGraphData }
  >(
    MESSAGE.GET_RELATIONSHIP_GRAPH_CORE,
    MESSAGE.GET_RELATIONSHIP_GRAPH_CORE_RES,
    {
      onSuccess: (payload) => setCoreData(payload?.data || null),
      onError: (error) => message.error(error),
    },
  );

  const { execute: executeWallets, loading: walletsLoading } = useIpcAction<
    IpcGetRelationshipGraphWalletsPayload,
    { data?: IRelationshipGraphData }
  >(
    MESSAGE.GET_RELATIONSHIP_GRAPH_WALLETS,
    MESSAGE.GET_RELATIONSHIP_GRAPH_WALLETS_RES,
    {
      onSuccess: (payload) => setWalletsData(payload?.data || null),
      onError: (error) => {
        setWalletsData(null);
        message.error(error);
      },
    },
  );

  const getRelationshipGraph = (
    payload?: IpcGetRelationshipGraphWalletsPayload,
  ) => {
    executeCore();
    executeWallets(payload);
  };

  const relationshipGraph = useMemo(
    () =>
      coreData && walletsData ? mergeGraphData(coreData, walletsData) : null,
    [coreData, walletsData],
  );

  return {
    relationshipGraph,
    loading: coreLoading || walletsLoading,
    getRelationshipGraph,
  };
};

export { useGetRelationshipGraph };
