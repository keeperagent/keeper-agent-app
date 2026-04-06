import { MESSAGE } from "@/electron/constant";
import { nodeSecretDB } from "@/electron/database/nodeSecret";
import type {
  IpcUpsertNodeSecretPayload,
  IpcGetNodeSecretPayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const nodeSecretController = () => {
  onIpc<IpcUpsertNodeSecretPayload>(
    MESSAGE.UPSERT_NODE_SECRET,
    MESSAGE.UPSERT_NODE_SECRET_RES,
    async (event, payload) => {
      const { requestId, workflowId, nodeId, secretKey } = payload;
      const err = await nodeSecretDB.saveSecretKey(
        workflowId,
        nodeId,
        secretKey || "",
      );
      event.reply(MESSAGE.UPSERT_NODE_SECRET_RES, {
        requestId,
        error: err?.message || null,
      });
    },
  );

  onIpc<IpcGetNodeSecretPayload>(
    MESSAGE.GET_NODE_SECRET,
    MESSAGE.GET_NODE_SECRET_RES,
    async (event, payload) => {
      const { requestId, workflowId, nodeId } = payload;
      const secretKey = await nodeSecretDB.getSecretKey(workflowId, nodeId);
      event.reply(MESSAGE.GET_NODE_SECRET_RES, {
        requestId,
        hasSecretKey: Boolean(secretKey),
      });
    },
  );
};
