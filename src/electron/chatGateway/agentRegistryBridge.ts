/*
  AgentRegistryBridge — Chat bridge for named registry agents.
  Each registry agent gets its own isolated session (checkpointer + memory file).
  Sessions are keyed by "registry:<agentRegistryId>" so one session per agent is maintained.
*/

import { randomUUID } from "crypto";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { redact } from "@keeperagent/crypto-key-guard";
import { createRegistryKeeperAgent } from "@/electron/appAgent";
import type { KeeperAgent } from "@/electron/appAgent";
import { ToolContext } from "@/electron/appAgent/toolContext";
import { agentRegistryDB } from "@/electron/database/agentRegistry";
import { logEveryWhere } from "@/electron/service/util";
import { mainWindow } from "@/electron/main";
import { MESSAGE } from "@/electron/constant";
import type { IAgentRegistry } from "@/electron/type";
import { LLMProvider } from "@/electron/type";
import { extractMemoryFromConversation } from "./memoryExtraction";
import { ChatRole } from "./types";

type RegistrySession = {
  agentRegistryId: number;
  registry: IAgentRegistry;
  checkpointer: MemorySaver;
  threadId: string;
  keeper: KeeperAgent | null;
  initPromise: Promise<void> | null;
  toolContext: ToolContext;
  // Conversation buffer for memory extraction — accumulates messages since last extraction
  conversationHistory: Array<{ role: ChatRole; content: string }>;
};

class AgentRegistryBridge {
  private sessions = new Map<string, RegistrySession>();
  private abortControllers = new Map<string, AbortController>();
  private activeRuns = new Set<string>();

  private sessionKey = (agentRegistryId: number): string =>
    `registry:${agentRegistryId}`;

  createSession = async (agentRegistryId: number): Promise<string> => {
    const sessionKey = this.sessionKey(agentRegistryId);

    if (this.sessions.has(sessionKey)) {
      return sessionKey;
    }

    const [registry] =
      await agentRegistryDB.getOneAgentRegistry(agentRegistryId);
    if (!registry) {
      throw new Error(`AgentRegistry #${agentRegistryId} not found`);
    }

    const session: RegistrySession = {
      agentRegistryId,
      registry,
      checkpointer: new MemorySaver(),
      threadId: randomUUID(),
      keeper: null,
      initPromise: null,
      toolContext: new ToolContext(),
      conversationHistory: [],
    };
    this.sessions.set(sessionKey, session);
    this.initAgentInBackground(sessionKey, session);

    return sessionKey;
  };

  private initAgentInBackground = (
    sessionKey: string,
    session: RegistrySession,
  ) => {
    session.initPromise = (async () => {
      const keeper = await createRegistryKeeperAgent({
        registry: session.registry,
        checkpointer: session.checkpointer,
        toolContext: session.toolContext,
      });

      if (
        this.sessions.has(sessionKey) &&
        this.sessions.get(sessionKey) === session
      ) {
        session.keeper = keeper;
        mainWindow?.webContents?.send(MESSAGE.REGISTRY_AGENT_READY, {
          sessionId: sessionKey,
          agentRegistryId: session.agentRegistryId,
          ready: true,
        });
        logEveryWhere({
          message: `[AgentRegistryBridge] Agent initialized for ${sessionKey}`,
        });
      } else {
        keeper.cleanup().catch(() => {});
      }
    })()
      .catch((err: any) => {
        logEveryWhere({
          message: `[AgentRegistryBridge] Init failed for ${sessionKey}: ${err?.message}`,
        });
        mainWindow?.webContents?.send(MESSAGE.REGISTRY_AGENT_READY, {
          sessionId: sessionKey,
          agentRegistryId: session.agentRegistryId,
          ready: false,
        });
      })
      .finally(() => {
        session.initPromise = null;
      });
  };

  private getOrCreateKeeper = async (
    session: RegistrySession,
  ): Promise<KeeperAgent> => {
    if (session.initPromise) {
      await session.initPromise;
      session.initPromise = null;
    }
    if (session.keeper) {
      return session.keeper;
    }

    const keeper = await createRegistryKeeperAgent({
      registry: session.registry,
      checkpointer: session.checkpointer,
      toolContext: session.toolContext,
    });
    session.keeper = keeper;
    return keeper;
  };

  runAgent = async (
    sessionId: string,
    input: string,
    encryptKey: string | undefined,
    ipcEvent: Electron.IpcMainEvent,
  ): Promise<{
    output: string;
    isError?: boolean;
    errorMsg?: string;
    stopped?: boolean;
  }> => {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { output: "", isError: true, errorMsg: "Session not found" };
    }

    if (this.activeRuns.has(sessionId)) {
      return { output: "", isError: true, errorMsg: "Run already in progress" };
    }
    this.activeRuns.add(sessionId);

    const abortController = new AbortController();
    this.abortControllers.set(sessionId, abortController);

    if (encryptKey) {
      session.toolContext.update({ encryptKey });
    }

    let finalOutput = "";

    try {
      const { agent } = await this.getOrCreateKeeper(session);

      const { text: redactedInput, secrets: newSecrets } = redact(input.trim());
      if (newSecrets.size > 0) {
        session.toolContext.mergeSecrets(newSecrets);
      }

      const eventStream = (agent as any).streamEvents(
        { messages: [new HumanMessage(redactedInput)] },
        {
          configurable: { thread_id: session.threadId },
          version: "v2",
          recursionLimit: 20,
          signal: abortController.signal,
        },
      );

      for await (const evt of eventStream) {
        if (abortController.signal.aborted) {
          break;
        }

        if (
          evt.event === "on_chat_model_stream" &&
          evt.data?.chunk?.content &&
          !String(evt.metadata?.langgraph_checkpoint_ns || "").includes("|")
        ) {
          const content = evt.data.chunk.content;
          let text = "";
          if (typeof content === "string") {
            text = content;
          } else if (Array.isArray(content)) {
            text = content
              .filter(
                (chunk: any) =>
                  chunk?.type === "text" || typeof chunk === "string",
              )
              .map((chunk: any) =>
                typeof chunk === "string" ? chunk : chunk.text || "",
              )
              .join("");
          }
          if (text) {
            finalOutput += text;
            ipcEvent.reply(MESSAGE.REGISTRY_AGENT_STREAM_CHUNK, {
              sessionId,
              chunk: text,
            });
          }
        }

        if (evt.event === "on_tool_start") {
          const toolName = evt.name || "unknown";
          let subagentType: string | undefined;
          if (toolName === "task") {
            const raw = evt.data?.input?.input || evt.data?.input;
            const parsed =
              typeof raw === "string"
                ? (() => {
                    try {
                      return JSON.parse(raw);
                    } catch {
                      return {};
                    }
                  })()
                : raw;
            subagentType = parsed?.subagent_type as string | undefined;
          }
          ipcEvent.reply(MESSAGE.REGISTRY_AGENT_TOOL_START, {
            sessionId,
            toolName,
            subagentType,
          });
        }

        if (evt.event === "on_tool_end") {
          const toolName = evt.name || "unknown";
          ipcEvent.reply(MESSAGE.REGISTRY_AGENT_TOOL_COMPLETE, {
            sessionId,
            toolName,
          });
        }
      }

      if (abortController.signal.aborted) {
        return { output: finalOutput, stopped: true };
      }

      // Buffer this exchange for memory extraction on reset/quit
      if (finalOutput) {
        session.conversationHistory.push(
          { role: ChatRole.HUMAN, content: redactedInput },
          { role: ChatRole.AI, content: finalOutput },
        );
      }

      return { output: finalOutput };
    } catch (err: any) {
      if (abortController.signal.aborted) {
        return { output: finalOutput, stopped: true };
      }
      const errorMsg = err?.message || "Failed to run agent";
      logEveryWhere({
        message: `[AgentRegistryBridge] Run error for ${sessionId}: ${errorMsg}`,
      });
      return {
        output: finalOutput || `Error: ${errorMsg}`,
        isError: true,
        errorMsg,
      };
    } finally {
      this.activeRuns.delete(sessionId);
      this.abortControllers.delete(sessionId);
    }
  };

  private runMemoryExtractionForSession = async (
    session: RegistrySession,
  ): Promise<void> => {
    if (session.conversationHistory.length === 0) {
      return;
    }
    const provider =
      (session.registry.llmProvider as LLMProvider) || LLMProvider.CLAUDE;
    const memoryFile = `AGENT_REGISTRY_${session.agentRegistryId}.md`;
    await extractMemoryFromConversation(
      provider,
      session.conversationHistory,
      memoryFile,
    );
    session.conversationHistory = [];
  };

  stopAgent = (sessionId: string): void => {
    const controller = this.abortControllers.get(sessionId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(sessionId);
    }
  };

  resetSession = async (sessionId: string): Promise<void> => {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    this.runMemoryExtractionForSession(session).catch(() => {});
    if (session.keeper) {
      await session.keeper.cleanup();
      session.keeper = null;
    }
    session.initPromise = null;
    session.threadId = randomUUID();
    session.checkpointer = new MemorySaver();
    this.initAgentInBackground(sessionId, session);
  };

  // Called when a registry config changes — recreate the session so new config applies
  invalidateSession = async (agentRegistryId: number): Promise<void> => {
    const sessionKey = this.sessionKey(agentRegistryId);
    const session = this.sessions.get(sessionKey);
    if (!session) {
      return;
    }
    if (session.keeper) {
      await session.keeper.cleanup().catch(() => {});
      session.keeper = null;
    }
    session.initPromise = null;

    const [registry] =
      await agentRegistryDB.getOneAgentRegistry(agentRegistryId);
    if (!registry) {
      this.sessions.delete(sessionKey);
      return;
    }
    session.registry = registry;
    session.threadId = randomUUID();
    session.checkpointer = new MemorySaver();
    this.initAgentInBackground(sessionKey, session);
  };

  cleanupAll = async (): Promise<void> => {
    for (const session of this.sessions.values()) {
      await this.runMemoryExtractionForSession(session).catch(() => {});
      if (session.keeper) {
        await session.keeper.cleanup().catch(() => {});
      }
    }
    this.sessions.clear();
  };
}

export const agentRegistryChatBridge = new AgentRegistryBridge();
