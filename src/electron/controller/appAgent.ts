import { randomUUID } from "crypto";
import { onIpc } from "./helpers";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import fs from "fs-extra";
import path from "path";
import { MESSAGE } from "@/electron/constant";
import { mainWindow } from "@/electron/main";
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
import type {
  IpcAgentCreateSessionPayload,
  IpcAgentRunPayload,
  IpcAgentStopPayload,
  IpcAgentResetSessionPayload,
  IpcAgentChangeProviderPayload,
  IpcAgentGetStatusPayload,
  IpcAgentDestroySessionPayload,
} from "@/electron/ipcTypes";

const MEMORY_FILE = "AGENT.md";

// Compact conversation history when input tokens exceed this threshold.
// Lower = more frequent compaction = less token waste per turn.
const COMPACTION_THRESHOLD = 40_000;

/**
 * Pre-compaction memory flush (inspired by OpenClaw).
 * Extracts durable facts (user preferences, wallet info, learned patterns)
 * from the conversation and persists them to AGENT.md before the summary
 * overwrites older message history. Never throws — errors are logged.
 */
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
    } catch {
      // File doesn't exist yet — use the default template above
    }

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

    // Backup current AGENT.md with a datestamp before overwriting,
    // so a bad LLM extraction never permanently destroys previous memory.
    // Keep only the last 7 backups to avoid unbounded file accumulation.
    try {
      if (await fs.pathExists(memoryPath)) {
        const stamp = new Date()
          .toISOString()
          .replace(/[-:]/g, "")
          .replace("T", "-")
          .slice(0, 13); // e.g. 20260218-1430
        await fs.copy(memoryPath, path.join(memoryDir, `AGENT-${stamp}.md`));

        // Prune oldest backups — keep only the 7 most recent
        const allFiles = await fs.readdir(memoryDir);
        const backups = allFiles
          .filter((f) => /^AGENT-\d{8}-\d{4}\.md$/.test(f))
          .sort(); // lexicographic sort = chronological order (YYYYMMDD-HHmm)
        const toDelete = backups.slice(0, Math.max(0, backups.length - 7));
        for (const file of toDelete) {
          await fs.remove(path.join(memoryDir, file));
        }
      }
    } catch {
      // Backup failure is non-fatal — still proceed with the flush
    }

    await fs.writeFile(memoryPath, updatedMemory, "utf-8");
    logEveryWhere({ message: "[AgentController] Memory flush completed" });
  } catch (err: any) {
    logEveryWhere({ message: `[AgentController] Memory flush error: ${err?.message}` });
  }
};

/**
 * Checks whether a summarisation pass is needed and, if so, runs it in the
 * background using a lightweight LLM call.
 * Returns true if compaction actually happened, false otherwise.
 * Never throws — errors are logged.
 */
const maybeRunSummarization = async (
  provider: LLMProvider,
  contextTokens: number,
): Promise<boolean> => {
  if (isCompacting) return false; // Already running — skip
  try {
    const needsSummary = contextTokens > COMPACTION_THRESHOLD;
    if (!needsSummary) return false;

    isCompacting = true;

    const [messages] = await chatHistoryDB.getMessagesForSummarization();
    if (messages.length < 10) return false; // Too few messages to be worth summarising

    const lastId = messages[messages.length - 1]?.id;
    if (!lastId) return false;

    const conversationText = messages
      .map((m) => `${m.role === "human" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const llm = await createLLM(provider, 0);
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

    // Memory flush: extract durable facts into AGENT.md before compacting.
    // This ensures user preferences and important info survive the summary.
    await runMemoryFlush(provider, conversationText);

    await chatHistoryDB.saveSummary(summaryText, lastId);
    logEveryWhere({ message: "[AgentController] Background summarisation completed" });
    return true;
  } catch (err: any) {
    logEveryWhere({ message: `[AgentController] Summarisation error: ${err?.message}` });
    return false;
  } finally {
    isCompacting = false;
  }
};

type AgentSession = {
  checkpointer: MemorySaver;
  threadId: string;
  keeper: KeeperAgent | null;
  /** Resolves when the agent is fully initialised (MCP connected, etc.). */
  initPromise: Promise<void> | null;
  provider: LLMProvider;
  /** Input token count from the last top-level model response. Used to detect context overflow. */
  contextTokens: number;
  /** Shared context injected into all tools before each run. Survives keeper recreation. */
  toolContext: ToolContext;
};

const agentSessions = new Map<string, AgentSession>();

/** Tracks in-flight AbortControllers so we can cancel a running agent. */
const runningAbortControllers = new Map<string, AbortController>();

/** Prevents concurrent compaction runs — only one at a time globally. */
let isCompacting = false;

/** Pre-warmed session created at app startup, claimed by the first CREATE_SESSION call. */
let prewarmedSessionId: string | null = null;

const createResponse = (
  event: Electron.IpcMainEvent,
  channel: string,
  data: any,
) => event.reply(channel, data);

const CONTEXT_HEADER = "CURRENT CONTEXT (use these values";

/**
 * Parses the context JSON block appended by AgentView to every user message
 * and returns the fields relevant for tool injection.
 */
const parseToolContextFromInput = (
  input: string,
): {
  nodeEndpointGroupId?: number;
  encryptKey?: string;
  listCampaignProfileId?: number[];
  isAllWallet?: boolean;
  tokenAddress?: string;
  campaignId?: number;
  chainKey?: string;
  attachedFiles?: IAttachedFileContext[];
} => {
  try {
    const idx = input.indexOf(CONTEXT_HEADER);
    if (idx === -1) return {};
    const rest = input.slice(idx);
    const jsonStart = rest.indexOf("{");
    const jsonEnd = rest.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return {};
    const ctx = JSON.parse(rest.slice(jsonStart, jsonEnd + 1));
    const attachedFiles: IAttachedFileContext[] | undefined = Array.isArray(
      ctx.attachedFiles,
    )
      ? ctx.attachedFiles.filter(
          (f: unknown): f is IAttachedFileContext =>
            f != null &&
            typeof f === "object" &&
            typeof (f as IAttachedFileContext).filePath === "string",
        )
      : undefined;
    return {
      nodeEndpointGroupId:
        typeof ctx.nodeEndpointGroupId === "number"
          ? ctx.nodeEndpointGroupId
          : undefined,
      encryptKey:
        typeof ctx.encryptKey === "string" ? ctx.encryptKey : undefined,
      listCampaignProfileId: Array.isArray(ctx.listCampaignProfileId)
        ? ctx.listCampaignProfileId.filter(
            (id: unknown) => typeof id === "number",
          )
        : undefined,
      isAllWallet:
        typeof ctx.isAllWallet === "boolean" ? ctx.isAllWallet : undefined,
      tokenAddress:
        typeof ctx.tokenAddress === "string" && ctx.tokenAddress
          ? ctx.tokenAddress
          : undefined,
      campaignId:
        typeof ctx.campaignId === "number" ? ctx.campaignId : undefined,
      chainKey:
        typeof ctx.chainKey === "string" && ctx.chainKey
          ? ctx.chainKey
          : undefined,
      attachedFiles,
    };
  } catch {
    return {};
  }
};

/** Turn LLM API error payloads (e.g. overloaded_error) into a short user-facing message. */
function normalizeLlmErrorMessage(raw: string): string {
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
  } catch {
    // not JSON, use as-is
  }
  return raw;
}

/** Eagerly initialise the agent for a session (non-blocking). Notifies renderer when ready via DASHBOARD_AGENT_READY. */
const initAgentInBackground = (sessionId: string, session: AgentSession) => {
  const notifyReady = (
    ready: boolean,
    keeper?: {
      subAgentsCount: number;
      toolsCount: number;
      skillsCount: number;
    },
    options?: { noApiKey?: boolean },
  ) => {
    // Only notify if this session is still in the active map (not discarded)
    if (!agentSessions.has(sessionId)) {
      return;
    }
    mainWindow?.webContents?.send(MESSAGE.DASHBOARD_AGENT_READY, {
      sessionId,
      ready,
      subAgentsCount: keeper?.subAgentsCount || 0,
      toolsCount: keeper?.toolsCount || 0,
      skillsCount: keeper?.skillsCount || 0,
      noApiKey: options?.noApiKey || false,
    });
  };

  session.initPromise = (async () => {
    const keyExists = await hasApiKey(session.provider);
    if (!keyExists) {
      logEveryWhere({
        message: "[AgentController] No API key configured, skipping agent init",
      });
      notifyReady(false, undefined, { noApiKey: true });
      return;
    }

    const keeper = await createKeeperAgent({
      checkpointer: session.checkpointer,
      provider: session.provider,
      toolContext: session.toolContext,
    });

    // Only set keeper if session is still active (not replaced by recreate)
    if (
      agentSessions.has(sessionId) &&
      agentSessions.get(sessionId) === session
    ) {
      session.keeper = keeper;
      logEveryWhere({ message: "[AgentController] Agent pre-initialised" });
      notifyReady(true, keeper);
    } else {
      logEveryWhere({
        message: "[AgentController] Agent init completed but session was replaced, cleaning up",
      });
      keeper.cleanup().catch(() => {});
    }
  })()
    .catch((err: any) => {
      logEveryWhere({ message: `[AgentController] Agent pre-init failed: ${err?.message}` });
      notifyReady(false);
    })
    .finally(() => {
      // Clear initPromise so GET_STATUS can detect a failed init and retry
      session.initPromise = null;
    });
};

/** Get the session's agent, waiting for background init if in progress. */
const getOrCreateAgent = async (
  session: AgentSession,
): Promise<KeeperAgent> => {
  // Wait for background init if it's still running
  if (session.initPromise) {
    await session.initPromise;
    session.initPromise = null;
  }
  if (session.keeper) return session.keeper;

  // Fallback: create now (shouldn't normally happen)
  const keeper = await createKeeperAgent({
    checkpointer: session.checkpointer,
    provider: session.provider,
    toolContext: session.toolContext,
  });
  session.keeper = keeper;
  return keeper;
};

/** Debounced agent recreation — waits for toggles to settle before recreating. */
let recreateTimer: ReturnType<typeof setTimeout> | null = null;
const RECREATE_DEBOUNCE_MS = 800;

const doRecreateAllAgents = async () => {
  for (const [sessionId, session] of agentSessions) {
    // Flush memory before recreating so facts from this session survive
    await maybeFlushMemoryOnExit(session);
    // Wait for any in-flight init to finish before cleaning up
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
    initAgentInBackground(sessionId, session);
  }
  logEveryWhere({ message: "[AgentController] Recreated agents for all active sessions" });
};

export const recreateAllAgents = () => {
  if (recreateTimer) clearTimeout(recreateTimer);
  // Notify frontend that agent is not ready while we wait
  for (const [sessionId] of agentSessions) {
    mainWindow?.webContents?.send(MESSAGE.DASHBOARD_AGENT_READY, {
      sessionId,
      ready: false,
    });
  }
  recreateTimer = setTimeout(() => {
    recreateTimer = null;
    doRecreateAllAgents();
  }, RECREATE_DEBOUNCE_MS);
};

/**
 * Flush memory for a session if it has had any activity (contextTokens > 0).
 * Called on session reset and app quit so facts from short sessions aren't lost.
 */
// Only flush on exit if there are more messages than the startup verbatim limit.
// Below this, all messages are already loaded into the system prompt on next startup anyway.
const MIN_MESSAGES_FOR_EXIT_FLUSH = 20;

const maybeFlushMemoryOnExit = async (session: AgentSession): Promise<void> => {
  if (session.contextTokens === 0) return; // No activity this session — nothing to flush
  try {
    // Use only messages since the last summary cutoff — same slice as compaction.
    // This avoids re-processing already-summarized messages and wasting tokens.
    const [messages] = await chatHistoryDB.getMessagesForSummarization();
    const [recentMessages] =
      await chatHistoryDB.getRecentMessages(AGENT_CONTEXT_LIMIT);
    const allNew = [...messages, ...recentMessages];
    if (allNew.length < MIN_MESSAGES_FOR_EXIT_FLUSH) return;
    const conversationText = allNew
      .map((m) => `${m.role === "human" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");
    await runMemoryFlush(session.provider, conversationText);
  } catch {
    // Non-fatal
  }
};

/** Cleanup all agent sessions (call on app quit). */
export const cleanupAllAgentSessions = async () => {
  for (const [id, session] of agentSessions) {
    // Flush memory before quitting so facts from this session survive restart
    await maybeFlushMemoryOnExit(session);
    if (session.keeper) {
      try {
        await session.keeper.cleanup();
      } catch (err: any) {
        logEveryWhere({
          message: `[AgentController] Cleanup error for ${id}: ${err?.message}`,
        });
      }
    }
  }
  agentSessions.clear();
};

export const agentController = () => {
  // Pre-warm: create a session and start agent init immediately on app startup
  {
    const sessionId = randomUUID();
    const session: AgentSession = {
      checkpointer: new MemorySaver(),
      threadId: randomUUID(),
      keeper: null,
      initPromise: null,
      provider: LLMProvider.CLAUDE,
      contextTokens: 0,
      toolContext: new ToolContext(),
    };
    agentSessions.set(sessionId, session);
    prewarmedSessionId = sessionId;
    initAgentInBackground(sessionId, session);
    logEveryWhere({ message: `[AgentController] Pre-warming agent session ${sessionId}` });
  }

  // CREATE SESSION — returns pre-warmed session if available
  onIpc<IpcAgentCreateSessionPayload>(
    MESSAGE.DASHBOARD_AGENT_CREATE_SESSION,
    MESSAGE.DASHBOARD_AGENT_CREATE_SESSION_RES,
    async (event, payload) => {
      const requestedProvider: LLMProvider =
        payload?.provider || LLMProvider.CLAUDE;
      let sessionId: string;

      let session: AgentSession;
      if (
        prewarmedSessionId &&
        agentSessions.has(prewarmedSessionId) &&
        agentSessions.get(prewarmedSessionId)!.provider === requestedProvider
      ) {
        sessionId = prewarmedSessionId;
        prewarmedSessionId = null;
        session = agentSessions.get(sessionId)!;
        // Wait for prewarmed init so we can respond with agentReady: true and avoid "Preparing agent" flash
        if (!session.keeper && session.initPromise) {
          await session.initPromise.catch(() => {});
          session.initPromise = null;
        }
      } else {
        // If pre-warmed exists but provider differs, discard it
        if (prewarmedSessionId && agentSessions.has(prewarmedSessionId)) {
          const old = agentSessions.get(prewarmedSessionId)!;
          if (old.keeper) old.keeper.cleanup().catch(() => {});
          agentSessions.delete(prewarmedSessionId);
          prewarmedSessionId = null;
        }
        sessionId = randomUUID();
        session = {
          checkpointer: new MemorySaver(),
          threadId: randomUUID(),
          keeper: null,
          initPromise: null,
          provider: requestedProvider,
          contextTokens: 0,
          toolContext: new ToolContext(),
        };
        agentSessions.set(sessionId, session);
        initAgentInBackground(sessionId, session);
      }

      const keyExists = await hasApiKey(session.provider);
      createResponse(event, MESSAGE.DASHBOARD_AGENT_CREATE_SESSION_RES, {
        data: {
          sessionId,
          agentReady: !!session.keeper,
          noApiKey: !keyExists,
          ...(session.keeper && {
            subAgentsCount: session.keeper.subAgentsCount,
            toolsCount: session.keeper.toolsCount,
            skillsCount: session.keeper.skillsCount,
          }),
        },
      });
    },
  );

  // RUN
  onIpc<IpcAgentRunPayload>(
    MESSAGE.DASHBOARD_AGENT_RUN,
    MESSAGE.DASHBOARD_AGENT_RUN_RES,
    async (event, payload) => {
      const { sessionId, input } = payload || {};
      let finalOutput = "";
      const steps: Array<{
        toolName: string;
        args: unknown;
        result: string;
        success: boolean;
      }> = [];

      const abortController = new AbortController();
      if (sessionId) {
        runningAbortControllers.set(sessionId, abortController);
      }

      try {
        if (!sessionId) throw new Error("sessionId is required");
        if (typeof input !== "string" || input.trim().length === 0)
          throw new Error("input must not be empty");

        const session = agentSessions.get(sessionId);
        if (!session) throw new Error("Session not found or has expired");

        const { agent } = await getOrCreateAgent(session);

        // Parse context from user message and inject into tools before running.
        // This ensures nodeEndpointGroupId and encryptKey are always available
        // regardless of whether the model forwards them from context.
        const parsedCtx = parseToolContextFromInput(input);
        session.toolContext.update(parsedCtx);

        const eventStream = (agent as any).streamEvents(
          { messages: [new HumanMessage(input.trim())] },
          {
            configurable: { thread_id: session.threadId },
            version: "v2",
            recursionLimit: 20,
            signal: abortController.signal,
          },
        );

        for await (const evt of eventStream) {
          if (abortController.signal.aborted) break;

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
                .filter((c: any) => c?.type === "text" || typeof c === "string")
                .map((c: any) => (typeof c === "string" ? c : c.text || ""))
                .join("");
            }
            if (text) {
              event.reply(MESSAGE.DASHBOARD_AGENT_STREAM_CHUNK, {
                sessionId,
                chunk: text,
              });
              finalOutput += text;
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
            event.reply(MESSAGE.DASHBOARD_AGENT_TOOL_START, {
              sessionId,
              toolName,
              subagentType,
            });
          }

          // Capture actual input token count from the top-level model response.
          // input_tokens = current context size reported by the API — no estimation needed.
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

          if (evt.event === "on_tool_end") {
            const toolName = evt.name || "unknown";
            event.reply(MESSAGE.DASHBOARD_AGENT_TOOL_COMPLETE, {
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

        runningAbortControllers.delete(sessionId);

        if (abortController.signal.aborted) {
          // Stopped by user — send partial output as final result
          createResponse(event, MESSAGE.DASHBOARD_AGENT_RUN_RES, {
            data: { output: finalOutput, steps, stopped: true },
            sessionId,
          });
        } else {
          createResponse(event, MESSAGE.DASHBOARD_AGENT_RUN_RES, {
            data: { output: finalOutput, steps },
            sessionId,
          });

          // Non-blocking: check if we should compact old messages into a summary.
          // Runs in background so it never delays the response to the UI.
          const session = agentSessions.get(sessionId);
          if (session) {
            maybeRunSummarization(session.provider, session.contextTokens)
              .then((compacted) => {
                if (!compacted) return;
                // Compaction happened — recreate the agent with a fresh MemorySaver
                // so the next turn loads the compact summary instead of the full history.
                // Without this, contextTokens stays high and compaction would fire every turn.
                const s = agentSessions.get(sessionId);
                if (!s) return;
                if (s.keeper) s.keeper.cleanup().catch(() => {});
                s.keeper = null;
                s.initPromise = null;
                s.threadId = randomUUID();
                s.checkpointer = new MemorySaver();
                s.contextTokens = 0;
                initAgentInBackground(sessionId, s);
                logEveryWhere({
                  message: "[AgentController] Agent recreated after compaction",
                });
              })
              .catch(() => {});
          }
        }
      } catch (err: any) {
        runningAbortControllers.delete(sessionId);

        if (abortController.signal.aborted) {
          // Stopped by user — don't treat as error
          createResponse(event, MESSAGE.DASHBOARD_AGENT_RUN_RES, {
            data: { output: finalOutput, steps, stopped: true },
            sessionId,
          });
          return;
        }

        const rawMsg = err?.message || "Failed to run agent";
        const errorMsg = normalizeLlmErrorMessage(rawMsg);
        logEveryWhere({ message: `[AgentController] Run error: ${rawMsg}` });

        const errorOutput = finalOutput
          ? `${finalOutput}\n\nError: ${errorMsg}`
          : `Error: ${errorMsg}`;

        createResponse(event, MESSAGE.DASHBOARD_AGENT_RUN_RES, {
          data: { output: errorOutput, steps, isError: true, errorMsg },
          sessionId,
        });
      }
    },
  );

  // STOP — abort a running agent
  onIpc<IpcAgentStopPayload>(
    MESSAGE.DASHBOARD_AGENT_STOP,
    MESSAGE.DASHBOARD_AGENT_STOP_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      const controller = sessionId
        ? runningAbortControllers.get(sessionId)
        : null;
      if (controller) {
        controller.abort();
        runningAbortControllers.delete(sessionId!);
      }
      createResponse(event, MESSAGE.DASHBOARD_AGENT_STOP_RES, {
        data: { sessionId },
      });
    },
  );

  // RESET SESSION — cleanup old agent, next RUN will create a fresh one
  onIpc<IpcAgentResetSessionPayload>(
    MESSAGE.DASHBOARD_AGENT_RESET_SESSION,
    MESSAGE.DASHBOARD_AGENT_RESET_SESSION_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      if (!sessionId) throw new Error("sessionId is required");
      const session = agentSessions.get(sessionId);
      if (!session) throw new Error("Session not found or has expired");

      // Flush memory before resetting so facts from this session survive
      await maybeFlushMemoryOnExit(session);

      if (session.keeper) {
        await session.keeper.cleanup();
        session.keeper = null;
      }
      session.initPromise = null;

      session.threadId = randomUUID();
      session.checkpointer = new MemorySaver();
      session.contextTokens = 0;

      // Eagerly re-init so next prompt is instant
      initAgentInBackground(sessionId, session);

      createResponse(event, MESSAGE.DASHBOARD_AGENT_RESET_SESSION_RES, {
        data: { sessionId },
      });
    },
  );

  // CHANGE PROVIDER — cleanup old agent, recreate with new provider
  onIpc<IpcAgentChangeProviderPayload>(
    MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER,
    MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER_RES,
    async (event, payload) => {
      const { sessionId, provider } = payload || {};
      if (!sessionId) throw new Error("sessionId is required");
      if (!provider) throw new Error("provider is required");
      const session = agentSessions.get(sessionId);
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

      initAgentInBackground(sessionId, session);

      createResponse(event, MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER_RES, {
        data: { sessionId, provider },
      });
    },
  );

  // GET STATUS — renderer polls this when agentReady is false.
  // If the agent init failed previously, retry it automatically.
  onIpc<IpcAgentGetStatusPayload>(
    MESSAGE.DASHBOARD_AGENT_GET_STATUS,
    MESSAGE.DASHBOARD_AGENT_GET_STATUS_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      const session = sessionId ? agentSessions.get(sessionId) : null;

      // If session exists but agent is not ready and no init is in progress, retry init
      // (skip retry when no API key is configured — nothing to initialise)
      if (session && sessionId && !session.keeper && !session.initPromise) {
        const keyExists = await hasApiKey(session.provider);
        if (keyExists) {
          logEveryWhere({
            message: "[AgentController] Agent not ready and no init in progress, retrying init",
          });
          initAgentInBackground(sessionId, session);
        }
      }

      createResponse(event, MESSAGE.DASHBOARD_AGENT_GET_STATUS_RES, {
        data: {
          sessionId,
          ready: !!session?.keeper,
          ...(session?.keeper && {
            subAgentsCount: session.keeper.subAgentsCount,
            toolsCount: session.keeper.toolsCount,
            skillsCount: session.keeper.skillsCount,
          }),
        },
      });
    },
  );

  // DESTROY SESSION
  onIpc<IpcAgentDestroySessionPayload>(
    MESSAGE.DASHBOARD_AGENT_DESTROY_SESSION,
    MESSAGE.DASHBOARD_AGENT_DESTROY_SESSION_RES,
    async (event, payload) => {
      const { sessionId } = payload || {};
      if (!sessionId) throw new Error("sessionId is required");

      const session = agentSessions.get(sessionId);
      if (session?.keeper) {
        await session.keeper.cleanup();
      }
      agentSessions.delete(sessionId);

      createResponse(event, MESSAGE.DASHBOARD_AGENT_DESTROY_SESSION_RES, {
        data: { sessionId },
      });
    },
  );
};
