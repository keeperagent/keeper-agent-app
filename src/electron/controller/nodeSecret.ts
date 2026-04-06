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
      const { requestId, workflowId, nodeId, encryptKey } = payload;
      const err = await nodeSecretDB.saveEncryptKey(
        workflowId,
        nodeId,
        encryptKey || "",
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
      const encryptKey = await nodeSecretDB.getEncryptKey(workflowId, nodeId);
      event.reply(MESSAGE.GET_NODE_SECRET_RES, {
        requestId,
        hasEncryptKey: Boolean(encryptKey),
      });
    },
  );
};
