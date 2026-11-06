import {
  getRelationshipGraphCore,
  getRelationshipGraphWallets,
} from "@/electron/service/relationshipGraph";
import { MESSAGE } from "@/electron/constant";
import type { IpcGetRelationshipGraphWalletsPayload } from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const relationshipGraphController = () => {
  onIpc(
    MESSAGE.GET_RELATIONSHIP_GRAPH_CORE,
    MESSAGE.GET_RELATIONSHIP_GRAPH_CORE_RES,
    async (event) => {
      const [data, err] = await getRelationshipGraphCore();
      if (err) {
        event.reply(MESSAGE.GET_RELATIONSHIP_GRAPH_CORE_RES, {
          error: err?.message || "Failed to load relationship graph",
        });
        return;
      }
      event.reply(MESSAGE.GET_RELATIONSHIP_GRAPH_CORE_RES, { data });
    },
  );

  onIpc<IpcGetRelationshipGraphWalletsPayload>(
    MESSAGE.GET_RELATIONSHIP_GRAPH_WALLETS,
    MESSAGE.GET_RELATIONSHIP_GRAPH_WALLETS_RES,
    async (event, payload) => {
      const [data, err] = await getRelationshipGraphWallets(
        payload?.encryptKey,
      );
      if (err) {
        event.reply(MESSAGE.GET_RELATIONSHIP_GRAPH_WALLETS_RES, {
          error: err?.message || "Failed to load relationship graph wallets",
        });
        return;
      }
      event.reply(MESSAGE.GET_RELATIONSHIP_GRAPH_WALLETS_RES, { data });
    },
  );
};
