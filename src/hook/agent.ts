import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MESSAGE } from "@/electron/constant";
import {
  actSetLLMProvider,
  actSaveAgentStats,
  agentSelector,
  LLMProvider,
} from "@/redux/agent";

type AgentToolStep = {
  toolName: string;
  args: unknown;
  result: string;
  success: boolean;
};

type AgentMessage = {
  role: string;
  content: string;
  timestamp?: number;
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

  const sessionIdRef = useRef<string | null>(sessionId);
  const streamingContentRef = useRef<string>("");
  // Tracks nested tool call depth so inner tool completions don't clear the badge
  const toolDepthRef = useRef<number>(0);
  const dispatchRef = useRef(dispatch);
  // Tracks the latest conversation so IPC event callbacks always see the current value
  const conversationRef = useRef<AgentMessage[]>(conversation);
  /** If DASHBOARD_AGENT_READY arrives before CREATE_SESSION_RES, we apply it when sessionId is set. */
  const pendingReadyRef = useRef<{
    sessionId: string;
    ready: boolean;
    subAgentsCount?: number;
    toolsCount?: number;
    skillsCount?: number;
  } | null>(null);

  sessionIdRef.current = sessionId;
  persistedSessionId = sessionId;
  persistedAgentReady = agentReady;
  dispatchRef.current = dispatch;
  conversationRef.current = conversation;

  const hasElectron = typeof window !== "undefined" && window?.electron != null;

  /** Fire-and-forget: save a single message to the SQLite chat history. */
  const saveMessageToDB = useCallback(
    (msg: AgentMessage) => {
      if (!hasElectron) return;
      window?.electron?.send(MESSAGE.CHAT_HISTORY_SAVE_MESSAGE, {
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || Date.now(),
      });
    },
    [hasElectron],
  );

  // Load conversation history from SQLite on first mount only.
  // This replaces the old redux-persist rehydration.
  useEffect(() => {
    if (!hasElectron) return;

    const handleLoad = (_event: any, payload: any) => {
      const { data } = payload || {};
      if (Array.isArray(data) && data.length > 0) {
        setConversation(data as AgentMessage[]);
      }
      window?.electron?.removeAllListeners(MESSAGE.CHAT_HISTORY_LOAD_RES);
    };

    window?.electron?.on(MESSAGE.CHAT_HISTORY_LOAD_RES, handleLoad);
    window?.electron?.send(MESSAGE.CHAT_HISTORY_LOAD, {});

    return () => {
      window?.electron?.removeAllListeners(MESSAGE.CHAT_HISTORY_LOAD_RES);
    };
  }, []); // Intentional: run once on mount

  useEffect(() => {
    if (!hasElectron) return;

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
        if (
          typeof pending.subAgentsCount === "number" &&
          typeof pending.toolsCount === "number" &&
          typeof pending.skillsCount === "number"
        ) {
          dispatchRef.current(
            actSaveAgentStats({
              subAgentsCount: pending.subAgentsCount,
              toolsCount: pending.toolsCount,
              skillsCount: pending.skillsCount,
            }),
          );
        }
      } else {
        setAgentReady(!!data?.agentReady);
        if (
          data?.agentReady &&
          typeof data?.subAgentsCount === "number" &&
          typeof data?.toolsCount === "number" &&
          typeof data?.skillsCount === "number"
        ) {
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
        setError(errMessage);
        setLoading(false);
        setStreamingContent("");
        streamingContentRef.current = "";
        setExecutingTool(null);
        toolDepthRef.current = 0;
        return;
      }

      const result = data || {};
      const normalizedSteps = normalizeSteps(result?.steps || []);

      // Append remaining streamed content as a final AI message
      // (earlier chunks were flushed on tool_start as separate messages)
      const remainingContent = streamingContentRef.current || "";
      if (remainingContent.trim()) {
        const assistantMessage: AgentMessage = {
          role: "ai",
          content: remainingContent,
          timestamp: Date.now(),
        };
        setConversation((prev) => [...prev, assistantMessage]);
        saveMessageToDB(assistantMessage);
      } else if (result?.isError) {
        // Top-level run error — show the error message directly
        const errorMessage: AgentMessage = {
          role: "ai",
          content: `Error: ${result.errorMsg || "An error occurred."}`,
          timestamp: Date.now(),
        };
        setConversation((prev) => [...prev, errorMessage]);
        saveMessageToDB(errorMessage);
      } else {
        // No streaming content — check if any steps failed and surface the error
        const failedStep = (result?.steps || []).find((s: any) => !s.success);
        if (failedStep) {
          const errorMessage: AgentMessage = {
            role: "ai",
            content: `Error: ${failedStep.result || "An error occurred while executing the task."}`,
            timestamp: Date.now(),
          };
          setConversation((prev) => [...prev, errorMessage]);
          saveMessageToDB(errorMessage);
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

    const handleDestroy = (_event: any, payload: any) => {
      const { error: errMessage } = payload || {};
      if (errMessage) {
        setError(errMessage);
        return;
      }
      setSessionId(null);
      setConversation([]);
      setSteps([]);
      setOutput("");
      setError(null);
      setStreamingContent("");
      setExecutingTool(null);
      toolDepthRef.current = 0;
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
      } = payload || {};
      if (payloadSessionId === sessionIdRef.current && toolName) {
        // Flush any accumulated streaming text as a completed message
        // so the tool execution indicator appears as a separate step
        if (streamingContentRef.current.trim()) {
          const partialMessage: AgentMessage = {
            role: "ai",
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
      }
    };

    const handleToolComplete = (_event: any, payload: any) => {
      const { sessionId: payloadSessionId, toolName } = payload || {};
      if (payloadSessionId === sessionIdRef.current) {
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
        if (
          payloadReady &&
          typeof subAgentsCount === "number" &&
          typeof toolsCount === "number" &&
          typeof skillsCount === "number"
        ) {
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
          subAgentsCount,
          toolsCount,
          skillsCount,
        };
      }
    };

    const handleStop = (_event: any, payload: any) => {
      const { error: errMessage } = payload || {};
      if (errMessage) {
        setError(errMessage);
      }
      // RUN_RES handler will take care of resetting loading/streaming state
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
    window?.electron?.on(
      MESSAGE.DASHBOARD_AGENT_DESTROY_SESSION_RES,
      handleDestroy,
    );
    window?.electron?.on(MESSAGE.DASHBOARD_AGENT_READY, handleAgentReady);
    window?.electron?.on(
      MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER_RES,
      handleChangeProvider,
    );
    window?.electron?.on(MESSAGE.DASHBOARD_AGENT_STOP_RES, handleStop);

    return () => {
      window?.electron?.removeAllListeners(
        MESSAGE.DASHBOARD_AGENT_CREATE_SESSION_RES,
      );
      window?.electron?.removeAllListeners(MESSAGE.DASHBOARD_AGENT_RUN_RES);
      window?.electron?.removeAllListeners(
        MESSAGE.DASHBOARD_AGENT_STREAM_CHUNK,
      );
      window?.electron?.removeAllListeners(MESSAGE.DASHBOARD_AGENT_TOOL_START);
      window?.electron?.removeAllListeners(
        MESSAGE.DASHBOARD_AGENT_TOOL_COMPLETE,
      );
      window?.electron?.removeAllListeners(
        MESSAGE.DASHBOARD_AGENT_RESET_SESSION_RES,
      );
      window?.electron?.removeAllListeners(
        MESSAGE.DASHBOARD_AGENT_DESTROY_SESSION_RES,
      );
      window?.electron?.removeAllListeners(MESSAGE.DASHBOARD_AGENT_READY);
      window?.electron?.removeAllListeners(
        MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER_RES,
      );
      window?.electron?.removeAllListeners(MESSAGE.DASHBOARD_AGENT_STOP_RES);
    };
  }, [hasElectron, saveMessageToDB]);

  // On mount: if we already have a sessionId but agentReady is false, query the main
  // process for the current agent status. This handles the case where DASHBOARD_AGENT_READY
  // fired while this component was unmounted (e.g., during a reset or provider change).
  useEffect(() => {
    if (!hasElectron || !sessionId || agentReady) return;

    const handleStatus = (_event: any, payload: any) => {
      const { data } = payload || {};
      if (data?.sessionId !== sessionIdRef.current) return;
      if (!data?.ready) return;
      setAgentReady(true);
      if (
        typeof data?.subAgentsCount === "number" &&
        typeof data?.toolsCount === "number" &&
        typeof data?.skillsCount === "number"
      ) {
        dispatchRef.current(
          actSaveAgentStats({
            subAgentsCount: data.subAgentsCount,
            toolsCount: data.toolsCount,
            skillsCount: data.skillsCount,
          }),
        );
      }
    };

    window?.electron?.on(MESSAGE.DASHBOARD_AGENT_GET_STATUS_RES, handleStatus);
    window?.electron?.send(MESSAGE.DASHBOARD_AGENT_GET_STATUS, { sessionId });

    return () => {
      window?.electron?.removeAllListeners(
        MESSAGE.DASHBOARD_AGENT_GET_STATUS_RES,
      );
    };
  }, [hasElectron, sessionId, agentReady]);

  // Watch for provider changes from Redux and send IPC to reinit agent.
  // Keep conversation history visible (do not clear); only reset ready state and in-flight UI.
  const prevProviderRef = useRef(llmProvider);
  useEffect(() => {
    if (prevProviderRef.current === llmProvider) return;
    prevProviderRef.current = llmProvider;
    if (!sessionIdRef.current || !hasElectron) return;
    setAgentReady(false);
    setSteps([]);
    setOutput("");
    setError(null);
    window?.electron?.send(MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER, {
      sessionId: sessionIdRef.current,
      provider: llmProvider,
    });
  }, [llmProvider, hasElectron]);

  const createSession = useCallback(() => {
    if (!hasElectron) {
      setError("Agent requires the desktop app.");
      return;
    }
    setCreatingSession(true);
    setError(null);
    window?.electron?.send(MESSAGE.DASHBOARD_AGENT_CREATE_SESSION, {
      provider: llmProvider,
    });
  }, [hasElectron, llmProvider]);

  const sendMessage = useCallback(
    (input: string) => {
      if (!sessionIdRef.current) {
        setError("Agent session is not ready. Please try again in a moment.");
        return;
      }
      if (!input || input.trim().length === 0) {
        setError("Message must not be empty");
        return;
      }

      const userMessage: AgentMessage = {
        role: "human",
        content: input.trim(),
        timestamp: Date.now(),
      };
      setConversation((prev) => [...prev, userMessage]);

      // Persist the user message to SQLite immediately — before loading = true —
      // so it's never lost even if the app is closed while the agent is thinking.
      if (hasElectron) {
        window?.electron?.send(MESSAGE.CHAT_HISTORY_SAVE_MESSAGE, {
          role: userMessage.role,
          content: userMessage.content,
          timestamp: userMessage.timestamp,
        });
      }

      setLoading(true);
      setError(null);
      setStreamingContent("");
      streamingContentRef.current = "";
      setExecutingTool(null);
      toolDepthRef.current = 0;
      if (hasElectron) {
        window?.electron?.send(MESSAGE.DASHBOARD_AGENT_RUN, {
          sessionId: sessionIdRef.current,
          input,
        });
      }
    },
    [hasElectron],
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
    toolDepthRef.current = 0;
    // Clear SQLite history so the next session starts fresh
    if (hasElectron) {
      window?.electron?.send(MESSAGE.CHAT_HISTORY_CLEAR, {});
    }
    // Reset the agent's LangGraph thread on the backend
    if (hasElectron) {
      window?.electron?.send(MESSAGE.DASHBOARD_AGENT_RESET_SESSION, {
        sessionId: sessionIdRef.current,
      });
    }
  }, [hasElectron]);

  const changeProvider = useCallback(
    (provider: LLMProvider) => {
      dispatch(actSetLLMProvider(provider));
      if (!sessionIdRef.current || !hasElectron) return;
      setAgentReady(false);
      window?.electron?.send(MESSAGE.DASHBOARD_AGENT_CHANGE_PROVIDER, {
        sessionId: sessionIdRef.current,
        provider,
      });
    },
    [hasElectron, dispatch],
  );

  const stopAgent = useCallback(() => {
    if (!sessionIdRef.current || !hasElectron) return;
    window?.electron?.send(MESSAGE.DASHBOARD_AGENT_STOP, {
      sessionId: sessionIdRef.current,
    });
  }, [hasElectron]);

  const destroySession = useCallback(() => {
    if (!sessionIdRef.current) {
      return;
    }
    setError(null);
    if (hasElectron) {
      window?.electron?.send(MESSAGE.DASHBOARD_AGENT_DESTROY_SESSION, {
        sessionId: sessionIdRef.current,
      });
    }
  }, [hasElectron]);

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
    llmProvider,
    createSession,
    sendMessage,
    stopAgent,
    resetSession,
    destroySession,
    changeProvider,
    setError,
  };
};

export { useDashboardAgent };
