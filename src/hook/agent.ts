import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MESSAGE } from "@/electron/constant";
import {
  actSetLLMProvider,
  actSaveAgentStats,
  agentSelector,
  LLMProvider,
} from "@/redux/agent";
import { ChatRole } from "@/electron/chatGateway/types";
import {
  type ToolCallState,
  ToolCallStateStatus,
} from "@/component/AgentChatView/util";

const looksLikeEncryptKey = (text: string): boolean => {
  if (text.length > 128) {
    return false;
  }
  if (text.includes("?")) {
    return false;
  }
  if (/[.!]\s+[A-Z]/.test(text)) {
    return false;
  }
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 5) {
    return false;
  }
  return true;
};

type AgentToolStep = {
  toolName: string;
  args: unknown;
  result: string;
  success: boolean;
};

type AgentMessage = {
  role: ChatRole;
  content: string;
  timestamp?: number;
  toolCalls?: ToolCallState[];
};

const isErrorResult = (result: unknown): boolean => {
  if (typeof result !== "string") {
    return false;
  }
  if (result.startsWith("Error")) {
    return true;
  }
  try {
    const parsed = JSON.parse(result);
    return (
      parsed?.success === false ||
      parsed?.status === "error" ||
      (typeof parsed?.status === "string" &&
        parsed.status.startsWith("blocked_"))
    );
  } catch {
    return false;
  }
};

const normalizeSteps = (steps: any[]): AgentToolStep[] => {
  if (!Array.isArray(steps)) {
    return [];
  }

  return steps.map((step) => ({
    toolName: step?.toolName || "",
    args: step?.args,
    result: step?.result || "",
    success: Boolean(step?.success),
  }));
};

// Persist sessionId and agentReady across component mount/unmount so navigating away
// and back reuses the same agent session (no MCP reconnection).
let persistedSessionId: string | null = null;
let persistedAgentReady = false;

const useDashboardAgent = () => {
  const dispatch = useDispatch();
  const agentState = useSelector(agentSelector);
  const llmProvider = agentState?.llmProvider || LLMProvider.OPENAI;

  const [sessionId, setSessionId] = useState<string | null>(persistedSessionId);
  const [conversation, setConversation] = useState<AgentMessage[]>([]);
  const [steps, setSteps] = useState<AgentToolStep[]>([]);
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  /** True once MCP is connected and tools are loaded for the current session. */
  const [agentReady, setAgentReady] = useState(persistedAgentReady);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [toolCallStates, setToolCallStates] = useState<ToolCallState[]>([]);
  const toolCallMapRef = useRef<Map<string, ToolCallState>>(new Map());
  const [planReview, setPlanReview] = useState<{
    sessionId: string;
    plan: string;
  } | null>(null);

  const sessionIdRef = useRef<string | null>(sessionId);
  const streamingContentRef = useRef<string>("");
  // Tracks nested tool call depth so inner tool completions don't clear the badge
  const toolDepthRef = useRef<number>(0);
  const dispatchRef = useRef(dispatch);
  // Tracks the latest conversation so IPC event callbacks always see the current value
  const conversationRef = useRef<AgentMessage[]>(conversation);
  /* Set to true when the agent's last response asked the user for their encryptKey. */
  const expectingEncryptKeyRef = useRef(false);
  /** If DASHBOARD_AGENT_READY arrives before CREATE_SESSION_RES, we apply it when sessionId is set. */
  const pendingReadyRef = useRef<{
    sessionId: string;
    ready: boolean;
    subAgentsCount: number;
    toolsCount: number;
    skillsCount: number;
  } | null>(null);

  sessionIdRef.current = sessionId;
  persistedSessionId = sessionId;
  persistedAgentReady = agentReady;
  dispatchRef.current = dispatch;
  conversationRef.current = conversation;

  const saveMessageToDB = useCallback((msg: AgentMessage) => {
    window?.electron?.send(MESSAGE.CHAT_HISTORY_SAVE_MESSAGE, {
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp || Date.now(),
    });

    // Detect when the agent asks the user for their encryptKey so the next
    // user message can be intercepted and redacted before DB/display.
    if (msg.role === ChatRole.AI) {
      const lower = msg.content.toLowerCase();
      expectingEncryptKeyRef.current =
        lower.includes("encryptkey") ||
        lower.includes("encrypt key") ||
        lower.includes("secret key") ||
        lower.includes("encryption key");
    }
  }, []);

  // Load conversation history from SQLite on first mount only.
  // This replaces the old redux-persist rehydration.
  useEffect(() => {
    const handleLoad = (_event: any, payload: any) => {
      const { data } = payload || {};
      if (Array.isArray(data) && data.length > 0) {
        setConversation(data as AgentMessage[]);
      }
      window?.electron?.removeListener(
        MESSAGE.CHAT_HISTORY_LOAD_RES,
        handleLoad,
      );
    };

    window?.electron?.on(MESSAGE.CHAT_HISTORY_LOAD_RES, handleLoad);
    window?.electron?.send(MESSAGE.CHAT_HISTORY_LOAD, {});

    return () => {
      window?.electron?.removeListener(
        MESSAGE.CHAT_HISTORY_LOAD_RES,
        handleLoad,
      );
    };
  }, []);

  useEffect(() => {
    const handleCreateSession = (_event: any, payload: any) => {
      setCreatingSession(false);
      const { data, error: errMessage } = payload || {};
      if (errMessage) {
        setError(errMessage);
        return;
      }

      const newSessionId = data?.sessionId;
      setSessionId(newSessionId || null);

      // No API key configured — mark as "ready" so UI doesn't show "Preparing agent" forever
      if (data?.noApiKey) {
        setAgentReady(true);
        return;
      }
      // Use ready from response, or from pending DASHBOARD_AGENT_READY if it arrived first (race fix)
      const pending =
        pendingReadyRef.current?.sessionId === newSessionId
          ? pendingReadyRef.current
          : null;
      if (pending) {
        pendingReadyRef.current = null;
        setAgentReady(true);
        dispatchRef.current(
          actSaveAgentStats({
            subAgentsCount: pending.subAgentsCount,
            toolsCount: pending.toolsCount,
            skillsCount: pending.skillsCount,
          }),
        );
      } else {
        setAgentReady(Boolean(data?.agentReady));
        if (data?.agentReady) {
          dispatchRef.current(
            actSaveAgentStats({
              subAgentsCount: data.subAgentsCount,
              toolsCount: data.toolsCount,
              skillsCount: data.skillsCount,
            }),
          );
        }
      }
      setSteps([]);
      setOutput("");
      setError(null);
    };

    const handleRun = (_event: any, payload: any) => {
      const { data, error: errMessage } = payload || {};
      if (errMessage) {
        const failedToolCalls = Array.from(toolCallMapRef.current.values()).map(
          (toolCall) =>
            toolCall.state === ToolCallStateStatus.RUNNING
              ? {
                  ...toolCall,
                  state: ToolCallStateStatus.ERROR,
                  result: errMessage,
                }
              : toolCall,
        );
        if (failedToolCalls.length > 0) {
          const errorMessage: AgentMessage = {
            role: ChatRole.AI,
            content: `Error: ${errMessage}`,
            timestamp: Date.now(),
            toolCalls: failedToolCalls,
          };
          setConversation((prev) => [...prev, errorMessage]);
          saveMessageToDB(errorMessage);
        } else {
          setError(errMessage);
        }
        setLoading(false);
        setStreamingContent("");
        streamingContentRef.current = "";
        setExecutingTool(null);
        toolDepthRef.current = 0;
        setToolCallStates([]);
        toolCallMapRef.current.clear();
        return;
      }

      const result = data || {};
      const normalizedSteps = normalizeSteps(result?.steps || []);

      // Snapshot completed tool calls before clearing, so they can be attached to the message
      const completedToolCalls = Array.from(toolCallMapRef.current.values());

      // Append remaining streamed content as a final AI message
      // (earlier chunks were flushed on tool_start as separate messages)
      const remainingContent = streamingContentRef.current || "";
      if (remainingContent.trim()) {
        const assistantMessage: AgentMessage = {
          role: ChatRole.AI,
          content: remainingContent,
          timestamp: Date.now(),
          toolCalls:
            completedToolCalls.length > 0 ? completedToolCalls : undefined,
        };
        setConversation((prev) => [...prev, assistantMessage]);
        saveMessageToDB(assistantMessage);
      } else if (result?.isError) {
        // Top-level run error — show the error message directly
        const errorMessage: AgentMessage = {
          role: ChatRole.AI,
          content: `Error: ${result.errorMsg || "An error occurred."}`,
          timestamp: Date.now(),
          toolCalls:
            completedToolCalls.length > 0 ? completedToolCalls : undefined,
        };
        setConversation((prev) => [...prev, errorMessage]);
        saveMessageToDB(errorMessage);
      } else {
        // No streaming content — check if any steps failed and surface the error
        const failedStep = (result?.steps || []).find((s: any) => !s.success);
        if (failedStep) {
          const errorMessage: AgentMessage = {
            role: ChatRole.AI,
            content: `Error: ${failedStep.result || "An error occurred while executing the task."}`,
            timestamp: Date.now(),
            toolCalls:
              completedToolCalls.length > 0 ? completedToolCalls : undefined,
          };
          setConversation((prev) => [...prev, errorMessage]);
          saveMessageToDB(errorMessage);
        } else if (completedToolCalls.length > 0) {
          // Tools ran but produced no final text — attach tool cards to the last AI message
          setConversation((prev) => {
            if (prev.length === 0) {
              return prev;
            }
            const last = prev[prev.length - 1];
            if (last.role === ChatRole.AI) {
              return [
                ...prev.slice(0, -1),
                { ...last, toolCalls: completedToolCalls },
              ];
            }

            // Last entry is not an AI message — append a synthetic assistant turn
            return [
              ...prev,
              {
                role: ChatRole.AI,
                content: "",
                timestamp: Date.now(),
                toolCalls: completedToolCalls,
              },
            ];
          });
        }
      }

      setSteps(normalizedSteps);
      setOutput(result?.output || "");
      setError(null);
      setLoading(false);
      setStreamingContent("");
      streamingContentRef.current = "";
      setExecutingTool(null);
      toolDepthRef.current = 0;
      setToolCallStates([]);
      toolCallMapRef.current.clear();
    };

    const handleReset = (_event: any, payload: any) => {
      const { error: errMessage } = payload || {};
      if (errMessage) {
        setError(errMessage);
        return;
      }
      setAgentReady(false); // Backend will send DASHBOARD_AGENT_READY after re-init
      setConversation([]);
      setSteps([]);
      setOutput("");
      setError(null);
    };

    const handleStreamChunk = (_event: any, payload: any) => {
      const { sessionId: payloadSessionId, chunk } = payload || {};
      if (payloadSessionId === sessionIdRef.current && chunk) {
        streamingContentRef.current += chunk;
        setStreamingContent(streamingContentRef.current);
      }
    };

    const handleToolStart = (_event: any, payload: any) => {
      const {
        sessionId: payloadSessionId,
        toolName,
        subagentType,
        runId,
        input,
      } = payload || {};
      if (payloadSessionId === sessionIdRef.current && toolName) {
        // Flush any accumulated streaming text as a completed message
        // so the tool execution indicator appears as a separate step
        if (streamingContentRef.current.trim()) {
          const partialMessage: AgentMessage = {
            role: ChatRole.AI,
            content: streamingContentRef.current,
            timestamp: Date.now(),
          };
          setConversation((prev) => [...prev, partialMessage]);
          // Save the partial message so it's not lost if app closes during tool execution
          saveMessageToDB(partialMessage);
          streamingContentRef.current = "";
          setStreamingContent("");
        }
        toolDepthRef.current += 1;
        // For task tool show the subagent name; for inner tools show the tool display name
        setExecutingTool(subagentType || toolName);

        // Track this tool call as a structured state entry
        const resolvedRunId = runId || `${toolName}_${Date.now()}`;
        const newToolCall: ToolCallState = {
          runId: resolvedRunId,
          toolName,
          input: input || {},
          state: ToolCallStateStatus.RUNNING,
        };
        toolCallMapRef.current.set(resolvedRunId, newToolCall);
        setToolCallStates(Array.from(toolCallMapRef.current.values()));
      }
    };

    const handleToolComplete = (_event: any, payload: any) => {
      const {
        sessionId: payloadSessionId,
        toolName,
        runId,
        result,
      } = payload || {};
      if (payloadSessionId === sessionIdRef.current) {
        // Update the matching tool call to done state
        if (runId && toolCallMapRef.current.has(runId)) {
          const existing = toolCallMapRef.current.get(runId)!;
          const isError = isErrorResult(result);

          toolCallMapRef.current.set(runId, {
            ...existing,
            state: isError
              ? ToolCallStateStatus.ERROR
              : ToolCallStateStatus.DONE,
            result,
          });
          setToolCallStates(Array.from(toolCallMapRef.current.values()));
        }

        toolDepthRef.current = Math.max(0, toolDepthRef.current - 1);
        // Only clear the badge when all nested tool calls have finished
        if (toolDepthRef.current === 0) {
          setExecutingTool(null);
          toolDepthRef.current = 0;
        } else {
          // Inner tool done — step back up to show the outer subagent context
          setExecutingTool(toolName || null);
        }
      }
    };

    const handleAgentReady = (_event: any, payload: any) => {
      const {
        sessionId: payloadSessionId,
        ready,
        noApiKey,
        subAgentsCount,
        toolsCount,
        skillsCount,
      } = payload || {};
      const payloadReady = !!ready;

      // No API key configured — mark as "ready" so UI doesn't show "Preparing agent" forever
      if (noApiKey) {
        if (payloadSessionId === sessionIdRef.current) {
          setAgentReady(true);
          setCreatingSession(false);
        }
        pendingReadyRef.current = null;
        return;
      }

      if (payloadSessionId === sessionIdRef.current) {
        setAgentReady(payloadReady);
        if (payloadReady) {
          dispatchRef.current(
            actSaveAgentStats({ subAgentsCount, toolsCount, skillsCount }),
          );
        }
        pendingReadyRef.current = null;
      } else if (payloadSessionId && payloadReady) {
        // Ready arrived before CREATE_SESSION_RES; apply when sessionId is set in handleCreateSession
        pendingReadyRef.current = {
          sessionId: payloadSessionId,
          ready: true,
          subAgentsCount: subAgentsCount || 0,
          toolsCount: toolsCount || 0,
          skillsCount: skillsCount || 0,
        };
      }
    };

    const handleStop = (_event: any, payload: any) => {
      const { error: errMessage } = payload || {};
      if (errMessage) {
        setError(errMessage);
      }
    };

    const handlePlanReview = (_event: any, payload: any) => {
      const { sessionId: payloadSessionId, plan } = payload || {};
      if (payloadSessionId === sessionIdRef.current && plan) {
        setPlanReview({ sessionId: payloadSessionId, plan });
      }
    };

    const handleChangeProvider = (_event: any, payload: any) => {
      const { error: errMessage } = payload || {};
      if (errMessage) {
        setError(errMessage);
        return;
      }
      setAgentReady(false);
      setSteps([]);
      setOutput("");
      setError(null);
      // Keep conversation so chat history stays visible after switching model
    };

    window?.electron?.on(
      MESSAGE.DASHBOARD_AGENT_CREATE_SESSION_RES,
      handleCreateSession,
    );
    window?.electron?.on(MESSAGE.DASHBOARD_AGENT_RUN_RES, handleRun);
    window?.electron?.on(
      MESSAGE.DASHBOARD_AGENT_STREAM_CHUNK,
      handleStreamChunk,
    );
    window?.electron?.on(MESSAGE.DASHBOARD_AGENT_TOOL_START, handleToolStart);
    window?.electron?.on(
      MESSAGE.DASHBOARD_AGENT_TOOL_COMPLETE,
      handleToolComplete,
    );
    window?.electron?.on(
      MESSAGE.DASHBOARD_AGENT_RESET_SESSION_RES,
      handleReset,
    );
    window?.electron?.on(MESSAGE.DASHBOARD_AGENT_READY, handleAgentReady);
    window?.electron?.on(
      MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER_RES,
      handleChangeProvider,
    );
    window?.electron?.on(MESSAGE.DASHBOARD_AGENT_STOP_RES, handleStop);
    window?.electron?.on(MESSAGE.DASHBOARD_AGENT_PLAN_REVIEW, handlePlanReview);

    return () => {
      window?.electron?.removeListener(
        MESSAGE.DASHBOARD_AGENT_CREATE_SESSION_RES,
        handleCreateSession,
      );
      window?.electron?.removeListener(
        MESSAGE.DASHBOARD_AGENT_RUN_RES,
        handleRun,
      );
      window?.electron?.removeListener(
        MESSAGE.DASHBOARD_AGENT_STREAM_CHUNK,
        handleStreamChunk,
      );
      window?.electron?.removeListener(
        MESSAGE.DASHBOARD_AGENT_TOOL_START,
        handleToolStart,
      );
      window?.electron?.removeListener(
        MESSAGE.DASHBOARD_AGENT_TOOL_COMPLETE,
        handleToolComplete,
      );
      window?.electron?.removeListener(
        MESSAGE.DASHBOARD_AGENT_RESET_SESSION_RES,
        handleReset,
      );
      window?.electron?.removeListener(
        MESSAGE.DASHBOARD_AGENT_READY,
        handleAgentReady,
      );
      window?.electron?.removeListener(
        MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER_RES,
        handleChangeProvider,
      );
      window?.electron?.removeListener(
        MESSAGE.DASHBOARD_AGENT_STOP_RES,
        handleStop,
      );
      window?.electron?.removeListener(
        MESSAGE.DASHBOARD_AGENT_PLAN_REVIEW,
        handlePlanReview,
      );
    };
  }, [saveMessageToDB]);

  // On mount: if we already have a sessionId but agentReady is false, query the main
  // process for the current agent status. This handles the case where DASHBOARD_AGENT_READY
  // fired while this component was unmounted (e.g., during a reset or provider change).
  useEffect(() => {
    if (!sessionId || agentReady) {
      return;
    }

    const handleStatus = (_event: any, payload: any) => {
      const { data } = payload || {};
      if (data?.sessionId !== sessionIdRef.current) {
        return;
      }
      if (!data?.ready) {
        return;
      }
      setAgentReady(true);
      dispatchRef.current(
        actSaveAgentStats({
          subAgentsCount: data.subAgentsCount,
          toolsCount: data.toolsCount,
          skillsCount: data.skillsCount,
        }),
      );
    };

    window?.electron?.on(MESSAGE.DASHBOARD_AGENT_GET_STATUS_RES, handleStatus);
    window?.electron?.send(MESSAGE.DASHBOARD_AGENT_GET_STATUS, { sessionId });

    return () => {
      window?.electron?.removeListener(
        MESSAGE.DASHBOARD_AGENT_GET_STATUS_RES,
        handleStatus,
      );
    };
  }, [sessionId, agentReady]);

  // Watch for provider changes from Redux and send IPC to reinit agent.
  // Keep conversation history visible (do not clear); only reset ready state and in-flight UI.
  const prevProviderRef = useRef(llmProvider);
  useEffect(() => {
    if (prevProviderRef.current === llmProvider) {
      return;
    }
    prevProviderRef.current = llmProvider;
    if (!sessionIdRef.current) {
      return;
    }
    setAgentReady(false);
    setSteps([]);
    setOutput("");
    setError(null);
    window?.electron?.send(MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER, {
      sessionId: sessionIdRef.current,
      provider: llmProvider,
    });
  }, [llmProvider]);

  const createSession = useCallback(() => {
    setCreatingSession(true);
    setError(null);
    window?.electron?.send(MESSAGE.DASHBOARD_AGENT_CREATE_SESSION, {
      provider: llmProvider,
    });
  }, [llmProvider]);

  const sendMessage = useCallback(
    (
      input: string,
      options?: { encryptKey?: string; displayText?: string },
    ) => {
      if (!sessionIdRef.current) {
        setError("Agent session is not ready. Please try again in a moment.");
        return;
      }
      if (!input || input.trim().length === 0) {
        setError("Message must not be empty");
        return;
      }

      // If the agent previously asked for an encryptKey, treat this message as
      // the key — store it in the IPC payload and replace display/DB content
      // with a safe placeholder. Always reset the flag after one message.
      let resolvedEncryptKey = options?.encryptKey;
      let displayText = (options?.displayText || input).trim();
      if (expectingEncryptKeyRef.current) {
        expectingEncryptKeyRef.current = false;
        if (displayText && looksLikeEncryptKey(displayText)) {
          resolvedEncryptKey = displayText;
          displayText = "[ENCRYPT_KEY]";
        }
      }

      // displayText is the clean user-visible text (no context block).
      // input is the full message sent to the agent (includes context JSON).
      const contentForDisplay = displayText;

      const userMessage: AgentMessage = {
        role: ChatRole.HUMAN,
        content: contentForDisplay,
        timestamp: Date.now(),
      };
      setConversation((prev) => [...prev, userMessage]);

      // Persist only the clean user text — never the appended context block.
      window?.electron?.send(MESSAGE.CHAT_HISTORY_SAVE_MESSAGE, {
        role: userMessage.role,
        content: userMessage.content,
        timestamp: userMessage.timestamp,
      });

      setLoading(true);
      setError(null);
      setStreamingContent("");
      streamingContentRef.current = "";
      setExecutingTool(null);
      toolDepthRef.current = 0;
      setToolCallStates([]);
      toolCallMapRef.current.clear();
      window?.electron?.send(MESSAGE.DASHBOARD_AGENT_RUN, {
        sessionId: sessionIdRef.current,
        input,
        encryptKey: resolvedEncryptKey,
      });
    },
    [],
  );

  const resetSession = useCallback(() => {
    if (!sessionIdRef.current) {
      return;
    }
    setConversation([]);
    setSteps([]);
    setOutput("");
    setError(null);
    setStreamingContent("");
    streamingContentRef.current = "";
    setExecutingTool(null);
    setPlanReview(null);
    toolDepthRef.current = 0;
    setToolCallStates([]);
    toolCallMapRef.current.clear();
    expectingEncryptKeyRef.current = false;
    // Clear SQLite history so the next session starts fresh
    window?.electron?.send(MESSAGE.CHAT_HISTORY_CLEAR, {});
    // Reset the agent's LangGraph thread on the backend
    window?.electron?.send(MESSAGE.DASHBOARD_AGENT_RESET_SESSION, {
      sessionId: sessionIdRef.current,
    });
  }, []);

  const changeProvider = useCallback(
    (provider: LLMProvider) => {
      dispatch(actSetLLMProvider(provider));
      if (!sessionIdRef.current) return;
      setAgentReady(false);
      window?.electron?.send(MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER, {
        sessionId: sessionIdRef.current,
        provider,
      });
    },
    [dispatch],
  );

  const stopAgent = useCallback(() => {
    if (!sessionIdRef.current) return;
    window?.electron?.send(MESSAGE.DASHBOARD_AGENT_STOP, {
      sessionId: sessionIdRef.current,
    });
  }, []);

  const approvePlan = useCallback(
    (approved: boolean) => {
      const currentPlanReview = planReview;
      if (!currentPlanReview) {
        return;
      }
      setPlanReview(null);

      if (approved) {
        const echoMessage: AgentMessage = {
          role: ChatRole.AI,
          content: `**✓ Plan approved**\n\n${currentPlanReview.plan}`,
          timestamp: Date.now(),
        };
        setConversation((prev) => [...prev, echoMessage]);
        saveMessageToDB(echoMessage);
      }

      window?.electron?.send(MESSAGE.DASHBOARD_AGENT_PLAN_APPROVAL, {
        sessionId: currentPlanReview.sessionId,
        approved,
      });
    },
    [planReview, saveMessageToDB],
  );

  return {
    sessionId,
    conversation,
    steps,
    output,
    loading,
    creatingSession,
    agentReady,
    error,
    streamingContent,
    executingTool,
    toolCallStates,
    planReview,
    llmProvider,
    createSession,
    sendMessage,
    stopAgent,
    resetSession,
    changeProvider,
    approvePlan,
    setError,
  };
};

const useAgentReadyStats = (active: boolean) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!active) {
      return;
    }

    const handleAgentReady = (_event: any, payload: any) => {
      const { ready, subAgentsCount, toolsCount, skillsCount } = payload || {};
      if (ready) {
        dispatch(
          actSaveAgentStats({ subAgentsCount, toolsCount, skillsCount }),
        );
      }
    };
    window?.electron?.on(MESSAGE.DASHBOARD_AGENT_READY, handleAgentReady);

    return () => {
      window?.electron?.removeListener(
        MESSAGE.DASHBOARD_AGENT_READY,
        handleAgentReady,
      );
    };
  }, [dispatch, active]);
};

export { useDashboardAgent, useAgentReadyStats };
