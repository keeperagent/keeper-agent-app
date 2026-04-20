/**
 * AgentChatBridge — Connects chat platforms (Telegram, desktop UI, etc.) to the KeeperAgent.
 * Each platform registers an IChatAdapter. Incoming user messages are routed to the agent, and the agent's response is streamed back through the same adapter.
 * Manages one agent session per (platformId + chatId), with streaming, tool status updates, and background memory compaction.
 */

import { randomUUID } from "crypto";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type ContentBlock,
} from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import fs from "fs-extra";
import { redact, guard } from "@keeperagent/crypto-key-guard";
import {
  createKeeperAgent,
  createBackgroundLLM,
  hasApiKey,
  getModelName,
  type KeeperAgent,
  ToolContext,
  type IAttachedFileContext,
} from "@/electron/agentCore";
import { checkModelCapability } from "@/electron/service/modelCapability";
import { extractMemoryFromConversation } from "./memoryExtraction";
import { looksLikeEncryptKey, isErrorResult } from "@/electron/agentCore/utils";
import { logEveryWhere } from "@/electron/service/util";
import { chatHistoryDB } from "@/electron/database/chatHistory";
import { experienceRetriever } from "@/electron/agentCore/experienceEngine/experienceRetriever";
import { experienceRecorder } from "@/electron/agentCore/experienceEngine/experienceRecorder";
import { LLMProvider } from "@/electron/type";
import { mainWindow } from "@/electron/main";
import { MESSAGE, getToolDisplayName } from "@/electron/constant";
import { ChatPlatform, ChatRole } from "./types";
import type { IChatAdapter, IPlatformMessage } from "./types";

const COMPACTION_THRESHOLD = 40_000;
const MIN_MESSAGES_FOR_COMPACTION = 10;

/**
 * Extracts the raw string content from a tool's output.
 * LangChain wraps tool outputs in a ToolMessage object ({ lc, type, kwargs: { content } }).
 * We need to unwrap it to get the actual string the tool returned.
 */
const extractToolOutput = (rawOutput: any): string => {
  if (typeof rawOutput === "string") {
    return rawOutput;
  }
  const content = rawOutput?.kwargs?.content ?? rawOutput?.content;
  if (typeof content === "string") {
    return content;
  }
  return JSON.stringify(rawOutput || "");
};

const truncateToolResultForIpc = (
  result: string,
  maxTotal: number = 10000,
): string => {
  try {
    const parsed = JSON.parse(result);
    const truncateValue = (value: any): any => {
      if (typeof value === "string" && value.length > 2000) {
        return value.slice(0, 2000) + "...[truncated]";
      }
      if (Array.isArray(value)) {
        return value.map(truncateValue);
      }
      if (value && typeof value === "object") {
        const truncated: Record<string, any> = {};
        for (const key of Object.keys(value)) {
          truncated[key] = truncateValue(value[key]);
        }
        return truncated;
      }
      return value;
    };
    const serialized = JSON.stringify(truncateValue(parsed));
    return serialized.length > maxTotal
      ? serialized.slice(0, maxTotal)
      : serialized;
  } catch {
    return result.slice(0, maxTotal);
  }
};

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
  //  Summary text from the last compaction, injected into the new thread on first run
  pendingSummary: string | null;
  // Set when the agent's last response asked the user for their encryptKey
  expectingEncryptKey: boolean;
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
  supportsVision = true,
): Promise<HumanMessage> => {
  const imageFiles = supportsVision
    ? (attachedFiles || []).filter(
        (file) =>
          file.type === "image" &&
          file.filePath &&
          IMAGE_MIME_BY_EXT[file.extension || ""],
      )
    : [];

  if (imageFiles.length === 0) {
    return new HumanMessage(text);
  }

  const contentBlocks: ContentBlock[] = [
    { type: "text", text } as ContentBlock,
  ];

  for (const file of imageFiles) {
    try {
      const buffer = fs.readFileSync(file.filePath);
      const base64 = buffer.toString("base64");
      const mimeType = IMAGE_MIME_BY_EXT[file.extension || ""];
      contentBlocks.push({
        type: "image",
        mimeType,
        data: base64,
      } as ContentBlock);
    } catch {}
  }

  return new HumanMessage({ content: contentBlocks });
};

class AgentChatBridge {
  private sessions = new Map<string, AgentSession>();
  private abortControllers = new Map<string, AbortController>();
  private activeRuns = new Set<string>();
  private adapters = new Map<string, IChatAdapter>();
  pendingPlanApprovals = new Map<string, (approved: boolean) => void>();

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

  /**
   * Fires after each agent run. When context tokens exceed 40K, summarizes old
   * messages into a compact block, extracts memory, then resets the thread so
   * the next run starts fresh with the summary injected as context.
   * Returns the summary text if compaction ran.
   */
  private compactSessionIfNeeded = async (
    session: AgentSession,
  ): Promise<string | null> => {
    if (session.isCompacting) return null;
    try {
      if (session.contextTokens <= COMPACTION_THRESHOLD) {
        return null;
      }
      session.isCompacting = true;

      const [messages] = await chatHistoryDB.getMessagesForSummarization(
        session.platformId,
        session.platformChatId,
      );
      if (messages.length < MIN_MESSAGES_FOR_COMPACTION) {
        return null;
      }

      const lastId = messages[messages.length - 1]?.id;
      if (!lastId) {
        return null;
      }

      const conversationText = messages
        .map(
          (msg) =>
            `${msg.role === ChatRole.HUMAN ? "User" : "Assistant"}: ${msg.content}`,
        )
        .join("\n\n");

      const llm = await createBackgroundLLM(session.provider);
      const response = await llm.invoke([
        new SystemMessage(
          "Summarize the following conversation in 300-400 words. " +
            "Capture key topics discussed, decisions made, user preferences, " +
            "and important context. Be factual and concise. " +
            "Never include secrets, passwords, private keys, seed phrases, or credentials of any kind in the summary.",
        ),
        new HumanMessage(conversationText),
      ]);

      const rawSummary =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

      // Remove any crypto secrets the LLM may have included despite prompt instructions
      const { text: summaryText } = redact(rawSummary);

      await extractMemoryFromConversation(session.provider, messages);
      await chatHistoryDB.saveSummary(
        summaryText,
        lastId,
        session.platformId,
        session.platformChatId,
      );
      logEveryWhere({
        message: "[AgentChatBridge] Background summarisation completed",
      });
      return summaryText;
    } catch (err: any) {
      logEveryWhere({
        message: `[AgentChatBridge] Summarisation error: ${err?.message}`,
      });
      return null;
    } finally {
      session.isCompacting = false;
    }
  };

  // Extract memory from messages not yet processed since the last compaction
  // Skip if there are no new messages to process
  private runMemoryExtractionForSession = async (
    session: AgentSession,
  ): Promise<void> => {
    try {
      const [messages] = await chatHistoryDB.getMessagesForSummarization(
        session.platformId,
        session.platformChatId,
      );
      if (messages.length === 0) {
        return;
      }
      await extractMemoryFromConversation(session.provider, messages);
    } catch (err: any) {
      logEveryWhere({
        message: `[AgentChatBridge] Memory extraction error: ${err?.message}`,
      });
    }
  };

  // recreate agent after summary
  private postRunCompaction = (sessionKey: string, session: AgentSession) => {
    this.compactSessionIfNeeded(session)
      .then((summaryText) => {
        if (!summaryText) {
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
        currentSession.pendingSummary = summaryText;
        this.initAgentInBackground(sessionKey, currentSession);
        logEveryWhere({
          message: "[AgentChatBridge] Agent recreated after compaction",
        });
      })
      .catch(() => {});
  };

  // IPC Session Management (used by agentCore controller)
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
      pendingSummary: null,
      expectingEncryptKey: false,
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
      pendingSummary: null,
      expectingEncryptKey: false,
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
      // For IPC: the Electron IPC event to stream chunks through.
      ipcEvent?: Electron.IpcMainEvent;
      // Callback for each streamed text chunk (for platform adapters).
      onChunk?: (chunk: string) => void;
      // Callback when a tool starts executing.
      onToolStart?: (toolName: string, subagentType?: string) => void;
      // Callback when a tool finishes executing.
      onToolComplete?: (toolName: string) => void;
      // Image files to include as multimodal content blocks.
      attachedFiles?: IAttachedFileContext[];
      // Run ID to link this run's messages together (generated here if not provided)
      runId?: string;
      // Raw user message used for experience retrieval (before context injection)
      rawUserMessage?: string;
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
    runId: string;
    todoTemplate: string | null;
  }> => {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found or has expired");
    }

    const runId = options?.runId || randomUUID();
    let finalOutput = "";
    let finalTodos: any[] | null = null;
    const textBuffers = new Map<string, string>();
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

      // Reset plan state and step-scoping state at the start of each run
      session.toolContext.resetPlanState();
      session.toolContext.resetStepState?.();

      // Retrieve and inject experience hint before first model call (awaited — no LLM, ~100ms)
      if (options?.rawUserMessage) {
        try {
          const hint = await experienceRetriever.retrieve(
            options.rawUserMessage,
          );
          if (hint) {
            session.toolContext.update({ experienceHint: hint });
          }
        } catch {}
      }

      // Capture final todos when all steps complete (used for experience logging)
      session.toolContext.update({
        onAllDone: (todos: any[]) => {
          finalTodos = todos;
        },
      });

      // Wire plan approval and step-advanced callbacks for IPC sessions (desktop app)
      if (options?.ipcEvent) {
        session.toolContext.update({
          requestPlanApproval: (plan: string) =>
            new Promise<boolean>((resolve) => {
              this.pendingPlanApprovals.set(sessionId, resolve);
              options.ipcEvent!.reply(MESSAGE.DASHBOARD_AGENT_PLAN_REVIEW, {
                sessionId,
                plan,
              });
            }),
          onStepAdvanced: (stepContent: string, todos: any[]) => {
            options.ipcEvent!.reply(MESSAGE.DASHBOARD_AGENT_STEP_ADVANCED, {
              sessionId,
              stepContent,
              todos,
            });
          },
        });
      }

      // Layer 2: redact crypto secrets before they reach the LLM provider
      const { text: redactedInput, secrets: newSecrets } = redact(input.trim());
      if (newSecrets.size > 0) {
        session.toolContext.mergeSecrets(newSecrets);
        logEveryWhere({
          message: `[AgentChatBridge] Redacted ${newSecrets.size} secret(s) before LLM`,
        });
      }

      const hasImageAttachments =
        options?.attachedFiles?.some((file) => file.type === "image") ?? false;
      let supportsVision = true;
      if (hasImageAttachments) {
        const modelName = await getModelName(session.provider);
        ({ supportsVision } = await checkModelCapability(
          modelName,
          session.provider,
        ));
      }

      const humanMessage = await buildHumanMessage(
        redactedInput,
        options?.attachedFiles,
        supportsVision,
      );

      // Inject the compaction summary as the first exchange in the new thread so the agent has session context even after the checkpointer was reset
      const initialMessages: (HumanMessage | AIMessage)[] = [];
      if (session.pendingSummary) {
        initialMessages.push(
          new HumanMessage(
            `This conversation continues from a previous session that was compacted. ` +
              `Summary of the prior context:\n\n${session.pendingSummary}`,
          ),
          new AIMessage(
            "Understood. I have the context from the previous conversation and will continue from where we left off.",
          ),
        );
        session.pendingSummary = null;
      }
      initialMessages.push(humanMessage);

      const eventStream = agent?.streamEvents(
        { messages: initialMessages },
        {
          configurable: { thread_id: session.threadId },
          version: "v2",
          recursionLimit: 100,
          signal: abortController.signal,
        },
      );

      for await (const evt of eventStream) {
        if (abortController.signal.aborted) {
          break;
        }

        // Streaming text chunks — buffer per run_id, flush only if no tool calls
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
            const runId = evt.run_id || "default";
            textBuffers.set(runId, (textBuffers.get(runId) || "") + text);
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
          const toolInput = evt.data?.input || {};
          options?.ipcEvent?.reply(MESSAGE.DASHBOARD_AGENT_TOOL_START, {
            sessionId,
            toolName,
            subagentType,
            runId: evt?.run_id || `${toolName}_${Date.now()}`,
            input: toolInput,
          });
        }

        // Model end — flush buffered text if no tool calls, discard if preamble.
        // No namespace filter here — the buffer only contains text from top-level
        // stream events that passed the "|" filter, so subagent end events will
        // simply find an empty buffer and do nothing.
        if (evt.event === "on_chat_model_end") {
          const runId = evt.run_id || "default";
          const bufferedText = textBuffers.get(runId) || "";
          textBuffers.delete(runId);

          const output = evt.data?.output;
          const hasToolCalls =
            Array.isArray(output?.tool_calls) && output.tool_calls.length > 0;

          if (bufferedText && !hasToolCalls) {
            finalOutput += bufferedText;
            options?.onChunk?.(bufferedText);
            options?.ipcEvent?.reply(MESSAGE.DASHBOARD_AGENT_STREAM_CHUNK, {
              sessionId,
              chunk: bufferedText,
            });
          } else if (bufferedText && hasToolCalls) {
          }

          // Only track context tokens for top-level model calls
          if (
            !String(evt.metadata?.langgraph_checkpoint_ns || "").includes("|")
          ) {
            const inputTokens = output?.usage_metadata?.input_tokens || 0;
            if (inputTokens > 0) {
              session.contextTokens = inputTokens;
            }
          }
        }

        // Tool end
        if (evt.event === "on_tool_end") {
          const toolName = evt.name || "unknown";
          options?.onToolComplete?.(toolName);
          const toolResult = extractToolOutput(evt.data?.output);
          options?.ipcEvent?.reply(MESSAGE.DASHBOARD_AGENT_TOOL_COMPLETE, {
            sessionId,
            toolName,
            runId: evt?.run_id || "",
            result: truncateToolResultForIpc(toolResult),
          });

          steps.push({
            toolName,
            args: evt.data?.input || {},
            result: toolResult,
            success: !isErrorResult(toolResult),
          });
        }
      }

      const todoTemplate = finalTodos ? JSON.stringify(finalTodos) : null;

      if (abortController.signal.aborted) {
        return {
          output: finalOutput,
          steps,
          stopped: true,
          runId,
          todoTemplate,
        };
      }

      // Background compaction
      this.postRunCompaction(sessionId, session);
      return { output: finalOutput, steps, runId, todoTemplate };
    } catch (err: any) {
      const todoTemplate = finalTodos ? JSON.stringify(finalTodos) : null;

      if (abortController.signal.aborted) {
        return {
          output: finalOutput,
          steps,
          stopped: true,
          runId,
          todoTemplate,
        };
      }

      const rawMsg = err?.message || "Failed to run agent";
      const errorMsg = normalizeLlmErrorMessage(rawMsg);
      logEveryWhere({
        message: `[AgentChatBridge] Run error: ${rawMsg}`,
      });

      const errorOutput = finalOutput
        ? `${finalOutput}\n\nError: ${errorMsg}`
        : `Error: ${errorMsg}`;

      return {
        output: errorOutput,
        steps,
        isError: true,
        errorMsg,
        runId,
        todoTemplate,
      };
    } finally {
      this.activeRuns.delete(sessionId);
      this.abortControllers.delete(sessionId);
      // Clear per-run callbacks so stale closures don't fire in subsequent runs
      const runSession = this.sessions.get(sessionId);
      if (runSession) {
        runSession.toolContext.update({
          onStepAdvanced: undefined,
          onAllDone: undefined,
          experienceHint: null,
        });
      }
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

    const pendingApproval = this.pendingPlanApprovals.get(sessionId);
    if (pendingApproval) {
      pendingApproval(false);
      this.pendingPlanApprovals.delete(sessionId);
    }

    // Extract memory from remaining messages before clearing the session
    this.runMemoryExtractionForSession(session).catch(() => {});

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
      // Extract memory before closing app
      await this.runMemoryExtractionForSession(session).catch(() => {});
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
        pendingSummary: null,
        expectingEncryptKey: false,
      };
      this.sessions.set(sessionKey, session);
      this.initAgentInBackground(sessionKey, session);
    }

    const session = this.sessions.get(sessionKey)!;

    // If the agent previously asked for an encryptKey, check whether this
    // message actually looks like a key vs. a normal question / command.
    // Always reset the flag so it doesn't persist across multiple messages.
    let userText = message.text;
    if (session.expectingEncryptKey) {
      session.expectingEncryptKey = false;
      const rawKey = message.text.trim();
      if (rawKey && looksLikeEncryptKey(rawKey)) {
        session.toolContext.update({ encryptKey: rawKey });
        userText = "[ENCRYPT_KEY]";
        logEveryWhere({
          message:
            "[AgentChatBridge] Captured encryptKey from external platform, redacted from message",
        });
      }
    }

    // Layer 1 (external platforms): warn user if message contains crypto secrets
    const secretCheck = guard(userText);
    if (secretCheck.detected) {
      await adapter
        .sendText(
          message.chatId,
          "Your message appears to contain a private key or seed phrase. It will be automatically redacted before being sent to the LLM provider.",
        )
        .catch(() => {});
    }

    const runId = randomUUID();

    // Save user message to chat history (with encryptKey already redacted above)
    await chatHistoryDB.saveMessage({
      role: ChatRole.HUMAN,
      content: userText,
      timestamp: Date.now(),
      platformId: adapter.platformId,
      platformChatId: message.chatId,
      sessionId: sessionKey,
      runId,
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
      const inputWithContext = `${userText}\n\n${contextHeader}\n${JSON.stringify({ platformId: adapter.platformId, currentDate: new Date().toLocaleString("sv") })}`;
      const result = await this.runAgent(sessionKey, inputWithContext, {
        runId,
        rawUserMessage: userText,
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
      const [savedAiMsg] = await chatHistoryDB.saveMessage({
        role: ChatRole.AI,
        content: finalText,
        timestamp: Date.now(),
        platformId: adapter.platformId,
        platformChatId: message.chatId,
        sessionId: sessionKey,
        runId,
      });

      const toolCallSequence =
        result.steps.length > 0
          ? JSON.stringify(result.steps.map((step) => step.toolName))
          : null;

      if (savedAiMsg?.id) {
        const runOutcome = result.isError ? "failed" : "success";
        await chatHistoryDB.updateRunCompletion(savedAiMsg.id, {
          toolCallSequence,
          todoTemplate: result.todoTemplate,
          runOutcome,
        });
      }

      // Record experience non-blocking — fires after response is already delivered
      experienceRecorder
        .record({
          runId,
          userMessage: userText,
          toolCallSequence,
          todoTemplate: result.todoTemplate,
          isSuccess: !result.isError && !result.stopped,
          errorMsg: result.errorMsg,
          provider: session.provider,
        })
        .catch(() => {});

      // Detect when the agent asks the user for their encryptKey so we can
      // intercept and redact the next user message before LLM/DB.
      const lowerOutput = finalText.toLowerCase();
      if (
        lowerOutput.includes("encryptkey") ||
        lowerOutput.includes("encrypt key") ||
        lowerOutput.includes("secret key") ||
        lowerOutput.includes("encryption key")
      ) {
        session.expectingEncryptKey = true;
      }
    } catch (err: any) {
      clearInterval(typingInterval);
      // Clean up status message on error
      if (statusMessageId) {
        adapter
          .editMessage(
            message.chatId,
            statusMessageId,
            `Error: ${err?.message}`,
          )
          .catch(() => {});
      } else {
        await adapter
          .sendText(message.chatId, `Error: ${err?.message}`)
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
