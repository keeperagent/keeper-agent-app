import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MESSAGE } from "@/electron/constant";
import { connect } from "react-redux";
import { Alert, Button, Input, message, Tooltip } from "antd";
import copy from "copy-to-clipboard";
import { RootState } from "@/redux/store";
import { useDashboardAgent, useTranslation } from "@/hook";
import {
  AgentViewWrapper,
  DropOverlay,
  LoadingDotsWrapper,
  PaperPlaneAnimation,
  ExecutingToolBadge,
} from "./style";
import {
  CopyIcon,
  CheckIcon,
  ChartIcon,
  LayoutLeftIcon,
  PaperPlaneIcon,
  StopCircle,
  CommentIcon,
  PaperClipIcon,
} from "@/component/Icon";
import AttachedFiles, { type AttachedFile } from "./AttachedFiles";
import { actSetLayoutMode, AGENT_LAYOUT_MODE } from "@/redux/agent";

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  // Subagent names
  app_management_agent: "App Management subagent",
  transaction_agent: "Transaction subagent",
  code_execution_agent: "Code Execution subagent",

  // Tool names
  swap_on_jupiter: "Swap on Jupiter",
  swap_on_kyberswap: "Swap on KyberSwap",
  transfer_solana_token: "Transfer Solana token",
  get_solana_token_balance: "Get Solana token balance",
  get_evm_token_balance: "Get EVM token balance",
  get_token_price: "Get token price",
  launch_pumpfun_token: "Launch Pump.fun token",
  launch_bonkfun_token: "Launch Bonk.fun token",
  create_wallet_group: "Create wallet group",
  generate_wallets_for_group: "Generate wallets",
  create_profile_group_with_profiles: "Create profile group",
  create_campaign_for_profile_group: "Create campaign",
  create_node_provider_group: "Create node provider group",
  execute_javascript: "Execute JavaScript",
  execute_python: "Execute Python",
  read_file: "Read file",
  write_file: "Write file",
};

const getToolDisplayName = (toolName: string): string =>
  TOOL_DISPLAY_NAMES[toolName] ||
  toolName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Absolute path for backend. Uses Electron getPathForFile when available (pick/drop). */
const getFilePath = (file: File): string => {
  try {
    if (typeof window !== "undefined" && window.electron?.getPathForFile) {
      const p = window.electron.getPathForFile(file);
      if (p) return p;
    }
  } catch {}
  return (file as File & { path?: string }).path || file.name;
};

/** From Electron dialog result: already absolute path from main process. No file:// preview (blocked by browser/security). */
const fileInfoToAttached = (info: {
  path: string;
  name: string;
  extension: string;
}): AttachedFile => {
  const isImage = /^(jpg|jpeg|png|gif|webp|bmp|svg|ico)$/i.test(
    info.extension || "",
  );
  return {
    path: info.path,
    name: info.name,
    extension: (info.extension || "").toLowerCase(),
    type: isImage ? "image" : "other",
    previewUrl: undefined, // avoid file:// in img src (not allowed to load local resource)
  };
};

const getExtensionFromName = (name: string): string => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
};

const fileToAttached = (file: File): AttachedFile => {
  const path = getFilePath(file);
  const name = file.name;
  const extension =
    getExtensionFromName(name) || (file.type || "").split("/")[1] || "";
  const isImage = (file.type || "").startsWith("image/");
  return {
    path,
    name,
    extension,
    type: isImage ? "image" : "other",
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
  };
};

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

type DisplayMessage = {
  role: string;
  label: string;
  content: string;
  className: string;
  isLoading?: boolean;
  timestamp?: Date;
  executingToolText?: string;
};

const deriveLabel = (role: string, t: (key: string) => string) => {
  const normalized = role?.toLowerCase() || "";
  if (normalized.includes("human") || normalized.includes("user")) {
    return t("agent.messageLabelYou");
  }
  if (normalized.includes("tool")) {
    return t("agent.messageLabelToolOutput");
  }
  if (normalized.includes("system")) {
    return t("agent.messageLabelKeeperSystem");
  }
  return t("agent.messageLabelKeeper");
};

const deriveClassName = (role: string) => {
  const normalized = role?.toLowerCase() || "";
  if (normalized.includes("human") || normalized.includes("user")) {
    return "message user";
  }
  if (normalized.includes("tool")) {
    return "message tool";
  }
  return "message assistant";
};

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
    return <>{content}</>;
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

const stripContext = (text: string) => {
  // Dynamically detect and strip any context blocks
  // Look for pattern: \n\n followed by text ending with ":" followed by JSON object
  // This catches any context header format like "CONTEXT: {...}" or "SOME HEADER: {...}"

  // First, try to find context markers explicitly (case-insensitive)
  const lowerText = text.toLowerCase();
  const markers = [
    "\n\ncontext:\n",
    "\n\ncontext (for agent use only",
    "\n\ncurrent context",
  ];
  for (const marker of markers) {
    const idx = lowerText.indexOf(marker);
    if (idx !== -1) {
      return text.slice(0, idx).trim();
    }
  }

  // Then, dynamically detect JSON context blocks
  // Pattern: \n\n followed by text ending with ":" followed by whitespace and "{"
  const contextHeaderPattern = /\n\n[^\n{]*:\s*\{/;
  const headerMatch = text.match(contextHeaderPattern);
  if (headerMatch && headerMatch.index !== undefined) {
    const headerStart = headerMatch.index;
    // Find the matching closing brace for the JSON object to verify it's complete
    let braceCount = 0;
    const jsonStart = headerMatch.index + headerMatch[0].length - 1; // Position of opening {

    for (let i = jsonStart; i < text.length; i++) {
      if (text[i] === "{") braceCount++;
      if (text[i] === "}") braceCount--;
      if (braceCount === 0) {
        // Found complete JSON object, strip everything from the header start
        return text.slice(0, headerStart).trim();
      }
    }
  }

  return text;
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
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOverAgent, setIsDragOverAgent] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(
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
  const attachedFilesRef = useRef<AttachedFile[]>([]);
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
    if (!files?.length) return;
    const next = Array.from(files).map(fileToAttached);
    setAttachedFiles((prev) => [...prev, ...next]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const removed = prev[index];
      if (removed?.previewUrl?.startsWith("blob:"))
        URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  attachedFilesRef.current = attachedFiles;
  useEffect(() => {
    return () => {
      attachedFilesRef.current.forEach(
        (f) =>
          f.previewUrl?.startsWith("blob:") &&
          URL.revokeObjectURL(f.previewUrl),
      );
    };
  }, []);

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
        const content = stripContext(message?.content || "");
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
      const content = streamingContent || "";
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
      chainKey,
      tokenAddress,
      nodeEndpointGroupId,
      campaignId,
      listCampaignProfileId: listProfileId,
      isAllWallet,
      encryptKey,
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

    sendMessage(messageWithContext);
    setDraftMessage("");
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
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: "var(--margin-bottom)" }}
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
                          <div
                            style={{
                              marginTop: message.content ? "0.8rem" : undefined,
                            }}
                          >
                            <ExecutingToolBadge>
                              <span className="spinner" />
                              {message.executingToolText}
                            </ExecutingToolBadge>
                          </div>
                        )}
                        {message.isLoading && !message.executingToolText && (
                          <div
                            style={{
                              marginTop: message.content ? "0.8rem" : undefined,
                            }}
                          >
                            <ExecutingToolBadge>
                              <span className="spinner" />
                              {translate("agent.thinking")}
                            </ExecutingToolBadge>
                          </div>
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
          <div
            className="composer-status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
              fontSize: "13px",
              color: "var(--color-text-secondary, #666)",
            }}
          >
            <LoadingDots />
            <span>{translate("agent.preparingAgent")}</span>
          </div>
        )}

        <AttachedFiles files={attachedFiles} onRemove={removeAttachedFile} />

        <div className="input input-with-upload">
          <TextArea
            value={draftMessage}
            onChange={(event) => setDraftMessage(event?.target?.value || "")}
            onKeyDown={handleKeyDown}
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
                <LayoutLeftIcon />
              </div>
            </Tooltip>

            <Tooltip title={translate("agent.onlyChatView")}>
              <div
                className={`icon ${layoutMode === AGENT_LAYOUT_MODE.ONLY_CHAT ? "active" : ""}`}
                onClick={() =>
                  props?.actSetLayoutMode(AGENT_LAYOUT_MODE.ONLY_CHAT)
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
              style={{
                marginRight: "var(--margin-right)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          ) : (
            <Button
              onClick={onResetConversation}
              disabled={
                creatingSession ||
                (!!sessionId && !agentReady) ||
                conversation.length === 0
              }
              style={{ marginRight: "var(--margin-right)" }}
            >
              {translate("agent.reset")}
            </Button>
          )}

          <div style={{ position: "relative" }}>
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
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
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
                style={{
                  left: `${paperPlanePosition.x}px`,
                  top: `${paperPlanePosition.y}px`,
                }}
              >
                <PaperPlaneIcon width={24} height={24} color="#1890ff" />
              </PaperPlaneAnimation>
            )}
          </div>
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
