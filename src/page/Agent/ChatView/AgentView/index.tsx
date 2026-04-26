import { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { Select } from "antd";
import styled from "styled-components";
import { ChatPlatform } from "@/electron/chatGateway/types";
import { RootState } from "@/redux/store";
import {
  useDashboardAgent,
  useTranslation,
  useCheckModelCapability,
} from "@/hook";
import { IAgentProfile } from "@/electron/type";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import {
  actSetLayoutMode,
  actSaveSelectedAgentProfile,
  defaultAgentContext,
  IAgentContext,
} from "@/redux/agent";
import { getToolDisplayName } from "@/electron/constant";
import { ChatRole } from "@/electron/chatGateway/types";

import AgentChatView, {
  type DisplayMessage,
  type AttachedFile,
} from "@/component/AgentChatView";
import {
  sanitizeForDisplay,
  deriveLabel,
  deriveClassName,
  type ToolCallState,
} from "@/component/AgentChatView/util";

const OptionWrapper = styled.div`
  padding-bottom: 0.5rem;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    .name {
      color: var(--color-text-hover);
    }
  }

  .name {
    font-size: 1.3rem;
    font-weight: 500;
    transition: all 0.1s ease-in-out;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .description {
    font-size: 1rem;
    font-weight: 300;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const AgentView = (props: any) => {
  const {
    agentContextMap,
    selectedAgentProfile,
    encryptKey,
    layoutMode,
    listAgentProfile,
    onSearchProfile,
    isProfileSearchLoading,
  } = props;
  const selectedAgentProfileId = selectedAgentProfile?.id || null;
  const {
    tokenAddress,
    nodeEndpointGroupId,
    campaignId,
    listProfileId,
    isAllWallet,
    chainKey,
  } =
    (selectedAgentProfileId ? agentContextMap[selectedAgentProfileId] : null) ||
    (defaultAgentContext as IAgentContext);
  const { translate } = useTranslation();
  const { checkModelCapability, modelCapability } = useCheckModelCapability();
  const [visionWarning, setVisionWarning] = useState<string | null>(null);
  const {
    sessionId,
    conversation,
    loading,
    creatingSession,
    agentReady,
    error,
    streamingContent,
    executingTool,
    toolCallStates,
    planReview,
    turnUsage,
    llmProvider,
    createSession,
    sendMessage,
    stopAgent,
    resetSession,
    approvePlan,
    setError,
  } = useDashboardAgent(selectedAgentProfileId);

  useEffect(() => {
    if (!sessionId && !creatingSession) {
      createSession();
    }
  }, [sessionId, creatingSession, createSession]);

  const modelName = useMemo(
    () => selectedAgentProfile?.llmModel || DEFAULT_LLM_MODELS[llmProvider],
    [selectedAgentProfile?.llmModel, llmProvider],
  );

  useEffect(() => {
    checkModelCapability(modelName, llmProvider);
  }, [modelName, llmProvider]);

  const displayedMessages: DisplayMessage[] = useMemo(() => {
    const mapped: DisplayMessage[] = (conversation || [])
      .filter((msg) => !(msg?.role || "").toLowerCase().includes(ChatRole.TOOL))
      .map((msg) => {
        const isUserMessage =
          (msg?.role || "").toLowerCase() === ChatRole.HUMAN;
        const { text: content } = sanitizeForDisplay(
          msg?.content || "",
          isUserMessage,
        );
        const msgWithRaw = msg as typeof msg & {
          raw?: {
            additional_kwargs?: { timestamp?: number };
            timestamp?: number;
          };
        };
        const timestampValue =
          msgWithRaw?.raw?.additional_kwargs?.timestamp ||
          msgWithRaw?.raw?.timestamp;
        const timestamp = isNaN(Number(timestampValue))
          ? new Date()
          : new Date(Number(timestampValue));

        const msgWithToolCalls = msg as typeof msg & {
          toolCalls?: ToolCallState[];
        };

        return {
          role: msg?.role || "assistant",
          label: deriveLabel(msg?.role, translate),
          content,
          className: deriveClassName(msg?.role),
          timestamp,
          toolCalls: msgWithToolCalls?.toolCalls,
        };
      });

    if (loading || streamingContent || executingTool) {
      const { text: content } = sanitizeForDisplay(
        streamingContent || "",
        false,
      );
      const isLoading = !content && loading;
      const executingToolText = executingTool
        ? translate("agent.executingTool").replace(
            "{tool}",
            getToolDisplayName(executingTool),
          )
        : undefined;

      mapped.push({
        role: "assistant",
        label: translate("agent.messageLabelKeeper"),
        content,
        className: "message assistant streaming",
        isLoading,
        isAgentProcessing: loading,
        timestamp: new Date(),
        executingToolText,
        toolCalls: toolCallStates.length > 0 ? toolCallStates : undefined,
      });
    }

    if (mapped.length === 0) {
      mapped.push({
        role: "assistant",
        label: translate("agent.messageLabelKeeper"),
        content: translate("agent.placeholderMessage"),
        className: "message assistant",
        isLoading: false,
        timestamp: new Date(),
      });
    }

    if (planReview) {
      mapped.push({
        role: "plan-review",
        label: "",
        content: "",
        className: "message",
        planReview,
      });
    }

    return mapped;
  }, [
    conversation,
    loading,
    streamingContent,
    executingTool,
    toolCallStates,
    sessionId,
    agentReady,
    creatingSession,
    planReview,
    translate,
  ]);

  const onSend = (draft: string, attachedFiles: AttachedFile[]) => {
    const hasImages = attachedFiles.some(
      (fileItem) => fileItem.type === "image",
    );
    if (hasImages && modelCapability && !modelCapability?.supportsVision) {
      setVisionWarning(
        translate("agent.modelDoesNotSupportVision").replace(
          "{model}",
          modelName,
        ),
      );
    } else {
      setVisionWarning(null);
    }

    const context = {
      platformId: ChatPlatform.KEEPER,
      currentDate: new Date().toLocaleString("sv"),
      chainKey,
      tokenAddress,
      nodeEndpointGroupId,
      campaignId,
      listCampaignProfileId: listProfileId,
      isAllWallet,
      attachedFiles: attachedFiles.map((fileItem) => ({
        name: fileItem?.name,
        filePath: fileItem?.path,
        type: fileItem?.type,
        extension: fileItem?.extension,
      })),
    };
    const contextHeader =
      "CURRENT CONTEXT (use these values — ignore any older context from previous messages. For agent use only — keep raw IDs private and do not surface campaignId, nodeEndpointGroupId, or profile IDs in user-facing replies):";
    const messageWithContext = `${draft}\n\n${contextHeader}\n${JSON.stringify(context)}`;
    sendMessage(messageWithContext, { encryptKey, displayText: draft });
  };

  const onSelectProfile = (profileId: number) => {
    const profile =
      (listAgentProfile || []).find(
        (item: IAgentProfile) => item.id === profileId,
      ) || null;
    props.actSaveSelectedAgentProfile(profile);
  };

  const agentProfilePicker = (
    <Select
      size="medium"
      value={selectedAgentProfileId || null}
      onChange={onSelectProfile}
      options={listAgentProfile?.map((profile: IAgentProfile) => ({
        value: profile.id,
        label: profile.name,
        description: profile.description,
      }))}
      style={{ width: 170, marginRight: 8 }}
      className="custom-select"
      showSearch
      onSearch={onSearchProfile}
      filterOption={false}
      loading={isProfileSearchLoading}
      optionRender={(option) => (
        <OptionWrapper>
          <div className="name">{option.label}</div>
          {option.data.description && (
            <div className="description">{option.data.description}</div>
          )}
        </OptionWrapper>
      )}
    />
  );

  const hasPlanReview = displayedMessages.some((msg) => !!msg.planReview);

  return (
    <AgentChatView
      messages={displayedMessages}
      loading={loading}
      error={error}
      warning={visionWarning}
      turnUsage={turnUsage}
      composerDisabled={
        creatingSession || (Boolean(sessionId) && !agentReady) || hasPlanReview
      }
      showPreparingStatus={creatingSession || (!!sessionId && !agentReady)}
      canReset={conversation.length > 0}
      onSend={onSend}
      onStop={stopAgent}
      onReset={resetSession}
      onErrorClose={() => setError(null)}
      onApprovePlan={approvePlan}
      showLayoutOption
      layoutMode={layoutMode}
      onSetLayoutMode={props?.actSetLayoutMode}
      extraActions={agentProfilePicker}
    />
  );
};

export default connect(
  (state: RootState) => ({
    agentContextMap: state?.Agent?.agentContextMap || {},
    selectedAgentProfile: state?.Agent?.selectedAgentProfile || null,
    layoutMode: state?.Agent?.layoutMode,
    listAgentProfile: state?.AgentProfile?.listAgentProfile || [],
  }),
  { actSetLayoutMode, actSaveSelectedAgentProfile },
)(AgentView);
