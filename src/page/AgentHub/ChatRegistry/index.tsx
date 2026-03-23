import { useState, useEffect, useRef, Fragment } from "react";
import { Button, Tabs, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { IAgentRegistry } from "@/electron/type";
import { agentRegistrySelector } from "@/redux/agentRegistry";
import { useTranslation } from "@/hook/useTranslation";
import { MESSAGE } from "@/electron/constant";
import ChatInput from "@/page/Agent/ChatAgent/ChatInput";
import MessageList from "@/page/Agent/ChatAgent/MessageList";
import { useIpcAction } from "@/hook";
import { useGetListAgentRegistryLog } from "@/hook/agentRegistry";
import HistoryTab from "./HistoryTab";
import MemoryTab from "./MemoryTab";
import { Wrapper } from "./style";

const TAB = {
  CHAT: "CHAT",
  HISTORY: "HISTORY",
  MEMORY: "MEMORY",
};

type Props = {
  agentRegistryId: number;
  onBack: () => void;
  selectedAgentRegistry?: IAgentRegistry | null;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

const ChatRegistry = (props: Props) => {
  const { agentRegistryId, onBack, selectedAgentRegistry } = props;
  const { translate } = useTranslation();

  const [activeTab, setActiveTab] = useState(TAB.CHAT);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeToolName, setActiveToolName] = useState<string | null>(null);
  const [encryptKey, setEncryptKey] = useState("");
  const streamingContentRef = useRef("");

  const { execute: createSession, loading: sessionLoading } = useIpcAction(
    MESSAGE.REGISTRY_AGENT_CREATE_SESSION,
    MESSAGE.REGISTRY_AGENT_CREATE_SESSION_RES,
    {
      onSuccess: (payload: any) => {
        if (payload?.data) {
          setSessionId(payload.data);
        }
      },
    },
  );

  const { execute: runAgent, loading: runLoading } = useIpcAction(
    MESSAGE.REGISTRY_AGENT_RUN,
    MESSAGE.REGISTRY_AGENT_RUN_RES,
    {
      onSuccess: (payload: any) => {
        setIsStreaming(false);
        setActiveToolName(null);
        const finalContent = streamingContentRef.current;
        if (finalContent) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: finalContent,
              timestamp: Date.now(),
            },
          ]);
          streamingContentRef.current = "";
          setStreamingContent("");
        }
      },
    },
  );

  const { execute: stopAgent } = useIpcAction(
    MESSAGE.REGISTRY_AGENT_STOP,
    MESSAGE.REGISTRY_AGENT_STOP_RES,
  );

  // Listen for stream chunks from main process
  useEffect(() => {
    const handler = (_event: any, data: any) => {
      if (data?.sessionId !== sessionId) {
        return;
      }
      streamingContentRef.current += data.chunk || "";
      setStreamingContent(streamingContentRef.current);
    };

    const toolStartHandler = (_event: any, data: any) => {
      if (data?.sessionId !== sessionId) {
        return;
      }
      const displayName = data.subagentType || data.toolName || "";
      setActiveToolName(displayName);
    };

    const toolCompleteHandler = (_event: any, data: any) => {
      if (data?.sessionId !== sessionId) {
        return;
      }
      setActiveToolName(null);
    };

    window?.electron?.on(MESSAGE.REGISTRY_AGENT_STREAM_CHUNK, handler);
    window?.electron?.on(MESSAGE.REGISTRY_AGENT_TOOL_START, toolStartHandler);
    window?.electron?.on(MESSAGE.REGISTRY_AGENT_TOOL_COMPLETE, toolCompleteHandler);

    return () => {
      window?.electron?.removeAllListeners(MESSAGE.REGISTRY_AGENT_STREAM_CHUNK);
      window?.electron?.removeAllListeners(MESSAGE.REGISTRY_AGENT_TOOL_START);
      window?.electron?.removeAllListeners(MESSAGE.REGISTRY_AGENT_TOOL_COMPLETE);
    };
  }, [sessionId]);

  useEffect(() => {
    createSession({ agentRegistryId });
  }, [agentRegistryId]);

  const onSendMessage = (input: string) => {
    if (!input.trim() || !sessionId || isStreaming) {
      return;
    }

    streamingContentRef.current = "";
    setStreamingContent("");
    setIsStreaming(true);

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: input,
        timestamp: Date.now(),
      },
    ]);

    runAgent({ sessionId, input, encryptKey: encryptKey || undefined });
  };

  const onStop = () => {
    if (sessionId) {
      stopAgent({ sessionId });
    }
    setIsStreaming(false);
    setActiveToolName(null);
  };

  return (
    <Wrapper>
      <div className="chat-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          className="btn-back"
        >
          {translate("back")}
        </Button>

        <div className="chat-agent-name">
          {selectedAgentRegistry?.name || `Agent #${agentRegistryId}`}
        </div>

        <Tabs
          size="small"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: TAB.CHAT, label: translate("agent.chat") },
            { key: TAB.HISTORY, label: translate("agent.history") },
            { key: TAB.MEMORY, label: translate("agent.memory") },
          ]}
          className="chat-tabs"
        />
      </div>

      <div className="chat-body">
        {activeTab === TAB.CHAT && (
          <Fragment>
            {sessionLoading && messages.length === 0 ? (
              <div className="loading-center">
                <Spin />
              </div>
            ) : (
              <Fragment>
                <MessageList
                  messages={messages}
                  streamingContent={isStreaming ? streamingContent : ""}
                  activeToolName={activeToolName}
                />
                <ChatInput
                  onSend={onSendMessage}
                  onStop={onStop}
                  isStreaming={isStreaming}
                  encryptKey={encryptKey}
                  setEncryptKey={setEncryptKey}
                />
              </Fragment>
            )}
          </Fragment>
        )}

        {activeTab === TAB.HISTORY && (
          <HistoryTab agentRegistryId={agentRegistryId} />
        )}

        {activeTab === TAB.MEMORY && (
          <MemoryTab agentRegistryId={agentRegistryId} />
        )}
      </div>
    </Wrapper>
  );
};

export default connect((state: RootState) => ({
  selectedAgentRegistry: agentRegistrySelector(state).selectedAgentRegistry,
}))(ChatRegistry);
