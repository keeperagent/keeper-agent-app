import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { guard } from "@keeperagent/crypto-key-guard";
import { MESSAGE, getToolDisplayName } from "@/electron/constant";
import { ChatPlatform } from "@/electron/chatGateway/types";
import { connect } from "react-redux";
import { Alert, Button, Input, message, Tooltip } from "antd";
import copy from "copy-to-clipboard";
import { RootState } from "@/redux/store";
import {
  useDashboardAgent,
  useTranslation,
  useSaveClipboardImage,
} from "@/hook";
import {
  AgentViewWrapper,
  DropOverlay,
  LoadingDotsWrapper,
  PaperPlaneAnimation,
  ExecutingToolBadge,
  ComposerStatus,
  SecretWarning,
  ToolSpacerDiv,
  SendButtonWrapper,
} from "./style";
import {
  CopyIcon,
  CheckIcon,
  ChartIcon,
  PaperPlaneIcon,
  StopCircle,
  PaperClipIcon,
  CommentIcon,
} from "@/component/Icon";
import AttachedFiles, { type AttachedFile } from "./AttachedFiles";
import { actSetLayoutMode, AGENT_LAYOUT_MODE } from "@/redux/agent";
import {
  deriveClassName,
  deriveLabel,
  fileInfoToAttached,
  fileToAttached,
  sanitizeForDisplay,
  type DisplayMessage,
} from "./util";

const { TextArea } = Input;

const LoadingDots = () => (
  <LoadingDotsWrapper>
    <span></span>
    <span></span>
    <span></span>
  </LoadingDotsWrapper>
);

const CopyButton = ({
  content,
  index,
  copiedIndex,
  onCopy,
}: {
  content: string;
  index: number;
  copiedIndex: number | null;
  onCopy: (content: string, index: number) => void;
}) => (
  <div
    className={`${copiedIndex === index ? "copied" : ""} copy-icon`}
    onClick={() => onCopy(content, index)}
  >
    {copiedIndex === index ? <CheckIcon /> : <CopyIcon />}
  </div>
);

const markdownComponents = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (href) {
          window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, { url: href });
        }
      }}
    >
      {children}
    </a>
  ),
};

/** Renders message content as plain text or Markdown (assistant/tool get formatted like Claude). */
const MessageBody = ({
  content,
  isUser,
}: {
  content: string;
  isUser: boolean;
}) => {
  if (isUser) {
    return <Fragment>{content}</Fragment>;
  }
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

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
  } = props;
  const { translate } = useTranslation();
  const { saveClipboardImage } = useSaveClipboardImage();
  const {
    sessionId,
    conversation,
    loading,
    creatingSession,
    agentReady,
    error,
    streamingContent,
    executingTool,
    createSession,
    sendMessage,
    stopAgent,
    resetSession,
    setError,
  } = useDashboardAgent();

  const [draftMessage, setDraftMessage] = useState("");
  const attachedFilesRef = useRef<AttachedFile[]>([]);
  const tempFilesToDeleteRef = useRef<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOverAgent, setIsDragOverAgent] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(
    null,
  );
  const [secretWarning, setSecretWarning] = useState(false);
  const secretWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [showPaperPlane, setShowPaperPlane] = useState(false);
  const [paperPlanePosition, setPaperPlanePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const sendButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const prevConversationLenRef = useRef<number>(0);
  const conversationClearedRef = useRef(false);

  const onCopyMessage = (content: string, index: number) => {
    copy(content);
    message.success(translate("copied"));
    setCopiedMessageIndex(index);
    setTimeout(() => {
      setCopiedMessageIndex(null);
    }, 1500);
  };

  const deleteTempFile = (filePath: string) => {
    if (typeof window !== "undefined" && window?.electron) {
      window.electron.send(MESSAGE.DELETE_TEMP_FILE, { path: filePath });
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    if (!items) {
      return;
    }

    for (const item of Array.from(items)) {
      if (!item.type.startsWith("image/")) {
        continue;
      }

      const file = item.getAsFile();
      if (!file) {
        continue;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        const mimeType = item.type;
        const attached = await saveClipboardImage(base64, mimeType, dataUrl);
        if (attached) {
          setAttachedFiles((prev) => [...prev, attached]);
        }
      };
      reader.readAsDataURL(file);
      break;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const next = Array.from(files).map(fileToAttached);
    setAttachedFiles((prev) => [...prev, ...next]);
    event.target.value = "";
  };

  const handleAddFilesClick = () => {
    if (typeof window !== "undefined" && window.electron) {
      window.electron.send(MESSAGE.CHOOSE_FILE, {
        multiple: true,
        filters: [
          { name: "All Files", extensions: ["*"] },
          {
            name: "Images",
            extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"],
          },
          { name: "Documents", extensions: ["pdf", "txt", "md"] },
        ],
      });
      const handleRes = (
        _e: unknown,
        data: {
          data: Array<{ path: string; name: string; extension: string }> | null;
        },
      ) => {
        window?.electron?.removeAllListeners(MESSAGE.CHOOSE_FILE_RES);
        const list = data?.data || [];
        if (list.length) {
          const newFiles = list.map(fileInfoToAttached);
          setAttachedFiles((prev) => [...prev, ...newFiles]);
          const imagePaths = newFiles
            .filter((f) => f.type === "image")
            .map((f) => f.path);
          if (imagePaths.length && window.electron) {
            let pending = imagePaths.length;
            const onDataUrl = (
              _ev: unknown,
              res: { path: string; dataUrl: string | null },
            ) => {
              if (res.dataUrl) {
                setAttachedFiles((prev) =>
                  prev.map((file) =>
                    file.path === res.path
                      ? { ...file, previewUrl: res.dataUrl! }
                      : file,
                  ),
                );
              }
              pending -= 1;
              if (pending <= 0)
                window?.electron?.removeAllListeners(
                  MESSAGE.READ_FILE_AS_DATA_URL_RES,
                );
            };
            window.electron.on(MESSAGE.READ_FILE_AS_DATA_URL_RES, onDataUrl);
            imagePaths.forEach((p) =>
              window.electron.send(MESSAGE.READ_FILE_AS_DATA_URL, { path: p }),
            );
          }
        }
      };
      window.electron.on(MESSAGE.CHOOSE_FILE_RES, handleRes);
      return;
    }
    fileInputRef.current?.click();
  };

  const onAgentViewDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOverAgent(true);
  };

  const onAgentViewDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverAgent(false);
    }
  };

  const onAgentViewDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverAgent(false);
    const files = e.dataTransfer.files;
    if (!files?.length) {
      return;
    }
    const next = Array.from(files).map(fileToAttached);
    setAttachedFiles((prev) => [...prev, ...next]);
  };

  const cleanupFile = (fileItem: AttachedFile) => {
    if (fileItem?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(fileItem.previewUrl);
    }
    if (fileItem?.isTemp) {
      deleteTempFile(fileItem.path);
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => {
      const removed = prev[index];
      if (removed) {
        cleanupFile(removed);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAttachedFiles = () => {
    setAttachedFiles((prev) => {
      prev.forEach((fileItem) => {
        if (fileItem?.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(fileItem.previewUrl);
        }
        if (fileItem?.isTemp) {
          tempFilesToDeleteRef.current.push(fileItem.path);
        }
      });
      return [];
    });
  };

  useEffect(() => {
    if (!loading) {
      tempFilesToDeleteRef.current.forEach(deleteTempFile);
      tempFilesToDeleteRef.current = [];
    }
  }, [loading]);

  useEffect(() => {
    return () => {
      attachedFilesRef.current.forEach(cleanupFile);
      tempFilesToDeleteRef.current.forEach(deleteTempFile);
      tempFilesToDeleteRef.current = [];
      if (secretWarningTimerRef.current) {
        clearTimeout(secretWarningTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    attachedFilesRef.current = attachedFiles;
  }, [attachedFiles]);

  useEffect(() => {
    if (!sessionId && !creatingSession) {
      createSession();
    }
  }, [sessionId, creatingSession, createSession]);

  useEffect(() => {
    const currentLen = conversation?.length || 0;

    // Detect conversation cleared (e.g. provider switch)
    if (currentLen === 0 && prevConversationLenRef.current > 0) {
      conversationClearedRef.current = true;
    }

    if (currentLen > prevConversationLenRef.current) {
      if (conversationClearedRef.current) {
        // Restored after clear — jump to bottom instantly (no visible animation)
        conversationEndRef.current?.scrollIntoView({ block: "end" });
      } else {
        // New message added — smooth scroll
        conversationEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
      conversationClearedRef.current = false;
    } else if (loading || streamingContent || executingTool) {
      // Use instant during streaming to avoid competing smooth animations
      conversationEndRef.current?.scrollIntoView({
        behavior: "instant",
        block: "end",
      });
    }

    prevConversationLenRef.current = currentLen;
  }, [conversation, loading, streamingContent, executingTool]);

  const displayedConversation: DisplayMessage[] = useMemo(() => {
    const mapped: DisplayMessage[] = (conversation || [])
      // Hide tool output from user-facing chat
      .filter(
        (message) => !(message?.role || "").toLowerCase().includes("tool"),
      )
      .map((message) => {
        // Layer 4: safety-net redaction — strip context block and mask any secrets
        const { text: content } = sanitizeForDisplay(
          message?.content || "",
          true,
        );
        const msgWithRaw = message as typeof message & {
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
          role: message?.role || "assistant",
          label: deriveLabel(message?.role, translate),
          content,
          className: deriveClassName(message?.role),
          timestamp,
        };
      });

    // Add streaming content or loading indicator
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

    // Show placeholder message when conversation is empty (preparing state is shown in composer status)
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

    return mapped;
  }, [
    conversation,
    loading,
    streamingContent,
    executingTool,
    sessionId,
    agentReady,
    creatingSession,
    translate,
  ]);

  const onSendMessage = () => {
    const trimmed = draftMessage.trim();
    if (!trimmed) {
      setError("agent.emptyMessageError");
      return;
    }

    // Layer 1: warn user when their message contains crypto secrets
    const secretCheck = guard(trimmed);
    if (secretCheck.detected) {
      setSecretWarning(true);
      if (secretWarningTimerRef.current) {
        clearTimeout(secretWarningTimerRef.current);
      }
      secretWarningTimerRef.current = setTimeout(() => {
        setSecretWarning(false);
        secretWarningTimerRef.current = null;
      }, 6000);
    }

    // Trigger paper plane animation
    if (sendButtonRef.current) {
      const rect = sendButtonRef.current.getBoundingClientRect();
      setPaperPlanePosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setShowPaperPlane(true);
      setTimeout(() => {
        setShowPaperPlane(false);
        setPaperPlanePosition(null);
      }, 2000); // Animation duration
    }

    const context = {
      platformId: ChatPlatform.KEEPER,
      chainKey,
      tokenAddress,
      nodeEndpointGroupId,
      campaignId,
      listCampaignProfileId: listProfileId,
      isAllWallet,
      attachedFiles: attachedFiles.map((file) => ({
        name: file?.name,
        filePath: file?.path,
        type: file?.type,
        extension: file?.extension,
      })),
    };
    const contextHeader =
      "CURRENT CONTEXT (use these values — ignore any older context from previous messages. For agent use only — keep raw IDs private and do not surface campaignId, nodeEndpointGroupId, or profile IDs in user-facing replies):";
    const messageWithContext = `${trimmed}\n\n${contextHeader}\n${JSON.stringify(
      context,
    )}`;

    sendMessage(messageWithContext, { encryptKey, displayText: trimmed });
    setDraftMessage("");
    clearAttachedFiles();
  };

  const onResetConversation = () => {
    resetSession();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSendMessage();
    }
  };

  return (
    <AgentViewWrapper
      onDragOver={onAgentViewDragOver}
      onDragLeave={onAgentViewDragLeave}
      onDrop={onAgentViewDrop}
    >
      {isDragOverAgent && (
        <DropOverlay>{translate("agent.dropFilesHere")}</DropOverlay>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.md"
        className="hidden-file-input"
        onChange={handleFileSelect}
      />

      {error && (
        <Alert
          type="error"
          title={error}
          showIcon
          closable={{ onClose: () => setError(null) }}
          className="error-alert"
        />
      )}

      <div className="conversation">
        {displayedConversation.map((message, index) => {
          const isUser = message.role === "human" || message.role === "user";
          const timestamp = message.timestamp
            ? message.timestamp.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
            : "";

          return (
            <div key={`${message.role}-${index}`} className={message.className}>
              <div className="message-content">
                {isUser ? (
                  <Fragment>
                    <div className="message-bubble-wrapper">
                      <div className="bubble">
                        <MessageBody content={message.content} isUser={true} />
                        {message.isLoading && <LoadingDots />}
                      </div>

                      {(timestamp || !message.isLoading) && (
                        <div className="message-footer">
                          {timestamp && (
                            <div className="timestamp">{timestamp}</div>
                          )}
                          {!message.isLoading && (
                            <CopyButton
                              content={message.content}
                              index={index}
                              copiedIndex={copiedMessageIndex}
                              onCopy={onCopyMessage}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </Fragment>
                ) : (
                  <Fragment>
                    <div className="message-bubble-wrapper">
                      <div className="bubble">
                        <MessageBody content={message.content} isUser={false} />
                        {message.executingToolText && (
                          <ToolSpacerDiv hasContent={!!message.content}>
                            <ExecutingToolBadge>
                              <span className="spinner" />
                              {message.executingToolText}
                            </ExecutingToolBadge>
                          </ToolSpacerDiv>
                        )}
                        {message.isLoading && !message.executingToolText && (
                          <ToolSpacerDiv hasContent={!!message.content}>
                            <ExecutingToolBadge>
                              <span className="spinner" />
                              {translate("agent.thinking")}
                            </ExecutingToolBadge>
                          </ToolSpacerDiv>
                        )}
                      </div>

                      {(timestamp || !message.isLoading) && (
                        <div className="message-footer">
                          {timestamp && (
                            <div className="timestamp">{timestamp}</div>
                          )}

                          {!message.isLoading && (
                            <CopyButton
                              content={message.content}
                              index={index}
                              copiedIndex={copiedMessageIndex}
                              onCopy={onCopyMessage}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </Fragment>
                )}
              </div>
            </div>
          );
        })}

        <div ref={conversationEndRef} />
      </div>

      <div className="composer">
        {(creatingSession || (!!sessionId && !agentReady)) && (
          <ComposerStatus>
            <LoadingDots />
            <span>{translate("agent.preparingAgent")}</span>
          </ComposerStatus>
        )}

        {secretWarning && (
          <SecretWarning>
            <span>{translate("agent.secretDetectedWarning")}</span>
          </SecretWarning>
        )}

        <AttachedFiles files={attachedFiles} onRemove={removeAttachedFile} />

        <div className="input input-with-upload">
          <TextArea
            value={draftMessage}
            onChange={(event) => setDraftMessage(event?.target?.value || "")}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={translate("agent.askMeAnything")}
            disabled={creatingSession || (!!sessionId && !agentReady)}
            className="custom-input textarea-with-inset"
            rows={2}
          />

          <div className="upload-inside">
            <Tooltip title={translate("agent.addFilesOrPhotos")}>
              <div
                className="icon add-files"
                onClick={handleAddFilesClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleAddFilesClick();
                  }
                }}
              >
                <PaperClipIcon width={15} height={15} />
              </div>
            </Tooltip>
          </div>
        </div>

        <div className="actions">
          <div className="layout">
            <Tooltip title={translate("agent.tradeOptimizeView")}>
              <div
                className={`icon ${layoutMode === AGENT_LAYOUT_MODE.TRADE_OPTIMIZE ? "active" : ""}`}
                onClick={() =>
                  props?.actSetLayoutMode(AGENT_LAYOUT_MODE.TRADE_OPTIMIZE)
                }
              >
                <ChartIcon />
              </div>
            </Tooltip>

            <Tooltip title={translate("agent.chatOptimizeView")}>
              <div
                className={`icon ${layoutMode === AGENT_LAYOUT_MODE.CHAT_OPTIMIZE ? "active" : ""}`}
                onClick={() =>
                  props?.actSetLayoutMode(AGENT_LAYOUT_MODE.CHAT_OPTIMIZE)
                }
              >
                <CommentIcon />
              </div>
            </Tooltip>
          </div>

          {loading ? (
            <Button
              onClick={stopAgent}
              icon={
                <StopCircle width={18} height={18} color="var(--color-error)" />
              }
              className="stop-button"
            />
          ) : (
            <Button
              onClick={onResetConversation}
              disabled={
                creatingSession ||
                (!!sessionId && !agentReady) ||
                conversation.length === 0
              }
              className="reset-button"
            >
              {translate("agent.reset")}
            </Button>
          )}

          <SendButtonWrapper>
            <Button
              ref={sendButtonRef}
              type="primary"
              onClick={onSendMessage}
              loading={loading}
              disabled={
                creatingSession ||
                (!!sessionId && !agentReady) ||
                loading ||
                draftMessage.trim().length === 0
              }
              className="send-button"
            >
              {!showPaperPlane && !loading && (
                <PaperPlaneIcon
                  width={16}
                  height={16}
                  color={
                    creatingSession ||
                    (!!sessionId && !agentReady) ||
                    loading ||
                    draftMessage.trim().length === 0
                      ? "#595959"
                      : "#fff"
                  }
                  className="paper-plane-icon"
                />
              )}
              {translate("agent.send")}
            </Button>

            {showPaperPlane && paperPlanePosition && (
              <PaperPlaneAnimation
                left={`${paperPlanePosition.x}px`}
                top={`${paperPlanePosition.y}px`}
              >
                <PaperPlaneIcon width={24} height={24} color="#1890ff" />
              </PaperPlaneAnimation>
            )}
          </SendButtonWrapper>
        </div>
      </div>
    </AgentViewWrapper>
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
  }),
  { actSetLayoutMode },
)(AgentView);
