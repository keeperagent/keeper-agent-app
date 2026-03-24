import { MESSAGE } from "@/electron/constant";
import { mcpTokenDB } from "@/electron/database/mcpToken";
import { keeperMcpServer, hashToken } from "@/electron/mcpServer";
import { connectionTracker } from "@/electron/mcpServer/connectionTracker";
import type {
  IpcCreateMcpTokenPayload,
  IpcDeleteMcpTokenPayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const mcpTokenController = () => {
  onIpc(
    MESSAGE.GET_LIST_MCP_TOKEN,
    MESSAGE.GET_LIST_MCP_TOKEN_RES,
    async (event, _payload) => {
      const [tokens] = await mcpTokenDB.getListMcpToken();
      const connections = connectionTracker.getAll();

      event.reply(MESSAGE.GET_LIST_MCP_TOKEN_RES, {
        data: { tokens: tokens || [], connections },
      });
    },
  );

  onIpc<IpcCreateMcpTokenPayload>(
    MESSAGE.CREATE_MCP_TOKEN,
    MESSAGE.CREATE_MCP_TOKEN_RES,
    async (event, payload) => {
      const { plainToken, ...rest } = payload?.data || {};
      if (!plainToken) {
        event.reply(MESSAGE.CREATE_MCP_TOKEN_RES, {
          error: "Missing plainToken",
        });
        return;
      }

      const tokenHash = hashToken(plainToken);
      const [token, err] = await mcpTokenDB.createMcpToken({
        ...rest,
        tokenHash,
      });
      if (err) {
        event.reply(MESSAGE.CREATE_MCP_TOKEN_RES, {
          error: err.message,
        });
        return;
      }
      event.reply(MESSAGE.CREATE_MCP_TOKEN_RES, {
        data: { ...token, plainToken },
      });
    },
  );

  onIpc<IpcDeleteMcpTokenPayload>(
    MESSAGE.DELETE_MCP_TOKEN,
    MESSAGE.DELETE_MCP_TOKEN_RES,
    async (event, payload) => {
      const listId = payload?.data || [];
      for (const tokenId of listId) {
        keeperMcpServer.stopConnectionsByTokenId(tokenId);
      }
      const [count] = await mcpTokenDB.deleteMcpToken(listId);
      event.reply(MESSAGE.DELETE_MCP_TOKEN_RES, { data: count });
    },
  );
};
