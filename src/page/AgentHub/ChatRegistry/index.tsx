import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { Button, Tabs, Spin } from "antd";
import { BackIcon } from "@/component/Icon";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { IAgentRegistry, ICampaign } from "@/electron/type";
import { agentRegistrySelector } from "@/redux/agentRegistry";
import { useTranslation } from "@/hook/useTranslation";
import { MESSAGE, getToolDisplayName } from "@/electron/constant";
import { LLM_PROVIDERS } from "@/config/llmProviders";
import { listChainConfig } from "@/page/Agent/ChatAgent/WalletView/config";
import { useIpcAction } from "@/hook";
import AgentChatView, {
  type DisplayMessage,
  type AttachedFile,
} from "@/component/AgentChatView";
import { deriveLabel, deriveClassName } from "@/component/AgentChatView/util";
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

  const displayedMessages: DisplayMessage[] = useMemo(() => {
    const result: DisplayMessage[] = messages.map((msg) => ({
      role: msg.role === "user" ? "human" : "assistant",
      label: deriveLabel(msg.role, translate),
      content: msg.content,
      className: deriveClassName(msg.role),
      timestamp: new Date(msg.timestamp),
    }));

    if (isStreaming || streamingContent) {
      result.push({
        role: "assistant",
        label: translate("agent.messageLabelKeeper"),
        content: streamingContent,
        className: "message assistant streaming",
        isLoading: !streamingContent && isStreaming,
        timestamp: new Date(),
        executingToolText: activeToolName
          ? translate("agent.executingTool").replace(
              "{tool}",
              getToolDisplayName(activeToolName),
            )
          : undefined,
      });
    }

    return result;
  }, [messages, isStreaming, streamingContent, activeToolName, translate]);

  const onSend = (draft: string, attachedFiles: AttachedFile[]) => {
    if (!sessionId || isStreaming) {
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
        content: draft,
        timestamp: Date.now(),
      },
    ]);

    runAgent({
      sessionId,
      input: draft,
      attachedFiles: attachedFiles.map((fileItem) => ({
        name: fileItem?.name,
        filePath: fileItem?.path,
        type: fileItem?.type,
        extension: fileItem?.extension,
      })),
    });
  };

  const onResetConversation = () => {
    setMessages([]);
    setStreamingContent("");
    setIsStreaming(false);
    setActiveToolName(null);
    streamingContentRef.current = "";
    createSession({ agentRegistryId });
  };

  const onStop = () => {
    if (sessionId) {
      stopAgent({ sessionId });
    }
    setIsStreaming(false);
    setActiveToolName(null);
  };

  const agentName = selectedAgentRegistry?.name || `Agent #${agentRegistryId}`;

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
            {sessionLoading && messages.length === 0 ? (
              <div className="loading-center">
                <Spin />
              </div>
            ) : (
              <div className="chat-content">
                <AgentChatView
                  messages={displayedMessages}
                  loading={isStreaming}
                  composerDisabled={sessionLoading || !sessionId}
                  canReset={messages.length > 0}
                  onSend={onSend}
                  onStop={onStop}
                  onReset={onResetConversation}
                  emptyState={
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
                  }
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
