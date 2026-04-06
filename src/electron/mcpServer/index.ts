import http from "http";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import crypto from "crypto";
import { mcpTokenDB } from "@/electron/database/mcpToken";
import { preferenceDB } from "@/electron/database/preference";
import { McpTokenPermission, IMcpToken } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { DEFAULT_MCP_PORT } from "@/electron/constant";
import { connectionTracker } from "./connectionTracker";
import { registerReadTools } from "./tools/readTools";
import { registerWriteTools } from "./tools/writeTools";

const ALLOWED_HOST = "127.0.0.1";

export const hashToken = (plainToken: string): string => {
  return crypto.createHash("sha256").update(plainToken).digest("hex");
};

class KeeperMcpServer {
  private httpServer: http.Server | null = null;
  private sessions = new Map<string, StreamableHTTPServerTransport>();
  private isRunning = false;

  async start(port: number = DEFAULT_MCP_PORT): Promise<void> {
    if (this.isRunning) {
      return;
    }

    const app = express();
    app.use(express.json());

    // Block non-localhost Host headers (DNS rebinding protection)
    app.use((req: any, res: any, next: any) => {
      const host = req.headers.host || "";
      const hostname = host.split(":")[0];
      if (
        hostname !== "127.0.0.1" &&
        hostname !== "localhost" &&
        hostname !== "::1"
      ) {
        res.status(403).json({ error: "Forbidden: invalid host" });
        return;
      }
      next();
    });

    // Failed auth attempts per IP — reset after 15 minutes
    const failedAttempts = new Map<
      string,
      { count: number; resetAt: number }
    >();
    const MAX_FAILED_ATTEMPTS = 10;
    const FAILED_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

    // Bearer token authentication middleware
    const authenticate = async (req: any, res: any, next: any) => {
      const ip = req.socket.remoteAddress || "unknown";
      const now = Date.now();
      const record = failedAttempts.get(ip);

      if (record) {
        if (now < record.resetAt && record.count >= MAX_FAILED_ATTEMPTS) {
          res.status(429).json({ error: "Too many failed attempts" });
          return;
        }
        if (now >= record.resetAt) {
          failedAttempts.delete(ip);
        }
      }
      const authHeader = req.headers.authorization || "";
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (!match) {
        res.status(401).json({ error: "Missing Bearer token" });
        return;
      }

      const tokenHash = hashToken(match[1]);
      const [tokenRecord] = await mcpTokenDB.getByTokenHash(tokenHash);
      if (!tokenRecord) {
        const existing = failedAttempts.get(ip);
        if (existing && now < existing.resetAt) {
          existing.count++;
        } else {
          failedAttempts.set(ip, {
            count: 1,
            resetAt: now + FAILED_ATTEMPT_WINDOW_MS,
          });
        }
        res.status(401).json({ error: "Invalid token" });
        return;
      }
      failedAttempts.delete(ip);
      req.mcpToken = tokenRecord;
      next();
    };

    // Single endpoint handles all MCP traffic (GET, POST, DELETE)
    app.all("/mcp", authenticate, async (req: any, res: any) => {
      const incomingSessionId = req.headers["mcp-session-id"] as
        | string
        | undefined;

      // Route existing session
      if (incomingSessionId) {
        const transport = this.sessions.get(incomingSessionId);
        if (!transport) {
          res.status(404).json({ error: "Session not found" });
          return;
        }
        await transport.handleRequest(req, res, req.body);
        return;
      }

      // New session — only POST (initialize) creates a session
      if (req.method !== "POST") {
        res
          .status(400)
          .json({ error: "New connections must use POST to initialize" });
        return;
      }

      const mcpToken: IMcpToken = req?.mcpToken as IMcpToken;

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (sessionId) => {
          this.sessions.set(sessionId, transport);
          connectionTracker.add(sessionId, {
            tokenId: mcpToken.id!,
            tokenName: mcpToken.name!,
            connectedAt: Date.now(),
            clientInfo: req.headers["user-agent"] || "",
          });
          logEveryWhere({
            message: `Keeper MCP: new session from "${mcpToken?.name}" (${sessionId})`,
          });
        },
        onsessionclosed: (sessionId) => {
          this.sessions.delete(sessionId);
          connectionTracker.remove(sessionId);
          logEveryWhere({
            message: `Keeper MCP: session closed (${sessionId})`,
          });
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          this.sessions.delete(transport.sessionId);
          connectionTracker.remove(transport.sessionId);
        }
      };

      const server = new McpServer({
        name: "keeper-agent",
        version: "1.0.0",
      });

      registerReadTools(server);
      if (mcpToken?.permission === McpTokenPermission.READ_WRITE) {
        registerWriteTools(server, mcpToken);
      }

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    });

    this.httpServer = http.createServer(app);

    await new Promise<void>((resolve: any, reject: any) => {
      this.httpServer?.listen(port, ALLOWED_HOST, () => {
        this.isRunning = true;
        logEveryWhere({
          message: `Keeper MCP server started on ${ALLOWED_HOST}:${port}`,
        });
        resolve();
      });

      this.httpServer?.on("error", (err: Error) => {
        logEveryWhere({
          message: `Keeper MCP server error: ${err.message}`,
        });
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning || !this.httpServer) {
      return;
    }

    // Close all active sessions
    for (const [sessionId, transport] of this.sessions.entries()) {
      try {
        await transport.close();
      } catch {}
      connectionTracker.remove(sessionId);
    }
    this.sessions.clear();

    await new Promise<void>((resolve) => {
      this.httpServer?.close(() => {
        this.isRunning = false;
        this.httpServer = null;
        logEveryWhere({ message: "Keeper MCP server stopped" });
        resolve();
      });
    });
  }

  stopConnectionsByTokenId(tokenId: number) {
    const sessionIds = connectionTracker.getConnectionIdsByTokenId(tokenId);
    for (const sessionId of sessionIds) {
      const transport = this.sessions.get(sessionId);
      if (transport) {
        transport.close().catch(() => {});
        this.sessions.delete(sessionId);
      }
      connectionTracker.remove(sessionId);
    }
  }

  async startIfEnabled(): Promise<void> {
    try {
      const [preference] = await preferenceDB.getOnePreference();
      if (preference?.isMcpServerOn) {
        await this.start(preference.mcpServerPort || DEFAULT_MCP_PORT);
      }
    } catch (err: any) {
      logEveryWhere({
        message: `Failed to start Keeper MCP server if enabled: ${err?.message}`,
      });
    }
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const keeperMcpServer = new KeeperMcpServer();
