import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { Button, Tabs, Spin } from "antd";
import { BackIcon } from "@/component/Icon";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { IAgentRegistry, ICampaign } from "@/electron/type";
import { agentRegistrySelector } from "@/redux/agentRegistry";
import { useTranslation } from "@/hook/useTranslation";
import { MESSAGE } from "@/electron/constant";
import { LLM_PROVIDERS } from "@/config/llmProviders";
import { listChainConfig } from "@/page/Agent/ChatAgent/WalletView/config";
import ChatInput from "@/page/Agent/ChatAgent/ChatInput";
import MessageList from "@/page/Agent/ChatAgent/MessageList";
import { useIpcAction } from "@/hook";
import HistoryTab from "./HistoryTab";
import MemoryTab from "./MemoryTab";
import { Wrapper, ContextChip } from "./style";

const TAB = {
  CHAT: "CHAT",
  HISTORY: "HISTORY",
  MEMORY: "MEMORY",
};

type Props = {
  agentRegistryId: number;
  onBack: () => void;
  selectedAgentRegistry?: IAgentRegistry | null;
  listCampaign?: ICampaign[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

const ChatRegistry = (props: Props) => {
  const { agentRegistryId, onBack, selectedAgentRegistry, listCampaign } =
    props;
  const { translate } = useTranslation();

  const [activeTab, setActiveTab] = useState(TAB.CHAT);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeToolName, setActiveToolName] = useState<string | null>(null);
  const streamingContentRef = useRef("");

  const provider = LLM_PROVIDERS.find(
    (item) => item.key === selectedAgentRegistry?.llmProvider,
  );
  const providerIcon = provider?.icon;
  const providerLabel = provider?.label;
  const modelLabel = selectedAgentRegistry?.llmModel;

  const chainConfig = useMemo(() => {
    if (!selectedAgentRegistry?.chainKey) {
      return null;
    }
    return (
      listChainConfig.find(
        (config) => config.dexscreenerKey === selectedAgentRegistry.chainKey,
      ) || null
    );
  }, [selectedAgentRegistry?.chainKey]);

  const campaign = useMemo(() => {
    if (!selectedAgentRegistry?.campaignId) {
      return null;
    }
    return (
      (listCampaign || []).find(
        (item) => item.id === selectedAgentRegistry.campaignId,
      ) || null
    );
  }, [listCampaign, selectedAgentRegistry?.campaignId]);

  const walletLabel = useMemo(() => {
    if (!selectedAgentRegistry?.campaignId) {
      return null;
    }

    if (selectedAgentRegistry?.isAllWallet !== false) {
      return translate("agent.allWallet");
    }

    const profileCount = (selectedAgentRegistry?.profileIds || []).length;
    return `${profileCount} ${translate("agent.wallets")}`;
  }, [selectedAgentRegistry]);

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

  const { execute: runAgent } = useIpcAction(
    MESSAGE.REGISTRY_AGENT_RUN,
    MESSAGE.REGISTRY_AGENT_RUN_RES,
    {
      onSuccess: (_payload: any) => {
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
    window?.electron?.on(
      MESSAGE.REGISTRY_AGENT_TOOL_COMPLETE,
      toolCompleteHandler,
    );

    return () => {
      window?.electron?.removeAllListeners(MESSAGE.REGISTRY_AGENT_STREAM_CHUNK);
      window?.electron?.removeAllListeners(MESSAGE.REGISTRY_AGENT_TOOL_START);
      window?.electron?.removeAllListeners(
        MESSAGE.REGISTRY_AGENT_TOOL_COMPLETE,
      );
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

    runAgent({ sessionId, input });
  };

  const onStop = () => {
    if (sessionId) {
      stopAgent({ sessionId });
    }
    setIsStreaming(false);
    setActiveToolName(null);
  };

  const agentName = selectedAgentRegistry?.name || `Agent #${agentRegistryId}`;
  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <Wrapper>
      <div className="chat-header">
        <div className="chat-header-top">
          <Button type="text" onClick={onBack} className="btn-back">
            <span className="btn-back-icon">
              <BackIcon />
            </span>
            {translate("back")}
          </Button>

          {chainConfig && (
            <img
              className="chain-logo"
              src={chainConfig.logo}
              alt={chainConfig.chainName}
            />
          )}

          <div className="chat-agent-info">
            <span className="chat-agent-name">{agentName}</span>
            {selectedAgentRegistry?.description && (
              <span className="chat-agent-desc">
                {selectedAgentRegistry.description}
              </span>
            )}
          </div>

          {providerLabel && (
            <ContextChip>
              {providerIcon && <img src={providerIcon} alt={providerLabel} />}
              <div className="chip-lines">
                <span className="chip-label">{providerLabel}</span>
                {modelLabel && <span className="chip-value">{modelLabel}</span>}
              </div>
            </ContextChip>
          )}

          {campaign && (
            <ContextChip>
              <div className="chip-lines">
                <span className="chip-label">
                  {translate("sidebar.campaign")}
                </span>
                <span className="chip-value">{campaign.name}</span>
              </div>
            </ContextChip>
          )}

          {walletLabel && (
            <ContextChip>
              <div className="chip-lines">
                <span className="chip-label">
                  {translate("agent.walletProfiles")}
                </span>
                <span className="chip-value">{walletLabel}</span>
              </div>
            </ContextChip>
          )}
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
            {sessionLoading && isEmpty ? (
              <div className="loading-center">
                <Spin />
              </div>
            ) : (
              <div className="chat-content">
                {isEmpty ? (
                  <div className="chat-empty-state">
                    <div className="empty-icon">
                      {providerIcon && (
                        <img src={providerIcon} alt={providerLabel} />
                      )}
                    </div>

                    <span className="empty-name">{agentName}</span>
                    <span className="empty-hint">
                      {translate("agent.chatEmptyHint")}
                    </span>
                  </div>
                ) : (
                  <MessageList
                    messages={messages}
                    streamingContent={isStreaming ? streamingContent : ""}
                    activeToolName={activeToolName}
                  />
                )}
                <ChatInput
                  onSend={onSendMessage}
                  onStop={onStop}
                  isStreaming={isStreaming}
                />
              </div>
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
  listCampaign: state?.Campaign?.listCampaign || [],
}))(ChatRegistry);
