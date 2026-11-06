import { useState } from "react";
import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import type { IRelationshipGraphData } from "@/electron/type";
import type { IpcGetRelationshipGraphPayload } from "@/electron/ipcTypes";
import { useIpcAction } from "./useIpcAction";

const useGetRelationshipGraph = () => {
  const [relationshipGraph, setRelationshipGraph] =
    useState<IRelationshipGraphData | null>(null);

  const { execute, loading } = useIpcAction<
    IpcGetRelationshipGraphPayload,
    { data?: IRelationshipGraphData }
  >(MESSAGE.GET_RELATIONSHIP_GRAPH, MESSAGE.GET_RELATIONSHIP_GRAPH_RES, {
    onSuccess: (payload) => setRelationshipGraph(payload?.data || null),
    onError: (error) => message.error(error),
  });

  return { relationshipGraph, loading, getRelationshipGraph: execute };
};

export { useGetRelationshipGraph };
