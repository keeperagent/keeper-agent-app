import { useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { ChatPlatform } from "@/electron/chatGateway/types";
import { RootState } from "@/redux/store";
import {
  useDashboardAgent,
  useTranslation,
  useCheckModelCapability,
} from "@/hook";
import { LLMProvider } from "@/electron/type";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { preferenceSelector } from "@/redux/preference";
import { actSetLayoutMode } from "@/redux/agent";
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
} from "@/component/AgentChatView/util";

const AgentView = (props: any) => {
  const {
    tokenAddress,
    nodeEndpointGroupId,
    campaignId,
    listProfileId,
    isAllWallet,
    encryptKey,
    chainKey,
    layoutMode,
    preference,
  } = props;
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
    planReview,
    llmProvider,
    createSession,
    sendMessage,
    stopAgent,
    resetSession,
    approvePlan,
    setError,
  } = useDashboardAgent();

  useEffect(() => {
    if (!sessionId && !creatingSession) {
      createSession();
    }
  }, [sessionId, creatingSession, createSession]);

  const modelName = useMemo(() => {
    const preferenceByProvider: Record<LLMProvider, string> = {
      [LLMProvider.OPENAI]:
        preference?.openAIModel || DEFAULT_LLM_MODELS[LLMProvider.OPENAI],
      [LLMProvider.CLAUDE]:
        preference?.anthropicModel || DEFAULT_LLM_MODELS[LLMProvider.CLAUDE],
      [LLMProvider.GEMINI]:
        preference?.googleGeminiModel || DEFAULT_LLM_MODELS[LLMProvider.GEMINI],
    };
    return preferenceByProvider[llmProvider];
  }, [
    llmProvider,
    preference?.openAIModel,
    preference?.anthropicModel,
    preference?.googleGeminiModel,
  ]);

  useEffect(() => {
    checkModelCapability(modelName, llmProvider);
  }, [modelName, llmProvider]);

  const displayedMessages: DisplayMessage[] = useMemo(() => {
    const mapped: DisplayMessage[] = (conversation || [])
      .filter((msg) => !(msg?.role || "").toLowerCase().includes(ChatRole.TOOL))
      .map((msg) => {
        const { text: content } = sanitizeForDisplay(msg?.content || "", true);
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

        return {
          role: msg?.role || "assistant",
          label: deriveLabel(msg?.role, translate),
          content,
          className: deriveClassName(msg?.role),
          timestamp,
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
        timestamp: new Date(),
        executingToolText,
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

  const hasPlanReview = displayedMessages.some((msg) => !!msg.planReview);

  return (
    <AgentChatView
      messages={displayedMessages}
      loading={loading}
      error={error}
      warning={visionWarning}
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
    />
  );
};

export default connect(
  (state: RootState) => ({
    tokenAddress: state?.Agent?.tokenAddress,
    nodeEndpointGroupId: state?.Agent?.nodeEndpointGroupId,
    campaignId: state?.Agent?.campaignId,
    listProfileId: state?.Agent?.listProfileId,
    isAllWallet: state?.Agent?.isAllWallet,
    chainKey: state?.Agent?.chainKey,
    layoutMode: state?.Agent?.layoutMode,
    preference: preferenceSelector(state)?.preference,
  }),
  { actSetLayoutMode },
)(AgentView);
