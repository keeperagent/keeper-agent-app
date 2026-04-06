import { useState } from "react";
import { uid } from "uid";
import { MESSAGE } from "@/electron/constant";

const useSaveNodeSecret = () => {
  const [loading, setLoading] = useState(false);

  const saveNodeSecret = (
    workflowId: number,
    nodeId: string,
    encryptKey: string,
  ): Promise<void> => {
    return new Promise((resolve) => {
      const requestId = uid(25);
      setLoading(true);
      window?.electron?.send(MESSAGE.UPSERT_NODE_SECRET, {
        requestId,
        workflowId,
        nodeId,
        encryptKey,
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

/** Check whether a per-node secret key exists in the database (never returns the plaintext value). */
const useGetNodeSecret = () => {
  const [loading, setLoading] = useState(false);

  const getNodeSecret = (
    workflowId: number,
    nodeId: string,
  ): Promise<boolean> => {
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
        resolve(Boolean(payload?.hasEncryptKey));
      };

      window?.electron?.on(MESSAGE.GET_NODE_SECRET_RES, handler);
    });
  };

  return { getNodeSecret, loading };
};

export { useSaveNodeSecret, useGetNodeSecret };
