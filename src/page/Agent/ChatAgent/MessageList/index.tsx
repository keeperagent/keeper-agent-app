import { useEffect, useRef, Fragment } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MESSAGE } from "@/electron/constant";
import { useTranslation } from "@/hook/useTranslation";
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, streamingContent, activeToolName]);

  return (
    <MessageListWrapper>
      {messages.map((msg) => (
        <div key={msg.id} className={`message ${msg.role}`}>
          <div className="message-label">
            {msg.role === "user"
              ? translate("agent.messageLabelYou")
              : translate("agent.messageLabelKeeper")}
          </div>

          <div className="message-bubble">
            {msg.role === "user" ? (
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
        </div>
      ))}

      {isStreaming && (
        <div className="message assistant">
          <div className="message-label">
            {translate("agent.messageLabelKeeper")}
          </div>

          <div className="message-bubble">
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
      )}

      <div ref={bottomRef} />
    </MessageListWrapper>
  );
};

export default MessageList;
