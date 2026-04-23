import os from "os";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { MESSAGE, DEFAULT_MCP_PORT } from "@/electron/constant";
import { mcpTokenService } from "@/electron/service/mcpToken";
import { keeperMcpServer, hashToken } from "@/electron/mcpServer";
import { connectionTracker } from "@/electron/mcpServer/connectionTracker";
import { preferenceService } from "@/electron/service/preference";
import { McpTokenPermission } from "@/electron/type";
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
      const [tokens] = await mcpTokenService.getListMcpToken();
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
      const [token, err] = await mcpTokenService.createMcpToken({
        ...rest,
        tokenHash,
      });
      if (err) {
        event.reply(MESSAGE.CREATE_MCP_TOKEN_RES, {
          error: err.message,
        });
        return;
      }
      const { tokenHash: _tokenHash, ...tokenWithoutHash } = token!;
      event.reply(MESSAGE.CREATE_MCP_TOKEN_RES, {
        data: { ...tokenWithoutHash, plainToken },
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
      const [count] = await mcpTokenService.deleteMcpToken(listId);
      event.reply(MESSAGE.DELETE_MCP_TOKEN_RES, { data: count });
    },
  );

  onIpc(
    MESSAGE.INSTALL_TO_CLAUDE_CODE,
    MESSAGE.INSTALL_TO_CLAUDE_CODE_RES,
    async (event, _payload) => {
      try {
        const [preference] = await preferenceService.getOnePreference();
        const port = preference?.mcpServerPort || DEFAULT_MCP_PORT;

        const plainToken =
          crypto.randomUUID().replace(/-/g, "") +
          crypto.randomUUID().replace(/-/g, "");
        const tokenHash = hashToken(plainToken);

        const tokenName = "Claude Code CLI";
        const [existingTokens] = await mcpTokenService.getListMcpToken();
        const existingClaudeToken = (existingTokens || []).find(
          (token) => token.name === tokenName,
        );

        if (existingClaudeToken) {
          const [_updated, updateErr] = await mcpTokenService.updateMcpToken({
            ...existingClaudeToken,
            tokenHash,
          });
          if (updateErr) {
            event.reply(MESSAGE.INSTALL_TO_CLAUDE_CODE_RES, {
              error: updateErr.message,
            });
            return;
          }
        } else {
          const [_token, createErr] = await mcpTokenService.createMcpToken({
            name: tokenName,
            permission: McpTokenPermission.READ_WRITE,
            tokenHash,
          });
          if (createErr) {
            event.reply(MESSAGE.INSTALL_TO_CLAUDE_CODE_RES, {
              error: createErr.message,
            });
            return;
          }
        }

        const claudeConfigPath = path.join(os.homedir(), ".claude.json");

        let existing: Record<string, any> = {};
        if (fs.existsSync(claudeConfigPath)) {
          const raw = fs.readFileSync(claudeConfigPath, "utf-8");
          try {
            existing = JSON.parse(raw);
          } catch (parseErr: any) {
            throw new Error(
              `Claude config file is not valid JSON and cannot be updated safely. Please fix ${claudeConfigPath} manually. Error: ${parseErr?.message}`,
            );
          }
        }

        const updated = {
          ...existing,
          mcpServers: {
            ...(existing.mcpServers || {}),
            "keeper-agent": {
              type: "http",
              url: `http://127.0.0.1:${port}/mcp`,
              headers: { Authorization: `Bearer ${plainToken}` },
            },
          },
        };

        const tmpPath = `${claudeConfigPath}.tmp`;
        fs.writeFileSync(tmpPath, JSON.stringify(updated, null, 2), "utf-8");
        fs.renameSync(tmpPath, claudeConfigPath);

        event.reply(MESSAGE.INSTALL_TO_CLAUDE_CODE_RES, { data: true });
      } catch (err: any) {
        event.reply(MESSAGE.INSTALL_TO_CLAUDE_CODE_RES, {
          error: err?.message || "Failed to install",
        });
      }
    },
  );
};
