import { app } from "electron";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { shellEnv } from "shell-env";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { mcpServerDB } from "@/electron/database/mcpServer";
import { IMcpServer, MCPServerStatus } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { TimeoutCache } from "@/electron/service/timeoutCache";

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

type McpServerStatusInfo = {
  status: MCPServerStatus;
  lastError: string;
  toolsCount: number;
};

type McpConfig = {
  command: string;
  args?: string[];
  env?: Record<string, string>;
};

type McpHttpConfig = {
  url: string;
  transport?: string;
};

type McpConfigOrHttp = McpConfig | McpHttpConfig;

type McpToolInfo = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

type McpSubAgentInfo = {
  name: string;
  description: string;
  tools: DynamicStructuredTool[];
};

const jsonSchemaFieldToZod = (prop: Record<string, unknown>): z.ZodTypeAny => {
  switch (prop?.type) {
    case "string":
      return z.string();
    case "number":
    case "integer":
      return z.number();
    case "boolean":
      return z.boolean();
    case "array": {
      const items = prop?.items as Record<string, unknown> | undefined;
      return z.array(items?.type ? jsonSchemaFieldToZod(items) : z.string());
    }
    case "object": {
      const nested = prop?.properties;
      if (!nested || typeof nested !== "object") {
        return z.object({}).passthrough();
      }
      const nestedRequired = new Set<string>(
        Array.isArray(prop?.required) ? (prop.required as string[]) : [],
      );
      const nestedShape: Record<string, z.ZodTypeAny> = {};
      for (const [k, v] of Object.entries(nested)) {
        const np = v as Record<string, unknown>;
        let nf = jsonSchemaFieldToZod(np);
        if (typeof np?.description === "string") {
          nf = nf.describe(np.description);
        }
        if (!nestedRequired.has(k)) {
          nf = nf.optional();
        }
        nestedShape[k] = nf;
      }
      return z.object(nestedShape).passthrough();
    }
    default:
      return z.string();
  }
};

const mcpInputSchemaToZod = (
  inputSchema?: Record<string, unknown>,
): z.ZodTypeAny => {
  const properties = inputSchema?.properties;
  if (!properties || typeof properties !== "object") {
    return z.object({}).passthrough();
  }

  const required = new Set<string>(
    Array.isArray(inputSchema?.required)
      ? (inputSchema.required as string[])
      : [],
  );

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, rawProp] of Object.entries(properties)) {
    const prop = rawProp as Record<string, unknown>;
    let field = jsonSchemaFieldToZod(prop);

    if (typeof prop?.description === "string") {
      field = field.describe(prop.description);
    }

    if (!required.has(key)) {
      field = field.optional();
    }

    shape[key] = field;
  }

  return z.object(shape).passthrough();
};

export class McpToolLoader {
  private readonly toolsCache = new TimeoutCache<McpToolInfo[]>(EIGHT_HOURS_MS);
  private readonly statusCache = new TimeoutCache<McpServerStatusInfo>(
    ONE_MINUTE_MS,
  );

  private isMcpHttpConfig = (
    config: McpConfigOrHttp,
  ): config is McpHttpConfig => typeof (config as any)?.url === "string";

  getServerConfig = (configStr: string): Record<string, any> | null => {
    try {
      const raw = JSON.parse(configStr);
      if (!raw) {
        return null;
      }
      const mcpServers = raw?.mcpServers;
      if (!mcpServers) {
        return null;
      }
      const first = Object.values(mcpServers)[0];
      if (first != null && typeof first === "object") {
        return first;
      }
      return null;
    } catch {
      return null;
    }
  };

  getMcpServerDisplayLine = (configStr: string = ""): string => {
    const config = this.getServerConfig(configStr);
    if (!config) {
      return "";
    }
    if (this.isMcpHttpConfig(config as McpConfigOrHttp)) {
      return config?.url || "";
    }
    if (config?.transportType === "http" || config?.transportType === "sse") {
      return config?.endpoint || "";
    }
    const cmd = config?.command;
    const args = Array.isArray(config?.args) ? config?.args : [];
    return [cmd, ...args].join(" ");
  };

  tryConnectMcpServer = async (
    name: string,
    config: McpConfigOrHttp,
  ): Promise<{ client: Client | null; error?: string }> => {
    try {
      const client = new Client(
        { name: `keeper-agent-${name}`, version: "1.0.0" },
        { capabilities: {} },
      );

      if (this.isMcpHttpConfig(config)) {
        const url = config?.url?.startsWith("http")
          ? config?.url
          : `https://${config?.url}`;
        const urlObj = new URL(url);
        const transport = new StreamableHTTPClientTransport(urlObj);
        await client.connect(transport);
      } else {
        if (!config?.command) {
          return { client: null, error: "Missing or invalid command" };
        }
        const baseEnv: Record<string, string> = {};
        Object.keys(process.env).forEach((key) => {
          if (process.env[key]) {
            baseEnv[key] = process.env[key];
          }
        });

        let mergedEnv = baseEnv;
        if (app.isPackaged) {
          const shellEnvResult = await shellEnv();
          if (shellEnvResult) {
            mergedEnv = { ...mergedEnv, ...shellEnvResult };
          }
        }
        mergedEnv = { ...mergedEnv, ...config.env };

        const transport = new StdioClientTransport({
          command: config?.command,
          args: config?.args,
          env: mergedEnv,
        });
        await client.connect(transport);
      }

      logEveryWhere({ message: `[KeeperAgent] MCP server "${name}" connected` });
      return { client };
    } catch (err: any) {
      logEveryWhere({
        message: `[KeeperAgent] Failed to connect MCP server "${name}": ${err?.message}`,
      });
      return { client: null, error: err?.message };
    }
  };

  private mapListToolsToMcpToolInfo = (
    mcpTools: Array<{
      name: string;
      description?: string;
      inputSchema?: object;
    }>,
  ): McpToolInfo[] =>
    (mcpTools || []).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema as Record<string, unknown> | undefined,
    }));

  private getMcpToolsFromClient = async (
    serverName: string,
    client: Client,
    disabledTools: string[] = [],
  ): Promise<DynamicStructuredTool[]> => {
    const tools: DynamicStructuredTool[] = [];

    try {
      const { tools: mcpTools } = await client.listTools();

      for (const mcpTool of mcpTools) {
        if (disabledTools.includes(mcpTool.name)) continue;
        tools.push(
          new DynamicStructuredTool({
            name: mcpTool.name || "",
            description: mcpTool.description || "",
            schema: mcpInputSchemaToZod(
              mcpTool.inputSchema as Record<string, unknown> | undefined,
            ),
            func: async (args: Record<string, unknown>) => {
              try {
                const result = await client.callTool({
                  name: mcpTool.name,
                  arguments: args,
                });

                if (result.isError) {
                  return `Error: ${JSON.stringify(result.content)}`;
                }

                if (Array.isArray(result.content)) {
                  return result.content
                    .map((c: { type: string; text?: string }) =>
                      c.type === "text" ? c.text : JSON.stringify(c),
                    )
                    .join("\n");
                }

                return JSON.stringify(result.content);
              } catch (err: any) {
                return `Error calling MCP tool "${mcpTool.name}": ${err?.message}`;
              }
            },
          } as any),
        );
      }
    } catch (err: any) {
      logEveryWhere({
        message: `[KeeperAgent] Failed to list tools from MCP server "${serverName}": ${err?.message}`,
      });
    }

    return tools;
  };

  /** Parse config + connect. Returns client or updates error status and returns null. */
  private connectServerOrFail = async (
    server: IMcpServer,
    serverId: number,
  ): Promise<{ client: Client | null; config: Record<string, any> | null }> => {
    const config = this.getServerConfig(server?.config || "");
    if (!config) {
      await this.updateServerStatus(
        server,
        serverId,
        MCPServerStatus.ERROR,
        "Invalid config JSON",
        0,
      );
      return { client: null, config: null };
    }

    const { client } = await this.tryConnectMcpServer(
      server.name,
      config as McpConfigOrHttp,
    );
    if (!client) {
      await this.updateServerStatus(
        server,
        serverId,
        MCPServerStatus.ERROR,
        "Connection failed",
        0,
      );
    }

    return { client, config };
  };

  listMcpServerTools = async (
    serverId: number,
    serverName: string,
    configStr: string,
    existingClient?: Client,
  ): Promise<McpToolInfo[]> => {
    const cacheKey = String(serverId);

    if (existingClient) {
      try {
        const { tools: mcpTools } = await existingClient.listTools();
        const tools = this.mapListToolsToMcpToolInfo(mcpTools || []);
        this.toolsCache.set(cacheKey, tools);
        return tools;
      } catch {
        return [];
      }
    }

    const cached = this.toolsCache.get(cacheKey);
    if (cached != null) {
      return cached;
    }

    const config = this.getServerConfig(configStr);
    if (!config) {
      return [];
    }

    const { client } = await this.tryConnectMcpServer(
      serverName,
      config as McpConfigOrHttp,
    );
    if (!client) {
      return [];
    }

    try {
      const { tools: mcpTools } = await client.listTools();
      const tools = this.mapListToolsToMcpToolInfo(mcpTools || []);
      this.toolsCache.set(cacheKey, tools);
      return tools;
    } catch {
      return [];
    }
  };

  clearMcpServerToolsCache = (serverId: number): void => {
    this.toolsCache.delete(String(serverId));
  };

  loadMcpSubAgents = async (): Promise<{
    subAgents: McpSubAgentInfo[];
    closeClients: () => Promise<void>;
  }> => {
    const [res, err] = await mcpServerDB.getListMcpServer(1, 99999);

    if (err || !res?.data) {
      return { subAgents: [], closeClients: async () => {} };
    }

    const validServers = res.data.filter((item) => item?.isEnabled);
    const clients: Client[] = [];
    const subAgents: McpSubAgentInfo[] = [];

    for (const server of validServers) {
      const serverId = server?.id!;
      const { client } = await this.connectServerOrFail(server, serverId);
      if (!client) continue;

      clients.push(client);
      const tools = await this.getMcpToolsFromClient(
        server.name,
        client,
        server.disabledTools || [],
      );

      await this.updateServerStatus(
        server,
        serverId,
        MCPServerStatus.CONNECTED,
        "",
        tools.length,
      );

      if (tools.length > 0) {
        subAgents.push({
          name: server.name,
          description:
            server.description || `Tools from MCP server: ${server.name}`,
          tools,
        });
      }
    }

    const closeClients = async () => {
      for (const client of clients) {
        try {
          await client.close();
        } catch (err: any) {
          logEveryWhere({
            message: `[KeeperAgent] Error closing MCP client: ${err?.message}`,
          });
        }
      }
    };

    logEveryWhere({
      message: `[KeeperAgent] Loaded ${subAgents.length} MCP subagents with ${subAgents.reduce((sum, s) => sum + s.tools.length, 0)} total tools`,
    });

    return { subAgents, closeClients };
  };

  checkMcpServerStatus = async (serverId: number): Promise<void> => {
    const cached = this.statusCache.get(String(serverId));
    if (cached != null) {
      return;
    }

    const [server] = await mcpServerDB.getOneMcpServer(serverId);
    if (!server) {
      return;
    }

    if (!server.isEnabled) {
      await this.updateServerStatus(
        server,
        serverId,
        MCPServerStatus.DISCONNECTED,
        "",
        0,
      );
      return;
    }

    const { client } = await this.connectServerOrFail(server, serverId);
    if (!client) {
      return;
    }

    const tools = await this.listMcpServerTools(
      serverId,
      server.name,
      server?.config || "",
      client,
    );
    try {
      await client.close();
    } catch {}

    await this.updateServerStatus(
      server,
      serverId,
      MCPServerStatus.CONNECTED,
      "",
      tools?.length || 0,
    );

    logEveryWhere({
      message: `[mcpServerStatus] Checked MCP server "${server.name}" (id=${serverId})`,
    });
  };

  private updateServerStatus = async (
    server: IMcpServer,
    id: number,
    status: MCPServerStatus,
    lastError: string,
    toolsCount: number,
  ): Promise<void> => {
    this.statusCache.set(String(id), { status, lastError, toolsCount });

    await mcpServerDB.updateMcpServer({
      ...server,
      id,
      status,
      lastError,
      toolsCount,
    } as IMcpServer);
  };
}

export const mcpToolLoader = new McpToolLoader();
