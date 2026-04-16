import { MESSAGE } from "@/electron/constant";
import { mcpServerDB } from "@/electron/database/mcpServer";
import { IMcpServer } from "@/electron/type";
import { mcpToolLoader } from "@/electron/appAgent/mcpTool";
import type {
  IpcGetListMcpServerPayload,
  IpcCreateMcpServerPayload,
  IpcUpdateMcpServerPayload,
  IpcDeletePayload,
  IpcGetMcpServerToolsPayload,
} from "@/electron/ipcTypes";
import { onIpc } from "./helpers";

export const mcpServerController = () => {
  onIpc<IpcGetListMcpServerPayload>(
    MESSAGE.GET_LIST_MCP_SERVER,
    MESSAGE.GET_LIST_MCP_SERVER_RES,
    async (event, payload) => {
      const { page, pageSize, searchText, sortField } = payload;
      const [res] = await mcpServerDB.getListMcpServer(
        page,
        pageSize,
        searchText,
        sortField,
      );
      const listWithCommandOrUrl =
        res?.data?.map((server: IMcpServer) => ({
          ...server,
          commandOrUrl: mcpToolLoader.getMcpServerDisplayLine(server.config),
        })) || [];

      // fetch server status in background
      for (const server of listWithCommandOrUrl) {
        if (server?.id != null) {
          mcpToolLoader.checkMcpServerStatus(server.id);
        }
      }

      event.reply(MESSAGE.GET_LIST_MCP_SERVER_RES, {
        data: res ? { ...res, data: listWithCommandOrUrl } : res,
      });
    },
  );

  onIpc<IpcCreateMcpServerPayload>(
    MESSAGE.CREATE_MCP_SERVER,
    MESSAGE.CREATE_MCP_SERVER_RES,
    async (event, payload) => {
      const [res, err] = await mcpServerDB.createMcpServer(payload?.data);
      if (err) {
        event.reply(MESSAGE.CREATE_MCP_SERVER_RES, { error: err?.message });
        return;
      }
      const withCommandOrUrl =
        res != null
          ? {
              ...res,
              commandOrUrl: mcpToolLoader.getMcpServerDisplayLine(res.config),
            }
          : res;
      event.reply(MESSAGE.CREATE_MCP_SERVER_RES, {
        data: withCommandOrUrl,
      });
    },
  );

  onIpc<IpcUpdateMcpServerPayload>(
    MESSAGE.UPDATE_MCP_SERVER,
    MESSAGE.UPDATE_MCP_SERVER_RES,
    async (event, payload) => {
      const data = {
        ...payload?.data,
        lastError: "",
        toolsCount: 0,
      };
      const [res, err] = await mcpServerDB.updateMcpServer(data);
      if (err) {
        event.reply(MESSAGE.UPDATE_MCP_SERVER_RES, { error: err?.message });
        return;
      }
      mcpToolLoader.clearMcpServerToolsCache(payload?.data?.id!);
      const withCommandOrUrl = {
        ...res,
        commandOrUrl: mcpToolLoader.getMcpServerDisplayLine(res?.config),
      };
      event.reply(MESSAGE.UPDATE_MCP_SERVER_RES, {
        data: withCommandOrUrl,
      });
      mcpToolLoader.checkMcpServerStatus(payload?.data?.id!);
    },
  );

  onIpc<IpcDeletePayload>(
    MESSAGE.DELETE_MCP_SERVER,
    MESSAGE.DELETE_MCP_SERVER_RES,
    async (event, payload) => {
      const [res, err] = await mcpServerDB.deleteMcpServer(payload?.data);
      if (err) {
        event.reply(MESSAGE.DELETE_MCP_SERVER_RES, { error: err?.message });
        return;
      }
      event.reply(MESSAGE.DELETE_MCP_SERVER_RES, {
        data: res,
      });
    },
  );

  onIpc<IpcGetMcpServerToolsPayload | undefined>(
    MESSAGE.GET_MCP_SERVER_TOOLS,
    MESSAGE.GET_MCP_SERVER_TOOLS_RES,
    async (event, payload) => {
      const serverId = payload?.serverId;
      const serverName = payload?.serverName || "";
      const config = payload?.config || "";
      if (serverId == null || !serverName || !config) {
        event.reply(MESSAGE.GET_MCP_SERVER_TOOLS_RES, {
          data: [],
          error: "Missing serverId, serverName or config",
        });
        return;
      }
      const tools = await mcpToolLoader.listMcpServerTools(
        serverId,
        serverName,
        config,
      );
      event.reply(MESSAGE.GET_MCP_SERVER_TOOLS_RES, { data: tools });
    },
  );
};
