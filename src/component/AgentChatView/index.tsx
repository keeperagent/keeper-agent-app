import { Fragment, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { guard } from "@keeperagent/crypto-key-guard";
import { MESSAGE } from "@/electron/constant";
import { Alert, message } from "antd";
import copy from "copy-to-clipboard";
import { useTranslation, useSaveClipboardImage } from "@/hook";
import { CopyIcon, CheckIcon, PaperPlaneIcon } from "@/component/Icon";
import { ChatRole } from "@/electron/chatGateway/types";
import {
  AgentChatViewWrapper,
  DropOverlay,
  LoadingDotsWrapper,
  PaperPlaneAnimation,
  ExecutingToolBadge,
  ComposerStatus,
  SecretWarning,
} from "./style";
import { type AttachedFile } from "./AttachedFiles";
import {
  type DisplayMessage,
  fileInfoToAttached,
  fileToAttached,
} from "./util";
import { ToolCallGroup } from "./ToolCallCard";
import ChatComposer from "./ChatComposer";
import PlanReview from "./PlanReview";

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

type Props = {
  messages: DisplayMessage[];
  loading: boolean;
  error?: string | null;
  warning?: string | null;
  composerDisabled?: boolean;
  canReset?: boolean;
  showPreparingStatus?: boolean;
  onSend: (draft: string, attachedFiles: AttachedFile[]) => void;
  onStop: () => void;
  onReset?: () => void;
  onErrorClose?: () => void;
  onApprovePlan?: (approved: boolean) => void;
  showLayoutOption?: boolean;
  layoutMode?: string;
  onSetLayoutMode?: (mode: string) => void;
  emptyState?: React.ReactNode;
};

const AgentChatView = ({
  messages,
  loading,
  error,
  warning,
  composerDisabled,
  canReset,
  showPreparingStatus,
  onSend,
  onStop,
  onReset,
  onErrorClose,
  onApprovePlan,
  showLayoutOption,
  layoutMode,
  onSetLayoutMode,
  emptyState,
}: Props) => {
  const { translate } = useTranslation();
  const { saveClipboardImage } = useSaveClipboardImage();

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
  const planReviewRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesLenRef = useRef<number>(0);
  const prevHasPlanReviewRef = useRef(false);
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
    if (!files?.length) {
      return;
    }
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
        _event: unknown,
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
                  prev.map((fileItem) =>
                    fileItem.path === res.path
                      ? { ...fileItem, previewUrl: res.dataUrl! }
                      : fileItem,
                  ),
                );
              }
              pending -= 1;
              if (pending <= 0) {
                window?.electron?.removeAllListeners(
                  MESSAGE.READ_FILE_AS_DATA_URL_RES,
                );
              }
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
    const currentLen = messages.length;

    if (currentLen === 0 && prevMessagesLenRef.current > 0) {
      conversationClearedRef.current = true;
    }

    if (currentLen > prevMessagesLenRef.current) {
      if (conversationClearedRef.current) {
        conversationEndRef.current?.scrollIntoView({ block: "end" });
      } else {
        conversationEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
      conversationClearedRef.current = false;
    } else if (loading) {
      conversationEndRef.current?.scrollIntoView({
        behavior: "instant",
        block: "end",
      });
    }

    prevMessagesLenRef.current = currentLen;
  }, [messages, loading]);

  useEffect(() => {
    if (hasPlanReview && !prevHasPlanReviewRef.current) {
      planReviewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
    prevHasPlanReviewRef.current = hasPlanReview;
  }, [messages]);

  const handleSend = () => {
    const trimmed = draftMessage.trim();
    if (!trimmed) {
      return;
    }

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
      }, 2000);
    }

    onSend(trimmed, attachedFiles);
    setDraftMessage("");
    clearAttachedFiles();
  };

  const hasPlanReview = messages.some((msg) => !!msg.planReview);
  const showEmptyState = Boolean(emptyState) && messages.length === 0;

  return (
    <AgentChatViewWrapper
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
          closable={{ onClose: onErrorClose }}
          className="error-alert"
        />
      )}

      <div className="conversation">
        {showEmptyState ? (
          emptyState
        ) : (
          <Fragment>
            {messages.map((msg, index) => {
              if (msg.planReview) {
                return (
                  <div
                    key={`plan-review-${index}`}
                    className="message"
                    ref={planReviewRef}
                  >
                    <PlanReview
                      plan={msg.planReview.plan}
                      onApprove={() => onApprovePlan?.(true)}
                      onReject={() => onApprovePlan?.(false)}
                    />
                  </div>
                );
              }

              const isUser = msg.role === ChatRole.HUMAN || msg.role === "user";
              const timestamp = msg.timestamp
                ? msg.timestamp.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : "";

              return (
                <div key={`${msg.role}-${index}`} className={msg.className}>
                  <div className="message-content">
                    {isUser ? (
                      <Fragment>
                        <div className="message-bubble-wrapper">
                          <div className="bubble">
                            <MessageBody content={msg.content} isUser={true} />
                            {msg.isLoading && <LoadingDots />}
                          </div>
                          {(timestamp || !msg.isLoading) && (
                            <div className="message-footer">
                              {timestamp && (
                                <div className="timestamp">{timestamp}</div>
                              )}
                              {!msg.isLoading && (
                                <CopyButton
                                  content={msg.content}
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
                            {msg.toolCalls && msg.toolCalls.length > 0 ? (
                              <ToolCallGroup
                                toolCalls={msg.toolCalls}
                                isActive={!!msg.isLoading || !!msg.executingToolText || !!msg.isAgentProcessing}
                              />
                            ) : (msg.isLoading && !msg.content) ? (
                              <ExecutingToolBadge>
                                <span className="spinner" />
                                {msg.executingToolText || translate("agent.thinking")}
                              </ExecutingToolBadge>
                            ) : null}

                            {msg.content && (
                              <MessageBody content={msg.content} isUser={false} />
                            )}
                          </div>
                          {(timestamp || !msg.isLoading) && (
                            <div className="message-footer">
                              {timestamp && (
                                <div className="timestamp">{timestamp}</div>
                              )}
                              {!msg.isLoading && (
                                <CopyButton
                                  content={msg.content}
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
          </Fragment>
        )}
      </div>

      <div className="composer">
        {showPreparingStatus && (
          <ComposerStatus>
            <LoadingDots />
            <span>{translate("agent.preparingAgent")}</span>
          </ComposerStatus>
        )}

        {hasPlanReview && (
          <ComposerStatus>
            <LoadingDots />
            <span>{translate("agent.waitingForApproval")}</span>
          </ComposerStatus>
        )}

        {secretWarning && (
          <SecretWarning>
            <span>{translate("agent.secretDetectedWarning")}</span>
          </SecretWarning>
        )}

        {warning && (
          <SecretWarning>
            <span>{warning}</span>
          </SecretWarning>
        )}

        <ChatComposer
          value={draftMessage}
          onChange={setDraftMessage}
          onSend={handleSend}
          onStop={onStop}
          onReset={onReset}
          loading={loading}
          disabled={composerDisabled}
          canReset={canReset}
          attachedFiles={attachedFiles}
          onAddFiles={handleAddFilesClick}
          onRemoveFile={removeAttachedFile}
          onPaste={handlePaste}
          showLayoutOption={showLayoutOption}
          layoutMode={layoutMode}
          onSetLayoutMode={onSetLayoutMode}
          sendButtonRef={sendButtonRef}
        />

        {showPaperPlane && paperPlanePosition && (
          <PaperPlaneAnimation
            left={`${paperPlanePosition.x}px`}
            top={`${paperPlanePosition.y}px`}
          >
            <PaperPlaneIcon width={24} height={24} color="#1890ff" />
          </PaperPlaneAnimation>
        )}
      </div>
    </AgentChatViewWrapper>
  );
};

export default AgentChatView;
export type { DisplayMessage, AttachedFile };
