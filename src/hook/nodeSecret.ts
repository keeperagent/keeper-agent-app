import { useState } from "react";
import { uid } from "uid";
import { MESSAGE } from "@/electron/constant";

const useSaveNodeSecret = () => {
  const [loading, setLoading] = useState(false);

  const saveNodeSecret = (
    workflowId: number,
    nodeId: string,
    secretKey: string,
  ): Promise<void> => {
    return new Promise((resolve) => {
      const requestId = uid(25);
      setLoading(true);
      window?.electron?.send(MESSAGE.UPSERT_NODE_SECRET, {
        requestId,
        workflowId,
        nodeId,
        secretKey,
      });

      const handler = (_event: any, payload: any) => {
        if (payload?.requestId !== requestId) return;
        window?.electron?.removeAllListeners(MESSAGE.UPSERT_NODE_SECRET_RES);
        setLoading(false);
        resolve();
      };

      window?.electron?.on(MESSAGE.UPSERT_NODE_SECRET_RES, handler);
    });
  };

  return { saveNodeSecret, loading };
};

/** Fetch a per-node secret key from the database (never stored in Redux). */
const useGetNodeSecret = () => {
  const [loading, setLoading] = useState(false);

  const getNodeSecret = (workflowId: number, nodeId: string): Promise<string> => {
    return new Promise((resolve) => {
      const requestId = uid(25);
      setLoading(true);
      window?.electron?.send(MESSAGE.GET_NODE_SECRET, {
        requestId,
        workflowId,
        nodeId,
      });

      const handler = (_event: any, payload: any) => {
        if (payload?.requestId !== requestId) return;
        window?.electron?.removeAllListeners(MESSAGE.GET_NODE_SECRET_RES);
        setLoading(false);
        resolve(payload?.secretKey || "");
      };

      window?.electron?.on(MESSAGE.GET_NODE_SECRET_RES, handler);
    });
  };

  return { getNodeSecret, loading };
};

export { useSaveNodeSecret, useGetNodeSecret };
