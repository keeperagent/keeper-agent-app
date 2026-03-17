/*
  AgentChatBridge — Connects chat platforms (Telegram, desktop UI, etc.) to the KeeperAgent.
  Each platform registers an IChatAdapter. Incoming user messages are routed to the agent, and the agent's response is streamed back through the same adapter.
  Manages one agent session per (platformId + chatId), with streaming, tool status updates, and background memory compaction.
*/

import { randomUUID } from "crypto";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import fs from "fs-extra";
import path from "path";
import {
  createKeeperAgent,
  createLLM,
  hasApiKey,
  type KeeperAgent,
  ToolContext,
  type IAttachedFileContext,
} from "@/electron/appAgent";
import { logEveryWhere } from "@/electron/service/util";
import {
  chatHistoryDB,
  AGENT_CONTEXT_LIMIT,
} from "@/electron/database/chatHistory";
import { getMemoryDir } from "@/electron/service/agentSkill";
import { LLMProvider } from "@/electron/type";
import { mainWindow } from "@/electron/main";
import { MESSAGE, getToolDisplayName } from "@/electron/constant";
import { ChatPlatform } from "./types";
import type { IChatAdapter, IPlatformMessage } from "./types";

const MEMORY_FILE = "AGENT.md";
const COMPACTION_THRESHOLD = 40_000;
const MIN_MESSAGES_FOR_EXIT_FLUSH = 20;

export type AgentSession = {
  checkpointer: MemorySaver;
  threadId: string;
  keeper: KeeperAgent | null;
  initPromise: Promise<void> | null;
  provider: LLMProvider;
  contextTokens: number;
  toolContext: ToolContext;
  platformId: ChatPlatform;
  platformChatId: string;
  isCompacting: boolean;
};

const runMemoryFlush = async (
  provider: LLMProvider,
  conversationText: string,
): Promise<void> => {
  try {
    const memoryDir = getMemoryDir();
    const memoryPath = path.join(memoryDir, MEMORY_FILE);

    let currentMemory =
      "# Agent Memory\n\n## User Preferences\n\n## Important Information\n\n## Learned Patterns\n";
    try {
      currentMemory = await fs.readFile(memoryPath, "utf-8");
    } catch {}

    const llm = await createLLM(provider, 0);
    const response = await llm.invoke([
      new SystemMessage(
        "You are updating a persistent memory file for an AI assistant. " +
          "Review the conversation and extract ONLY new, durable facts worth remembering across future sessions: " +
          "user preferences, wallet addresses or labels, recurring patterns, important decisions. " +
          "Do NOT add conversational filler or task-specific details that won't matter later. " +
          "Return the COMPLETE updated memory file content — keep all existing entries and add new ones under the correct section. " +
          "Sections: ## User Preferences, ## Important Information, ## Learned Patterns. " +
          "If nothing new is worth adding, return the file unchanged.",
      ),
      new HumanMessage(
        `Current memory file:\n${currentMemory}\n\n---\nConversation to extract from:\n${conversationText}`,
      ),
    ]);

    const updatedMemory =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    await fs.ensureDir(memoryDir);

    try {
      if (await fs.pathExists(memoryPath)) {
        const stamp = new Date()
          .toISOString()
          .replace(/[-:]/g, "")
          .replace("T", "-")
          .slice(0, 13);
        await fs.copy(memoryPath, path.join(memoryDir, `AGENT-${stamp}.md`));

        const allFiles = await fs.readdir(memoryDir);
        const backups = allFiles
          .filter((file) => /^AGENT-\d{8}-\d{4}\.md$/.test(file))
          .sort();
        const toDelete = backups.slice(0, Math.max(0, backups.length - 7));
        for (const file of toDelete) {
          await fs.remove(path.join(memoryDir, file));
        }
      }
    } catch {}

    await fs.writeFile(memoryPath, updatedMemory, "utf-8");
    logEveryWhere({ message: "[AgentChatBridge] Memory flush completed" });
  } catch (err: any) {
    logEveryWhere({
      message: `[AgentChatBridge] Memory flush error: ${err?.message}`,
    });
  }
};

const normalizeLlmErrorMessage = (raw: string): string => {
  try {
    const parsed = JSON.parse(raw) as {
      error?: { type?: string; message?: string };
    };
    const type = parsed?.error?.type;
    const message = parsed?.error?.message || parsed?.error?.type;
    if (type === "overloaded_error" || message === "Overloaded") {
      return "The AI service is temporarily overloaded. Please try again in a moment.";
    }
    if (
      type === "rate_limit_error" ||
      (message && String(message).toLowerCase().includes("rate limit"))
    ) {
      return "Rate limit exceeded. Please wait a moment and try again.";
    }
    if (message && typeof message === "string") return message;
  } catch {}
  return raw;
};

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

const buildHumanMessage = async (
  text: string,
  attachedFiles?: IAttachedFileContext[],
): Promise<HumanMessage> => {
  const imageFiles = (attachedFiles || []).filter(
    (file) =>
      file.type === "image" &&
      file.filePath &&
      IMAGE_MIME_BY_EXT[file.extension || ""],
  );

  if (imageFiles.length === 0) {
    return new HumanMessage(text);
  }

  const contentBlocks: Array<{ type: string; [key: string]: unknown }> = [
    { type: "text", text },
  ];

  for (const file of imageFiles) {
    try {
      const buffer = fs.readFileSync(file.filePath);
      const base64 = buffer.toString("base64");
      const mimeType = IMAGE_MIME_BY_EXT[file.extension || ""];
      contentBlocks.push({ type: "image", mimeType, data: base64 });
    } catch {}
  }

  return new HumanMessage({ content: contentBlocks as any });
};

class AgentChatBridge {
  private sessions = new Map<string, AgentSession>();
  private abortControllers = new Map<string, AbortController>();
  private activeRuns = new Set<string>();
  private adapters = new Map<string, IChatAdapter>();

  //  Pre-warmed session created at startup, claimed by the first IPC call.
  private prewarmedSessionId: string | null = null;

  private sessionKey = (platformId: ChatPlatform, chatId: string) =>
    `${platformId}:${chatId}`;

  registerAdapter = (adapter: IChatAdapter) => {
    this.adapters.set(adapter.platformId, adapter);
    adapter.onMessage((message) =>
      this.handleIncomingMessage(adapter, message),
    );
    logEveryWhere({
      message: `[AgentChatBridge] Registered adapter: ${adapter.platformId}`,
    });
  };

  private initAgentInBackground = (
    sessionKey: string,
    session: AgentSession,
  ) => {
    const notifyReady = (
      ready: boolean,
      keeper?: {
        subAgentsCount: number;
        toolsCount: number;
        skillsCount: number;
      },
      options?: { noApiKey?: boolean },
    ) => {
      if (!this.sessions.has(sessionKey)) {
        return;
      }

      // Only send IPC notifications for the desktop UI session
      if (session.platformId === ChatPlatform.KEEPER) {
        mainWindow?.webContents?.send(MESSAGE.DASHBOARD_AGENT_READY, {
          sessionId: sessionKey,
          ready,
          subAgentsCount: keeper?.subAgentsCount || 0,
          toolsCount: keeper?.toolsCount || 0,
          skillsCount: keeper?.skillsCount || 0,
          noApiKey: options?.noApiKey || false,
        });
      }
    };

    session.initPromise = (async () => {
      const keyExists = await hasApiKey(session.provider);
      if (!keyExists) {
        logEveryWhere({
          message:
            "[AgentChatBridge] No API key configured, skipping agent init",
        });
        notifyReady(false, undefined, { noApiKey: true });
        return;
      }

      const keeper = await createKeeperAgent({
        checkpointer: session.checkpointer,
        provider: session.provider,
        toolContext: session.toolContext,
      });

      if (
        this.sessions.has(sessionKey) &&
        this.sessions.get(sessionKey) === session
      ) {
        session.keeper = keeper;
        logEveryWhere({
          message: `[AgentChatBridge] Agent initialised for ${sessionKey}`,
        });
        notifyReady(true, keeper);
      } else {
        logEveryWhere({
          message:
            "[AgentChatBridge] Agent init completed but session was replaced",
        });
        keeper.cleanup().catch(() => {});
      }
    })()
      .catch((err: any) => {
        logEveryWhere({
          message: `[AgentChatBridge] Agent init failed: ${err?.message}`,
        });
        notifyReady(false);
      })
      .finally(() => {
        session.initPromise = null;
      });
  };

  private getOrCreateAgent = async (
    session: AgentSession,
  ): Promise<KeeperAgent> => {
    if (session.initPromise) {
      await session.initPromise;
      session.initPromise = null;
    }
    if (session.keeper) return session.keeper;

    const keeper = await createKeeperAgent({
      checkpointer: session.checkpointer,
      provider: session.provider,
      toolContext: session.toolContext,
    });
    session.keeper = keeper;
    return keeper;
  };

  private maybeRunSummarization = async (
    session: AgentSession,
  ): Promise<boolean> => {
    if (session.isCompacting) return false;
    try {
      if (session.contextTokens <= COMPACTION_THRESHOLD) return false;
      session.isCompacting = true;

      const [messages] = await chatHistoryDB.getMessagesForSummarization(
        session.platformId,
        session.platformChatId,
      );
      if (messages.length < 10) return false;

      const lastId = messages[messages.length - 1]?.id;
      if (!lastId) return false;

      const conversationText = messages
        .map(
          (msg) =>
            `${msg.role === "human" ? "User" : "Assistant"}: ${msg.content}`,
        )
        .join("\n\n");

      const llm = await createLLM(session.provider, 0);
      const response = await llm.invoke([
        new SystemMessage(
          "Summarize the following conversation in 300-400 words. " +
            "Capture key topics discussed, decisions made, user preferences, " +
            "and important context. Be factual and concise.",
        ),
        new HumanMessage(conversationText),
      ]);

      const summaryText =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

      await runMemoryFlush(session.provider, conversationText);
      await chatHistoryDB.saveSummary(
        summaryText,
        lastId,
        session.platformId,
        session.platformChatId,
      );
      logEveryWhere({
        message: "[AgentChatBridge] Background summarisation completed",
      });
      return true;
    } catch (err: any) {
      logEveryWhere({
        message: `[AgentChatBridge] Summarisation error: ${err?.message}`,
      });
      return false;
    } finally {
      session.isCompacting = false;
    }
  };

  private maybeFlushMemoryOnExit = async (
    session: AgentSession,
  ): Promise<void> => {
    if (session.contextTokens === 0) {
      return;
    }
    try {
      const [messages] = await chatHistoryDB.getMessagesForSummarization(
        session.platformId,
        session.platformChatId,
      );
      const [recentMessages] = await chatHistoryDB.getRecentMessages(
        AGENT_CONTEXT_LIMIT,
        session.platformId,
        session.platformChatId,
      );
      const allNew = [...messages, ...recentMessages];
      if (allNew.length < MIN_MESSAGES_FOR_EXIT_FLUSH) {
        return;
      }
      const conversationText = allNew
        .map(
          (msg) =>
            `${msg.role === "human" ? "User" : "Assistant"}: ${msg.content}`,
        )
        .join("\n\n");
      await runMemoryFlush(session.provider, conversationText);
    } catch {}
  };

  // recreate agent after summary
  private postRunCompaction = (sessionKey: string, session: AgentSession) => {
    this.maybeRunSummarization(session)
      .then((compacted) => {
        if (!compacted) {
          return;
        }
        const currentSession = this.sessions.get(sessionKey);
        if (!currentSession || currentSession !== session) {
          return;
        }
        if (currentSession.keeper)
          currentSession.keeper.cleanup().catch(() => {});
        currentSession.keeper = null;
        currentSession.initPromise = null;
        currentSession.threadId = randomUUID();
        currentSession.checkpointer = new MemorySaver();
        currentSession.contextTokens = 0;
        this.initAgentInBackground(sessionKey, currentSession);
        logEveryWhere({
          message: "[AgentChatBridge] Agent recreated after compaction",
        });
      })
      .catch(() => {});
  };

  // IPC Session Management (used by appAgent controller)
  prewarmSession = (provider: LLMProvider): string => {
    const sessionKey = this.sessionKey(ChatPlatform.KEEPER, "default");
    const session: AgentSession = {
      checkpointer: new MemorySaver(),
      threadId: randomUUID(),
      keeper: null,
      initPromise: null,
      provider,
      contextTokens: 0,
      toolContext: new ToolContext(),
      platformId: ChatPlatform.KEEPER,
      platformChatId: "default",
      isCompacting: false,
    };
    this.sessions.set(sessionKey, session);
    this.prewarmedSessionId = sessionKey;
    this.initAgentInBackground(sessionKey, session);
    logEveryWhere({
      message: `[AgentChatBridge] Pre-warming IPC session ${sessionKey}`,
    });
    return sessionKey;
  };

  createIpcSession = async (
    provider: LLMProvider,
  ): Promise<{
    sessionId: string;
    session: AgentSession;
  }> => {
    const requestedProvider = provider || LLMProvider.CLAUDE;

    if (
      this.prewarmedSessionId &&
      this.sessions.has(this.prewarmedSessionId) &&
      this.sessions.get(this.prewarmedSessionId)!.provider === requestedProvider
    ) {
      const sessionKey = this.prewarmedSessionId;
      this.prewarmedSessionId = null;
      const session = this.sessions.get(sessionKey)!;
      if (!session.keeper && session.initPromise) {
        await session.initPromise.catch(() => {});
        session.initPromise = null;
      }
      return { sessionId: sessionKey, session };
    }

    // Discard pre-warmed if provider differs
    if (this.prewarmedSessionId && this.sessions.has(this.prewarmedSessionId)) {
      const old = this.sessions.get(this.prewarmedSessionId)!;
      if (old.keeper) old.keeper.cleanup().catch(() => {});
      this.sessions.delete(this.prewarmedSessionId);
      this.prewarmedSessionId = null;
    }

    const sessionKey = this.sessionKey(ChatPlatform.KEEPER, randomUUID());
    const session: AgentSession = {
      checkpointer: new MemorySaver(),
      threadId: randomUUID(),
      keeper: null,
      initPromise: null,
      provider: requestedProvider,
      contextTokens: 0,
      toolContext: new ToolContext(),
      platformId: ChatPlatform.KEEPER,
      platformChatId: "default",
      isCompacting: false,
    };
    this.sessions.set(sessionKey, session);
    this.initAgentInBackground(sessionKey, session);
    return { sessionId: sessionKey, session };
  };

  getSession = (sessionId: string): AgentSession | undefined =>
    this.sessions.get(sessionId);

  /**
   * Run the agent with the given input. Returns the final output text
   * and tool steps. For IPC, streaming is handled via event.reply.
   * For external platforms, streaming is collected and delivered via the adapter.
   */
  runAgent = async (
    sessionId: string,
    input: string,
    options?: {
      /** For IPC: the Electron IPC event to stream chunks through. */
      ipcEvent?: Electron.IpcMainEvent;
      /** Callback for each streamed text chunk (for platform adapters). */
      onChunk?: (chunk: string) => void;
      /** Callback when a tool starts executing. */
      onToolStart?: (toolName: string, subagentType?: string) => void;
      /** Callback when a tool finishes executing. */
      onToolComplete?: (toolName: string) => void;
      /** Image files to include as multimodal content blocks. */
      attachedFiles?: IAttachedFileContext[];
    },
  ): Promise<{
    output: string;
    steps: Array<{
      toolName: string;
      args: unknown;
      result: string;
      success: boolean;
    }>;
    stopped?: boolean;
    isError?: boolean;
    errorMsg?: string;
  }> => {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found or has expired");
    }

    let finalOutput = "";
    const steps: Array<{
      toolName: string;
      args: unknown;
      result: string;
      success: boolean;
    }> = [];

    if (this.activeRuns.has(sessionId)) {
      throw new Error("Run already in progress for this session");
    }
    this.activeRuns.add(sessionId);

    const abortController = new AbortController();
    this.abortControllers.set(sessionId, abortController);

    try {
      const { agent } = await this.getOrCreateAgent(session);

      const humanMessage = await buildHumanMessage(
        input.trim(),
        options?.attachedFiles,
      );
      const eventStream = (agent as any).streamEvents(
        { messages: [humanMessage] },
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

        // Streaming text chunks
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
            options?.onChunk?.(text);
            options?.ipcEvent?.reply(MESSAGE.DASHBOARD_AGENT_STREAM_CHUNK, {
              sessionId,
              chunk: text,
            });
          }
        }

        // Tool start
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
          options?.onToolStart?.(toolName, subagentType);
          options?.ipcEvent?.reply(MESSAGE.DASHBOARD_AGENT_TOOL_START, {
            sessionId,
            toolName,
            subagentType,
          });
        }

        // Context token tracking
        if (
          evt.event === "on_chat_model_end" &&
          !String(evt.metadata?.langgraph_checkpoint_ns || "").includes("|")
        ) {
          const inputTokens =
            evt.data?.output?.usage_metadata?.input_tokens || 0;
          if (inputTokens > 0) {
            session.contextTokens = inputTokens;
          }
        }

        // Tool end
        if (evt.event === "on_tool_end") {
          const toolName = evt.name || "unknown";
          options?.onToolComplete?.(toolName);
          options?.ipcEvent?.reply(MESSAGE.DASHBOARD_AGENT_TOOL_COMPLETE, {
            sessionId,
            toolName,
          });

          steps.push({
            toolName,
            args: evt.data?.input || {},
            result:
              typeof evt.data?.output === "string"
                ? evt.data.output
                : JSON.stringify(evt.data?.output || ""),
            success: !String(evt.data?.output || "").startsWith("Error"),
          });
        }
      }

      if (abortController.signal.aborted) {
        return { output: finalOutput, steps, stopped: true };
      }

      // Background compaction
      this.postRunCompaction(sessionId, session);
      return { output: finalOutput, steps };
    } catch (err: any) {
      if (abortController.signal.aborted) {
        return { output: finalOutput, steps, stopped: true };
      }

      const rawMsg = err?.message || "Failed to run agent";
      const errorMsg = normalizeLlmErrorMessage(rawMsg);
      logEveryWhere({
        message: `[AgentChatBridge] Run error: ${rawMsg}`,
      });

      const errorOutput = finalOutput
        ? `${finalOutput}\n\nError: ${errorMsg}`
        : `Error: ${errorMsg}`;

      return { output: errorOutput, steps, isError: true, errorMsg };
    } finally {
      this.activeRuns.delete(sessionId);
      this.abortControllers.delete(sessionId);
    }
  };

  stopAgent = (sessionId: string) => {
    const controller = this.abortControllers.get(sessionId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(sessionId);
    }
  };

  resetSession = async (sessionId: string) => {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found or has expired");

    await this.maybeFlushMemoryOnExit(session);

    if (session.keeper) {
      await session.keeper.cleanup();
      session.keeper = null;
    }
    session.initPromise = null;
    session.threadId = randomUUID();
    session.checkpointer = new MemorySaver();
    session.contextTokens = 0;

    this.initAgentInBackground(sessionId, session);
  };

  changeProvider = async (sessionId: string, provider: LLMProvider) => {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found or has expired");

    if (session.keeper) {
      await session.keeper.cleanup();
      session.keeper = null;
    }
    session.initPromise = null;
    session.provider = provider;
    session.threadId = randomUUID();
    session.checkpointer = new MemorySaver();
    session.contextTokens = 0;

    this.initAgentInBackground(sessionId, session);
  };

  destroySession = async (sessionId: string) => {
    const session = this.sessions.get(sessionId);
    if (session?.keeper) {
      await session.keeper.cleanup();
    }
    this.sessions.delete(sessionId);
  };

  getStatus = async (sessionId: string) => {
    const session = this.sessions.get(sessionId);
    if (session && !session.keeper && !session.initPromise) {
      const keyExists = await hasApiKey(session.provider);
      if (keyExists) {
        logEveryWhere({
          message:
            "[AgentChatBridge] Agent not ready and no init in progress, retrying",
        });
        this.initAgentInBackground(sessionId, session);
      }
    }
    return session;
  };

  // Recreate all sessions (called when tools/skills/MCP change)
  recreateAllSessions = async () => {
    // Notify UI that agent is not ready
    for (const [sessionKey, session] of this.sessions) {
      if (session.platformId === ChatPlatform.KEEPER) {
        mainWindow?.webContents?.send(MESSAGE.DASHBOARD_AGENT_READY, {
          sessionId: sessionKey,
          ready: false,
        });
      }
    }

    for (const [sessionKey, session] of this.sessions) {
      await this.maybeFlushMemoryOnExit(session);
      if (session.initPromise) {
        await session.initPromise.catch(() => {});
        session.initPromise = null;
      }
      if (session.keeper) {
        await session.keeper.cleanup().catch(() => {});
        session.keeper = null;
      }
      session.threadId = randomUUID();
      session.checkpointer = new MemorySaver();
      session.contextTokens = 0;
      this.initAgentInBackground(sessionKey, session);
    }
    logEveryWhere({
      message: "[AgentChatBridge] Recreated agents for all active sessions",
    });
  };

  // Cleanup all (app quit)
  cleanupAll = async () => {
    for (const [id, session] of this.sessions) {
      await this.maybeFlushMemoryOnExit(session);
      if (session.keeper) {
        try {
          await session.keeper.cleanup();
        } catch (err: any) {
          logEveryWhere({
            message: `[AgentChatBridge] Cleanup error for ${id}: ${err?.message}`,
          });
        }
      }
    }
    this.sessions.clear();
  };

  // Incoming Message from External Platform
  private handleIncomingMessage = async (
    adapter: IChatAdapter,
    message: IPlatformMessage,
  ) => {
    const sessionKey = this.sessionKey(adapter.platformId, message.chatId);

    // Create session on first message if it doesn't exist
    if (!this.sessions.has(sessionKey)) {
      const session: AgentSession = {
        checkpointer: new MemorySaver(),
        threadId: randomUUID(),
        keeper: null,
        initPromise: null,
        provider: LLMProvider.CLAUDE,
        contextTokens: 0,
        toolContext: new ToolContext(),
        platformId: adapter.platformId,
        platformChatId: message.chatId,
        isCompacting: false,
      };
      this.sessions.set(sessionKey, session);
      this.initAgentInBackground(sessionKey, session);
    }

    const session = this.sessions.get(sessionKey)!;

    // Save user message to chat history
    await chatHistoryDB.saveMessage({
      role: "human",
      content: message.text,
      timestamp: Date.now(),
      platformId: adapter.platformId,
      platformChatId: message.chatId,
    });

    // Send typing indicator while agent initialises / runs
    await adapter.sendTypingIndicator(message.chatId).catch(() => {});

    // Wait for agent to be ready
    if (session.initPromise) {
      await session.initPromise.catch(() => {});
    }
    if (!session.keeper) {
      await adapter
        .sendText(
          message.chatId,
          "Agent is not ready. Please check that an API key is configured in the app.",
        )
        .catch(() => {});
      return;
    }

    const maxLen = adapter.maxMessageLength - 50; // leave buffer

    // Send a visible placeholder so the user knows the agent is working
    let statusMessageId: string | number | null = null;
    statusMessageId = await adapter
      .sendPlaceholder(message.chatId, "Thinking...")
      .catch(() => null);

    // Keep typing indicator alive while agent is working
    const typingInterval = setInterval(() => {
      adapter.sendTypingIndicator(message.chatId).catch(() => {});
    }, 3000);

    try {
      const contextHeader =
        "CURRENT CONTEXT (for agent use only — do not surface these values in user-facing replies):";
      const inputWithContext = `${message.text}\n\n${contextHeader}\n${JSON.stringify({ platformId: adapter.platformId })}`;
      const result = await this.runAgent(sessionKey, inputWithContext, {
        onToolStart: async (toolName, subagentType) => {
          logEveryWhere({
            message: `[AgentChatBridge] [${adapter.platformId}] Tool start: ${toolName}`,
          });
          // Update status message — same display as the desktop app
          if (statusMessageId) {
            const displayName =
              toolName === "task" && subagentType
                ? getToolDisplayName(subagentType)
                : getToolDisplayName(toolName);
            adapter
              .editMessage(
                message.chatId,
                statusMessageId,
                `Executing ${displayName}...`,
              )
              .catch(() => {});
          }
        },
      });

      clearInterval(typingInterval);

      // Replace status message with the final response
      // Agent already outputs in the correct format for this platform
      const finalText = result.output || "(No response)";
      const chunks = this.splitMessage(finalText, maxLen);

      // Edit the "Thinking..." placeholder with the first chunk
      if (statusMessageId) {
        const edited = await adapter
          .editMessage(message.chatId, statusMessageId, chunks[0])
          .catch(() => false);
        if (!edited) {
          // Edit failed — send as new message instead
          await adapter.sendMarkdown(message.chatId, chunks[0]).catch(() => {});
        }
        // Send remaining chunks as new messages
        for (let index = 1; index < chunks.length; index++) {
          await adapter
            .sendMarkdown(message.chatId, chunks[index])
            .catch(() => {});
        }
      } else {
        for (const chunk of chunks) {
          await adapter.sendMarkdown(message.chatId, chunk).catch(() => {});
        }
      }

      // Save assistant response to chat history
      await chatHistoryDB.saveMessage({
        role: "ai",
        content: finalText,
        timestamp: Date.now(),
        platformId: adapter.platformId,
        platformChatId: message.chatId,
      });
    } catch (err: any) {
      clearInterval(typingInterval);
      // Clean up status message on error
      if (statusMessageId) {
        adapter
          .editMessage(
            message.chatId,
            statusMessageId,
            `Error: ${err?.message || "Something went wrong"}`,
          )
          .catch(() => {});
      } else {
        await adapter
          .sendText(
            message.chatId,
            `Error: ${err?.message || "Something went wrong"}`,
          )
          .catch(() => {});
      }
      logEveryWhere({
        message: `[AgentChatBridge] Message handling error: ${err?.message}`,
      });
    }
  };

  private splitMessage = (text: string, maxLength: number): string[] => {
    if (text.length <= maxLength) {
      return [text];
    }
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }
      // Try to split at a newline boundary
      let splitIndex = remaining.lastIndexOf("\n", maxLength);
      if (splitIndex <= 0) {
        splitIndex = maxLength;
      }
      chunks.push(remaining.slice(0, splitIndex));
      remaining = remaining.slice(splitIndex);
    }
    return chunks;
  };
}

export const agentChatBridge = new AgentChatBridge();
