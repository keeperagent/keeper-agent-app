import { useEffect, useRef, useState, Fragment } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import copy from "copy-to-clipboard";
import { message } from "antd";
import { MESSAGE } from "@/electron/constant";
import { useTranslation } from "@/hook/useTranslation";
import { CopyIcon, CheckIcon } from "@/component/Icon";
import { MessageListWrapper } from "./style";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type Props = {
  messages: ChatMessage[];
  streamingContent?: string;
  activeToolName?: string | null;
};

const markdownComponents = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        if (href) {
          window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, { url: href });
        }
      }}
    >
      {children}
    </a>
  ),
};

const MessageList = ({ messages, streamingContent, activeToolName }: Props) => {
  const { translate } = useTranslation();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isStreaming = Boolean(streamingContent || activeToolName);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, streamingContent, activeToolName]);

  const onCopy = (content: string, id: string) => {
    copy(content);
    message.success(translate("copied"));
    setCopiedId(id);
    setTimeout(() => { setCopiedId(null); }, 1500);
  };

  const formatTimestamp = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  return (
    <MessageListWrapper>
      {messages.map((msg) => {
        const isUser = msg.role === "user";
        const timestamp = formatTimestamp(msg.timestamp);

        return (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">
              <div className="message-bubble-wrapper">
                <div className="bubble">
                  {isUser ? (
                    <Fragment>{msg.content}</Fragment>
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                <div className="message-footer">
                  <div className="timestamp">{timestamp}</div>
                  <div
                    className={`copy-icon ${copiedId === msg.id ? "copied" : ""}`}
                    onClick={() => onCopy(msg.content, msg.id)}
                  >
                    {copiedId === msg.id ? <CheckIcon /> : <CopyIcon />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {isStreaming && (
        <div className="message assistant">
          <div className="message-content">
            <div className="message-bubble-wrapper">
              <div className="bubble">
                {streamingContent ? (
                  <div className="markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="loading-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                )}

                {activeToolName && (
                  <div className="tool-badge">
                    <span className="spinner" />
                    {activeToolName}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </MessageListWrapper>
  );
};

export default MessageList;
