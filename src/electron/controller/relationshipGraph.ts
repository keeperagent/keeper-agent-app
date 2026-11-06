import { getRelationshipGraph } from "@/electron/service/relationshipGraph";
import { MESSAGE } from "@/electron/constant";
import type { IpcGetRelationshipGraphPayload } from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const relationshipGraphController = () => {
  onIpc<IpcGetRelationshipGraphPayload>(
    MESSAGE.GET_RELATIONSHIP_GRAPH,
    MESSAGE.GET_RELATIONSHIP_GRAPH_RES,
    async (event, payload) => {
      const [data, err] = await getRelationshipGraph(payload?.encryptKey);
      if (err) {
        event.reply(MESSAGE.GET_RELATIONSHIP_GRAPH_RES, {
          error: err?.message || "Failed to load relationship graph",
        });
        return;
      }
      event.reply(MESSAGE.GET_RELATIONSHIP_GRAPH_RES, { data });
    },
  );
};
