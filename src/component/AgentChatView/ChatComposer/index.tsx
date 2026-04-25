import { useRef } from "react";
import { Button, Input, Tooltip } from "antd";
import { useTranslation } from "@/hook/useTranslation";
import {
  ChartIcon,
  CommentIcon,
  PaperClipIcon,
  PaperPlaneIcon,
  StopCircle,
} from "@/component/Icon";
import AttachedFiles, { type AttachedFile } from "../AttachedFiles";
import { AGENT_LAYOUT_MODE } from "@/redux/agent";
import { ChatComposerWrapper } from "./style";

const { TextArea } = Input;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onReset?: () => void;
  loading: boolean;
  disabled?: boolean;
  canReset?: boolean;
  attachedFiles?: AttachedFile[];
  onAddFiles?: () => void;
  onRemoveFile?: (index: number) => void;
  onPaste?: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  showLayoutOption?: boolean;
  layoutMode?: string;
  onSetLayoutMode?: (mode: string) => void;
  sendButtonRef?: React.Ref<HTMLButtonElement>;
  messageHistory?: string[];
  extraActions?: React.ReactNode;
};

const ChatComposer = ({
  value,
  onChange,
  onSend,
  onStop,
  onReset,
  loading,
  disabled,
  canReset,
  attachedFiles = [],
  onAddFiles,
  onRemoveFile,
  onPaste,
  showLayoutOption,
  layoutMode,
  onSetLayoutMode,
  sendButtonRef,
  messageHistory = [],
  extraActions,
}: Props) => {
  const { translate } = useTranslation();
  const historyIndexRef = useRef<number>(-1); // -1 = not navigating history
  const draftRef = useRef<string>("");
  const textareaRef = useRef<any>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      historyIndexRef.current = -1;
      onSend();
      return;
    }

    if (event.key === "ArrowUp" && messageHistory.length > 0) {
      // Only navigate when cursor is at the very beginning, first press moves cursor there
      if (event.currentTarget.selectionStart !== 0) {
        return;
      }
      event.preventDefault();
      if (historyIndexRef.current === -1) {
        draftRef.current = value;
      }
      const nextIndex =
        historyIndexRef.current === -1
          ? messageHistory.length - 1
          : Math.max(0, historyIndexRef.current - 1);

      historyIndexRef.current = nextIndex;
      onChange(messageHistory[nextIndex]);
      moveCursor("start");
      return;
    }

    if (event.key === "ArrowDown" && historyIndexRef.current !== -1) {
      // Only navigate when cursor is at the very end, first press moves cursor there
      if (
        event.currentTarget.selectionStart !== event.currentTarget.value.length
      ) {
        return;
      }
      event.preventDefault();
      const nextIndex = historyIndexRef.current + 1;
      if (nextIndex >= messageHistory.length) {
        historyIndexRef.current = -1;
        onChange(draftRef.current);
        moveCursor("end");
      } else {
        historyIndexRef.current = nextIndex;
        onChange(messageHistory[nextIndex]);
        moveCursor("end");
      }
      return;
    }
  };

  const moveCursor = (position: "start" | "end") => {
    requestAnimationFrame(() => {
      const el = textareaRef.current?.resizableTextArea?.textArea as
        | HTMLTextAreaElement
        | undefined;
      if (!el) {
        return;
      }
      const pos = position === "start" ? 0 : el.value.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const isSendDisabled = disabled || loading || value.trim().length === 0;

  return (
    <ChatComposerWrapper>
      {onRemoveFile && (
        <AttachedFiles files={attachedFiles} onRemove={onRemoveFile} />
      )}

      <div className="input input-with-upload">
        <TextArea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            historyIndexRef.current = -1;
            onChange(event.target.value || "");
          }}
          onKeyDown={handleKeyDown}
          onPaste={onPaste}
          placeholder={translate("agent.askMeAnything")}
          disabled={disabled}
          className="custom-input textarea-with-inset"
          rows={2}
        />

        {onAddFiles && (
          <div className="upload-inside">
            <Tooltip title={translate("agent.addFilesOrPhotos")}>
              <div
                className="icon add-files"
                onClick={onAddFiles}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onAddFiles();
                  }
                }}
              >
                <PaperClipIcon width={15} height={15} />
              </div>
            </Tooltip>
          </div>
        )}
      </div>

      <div className="actions">
        {showLayoutOption && onSetLayoutMode ? (
          <div className="layout">
            <Tooltip title={translate("agent.tradeOptimizeView")}>
              <div
                className={`icon ${layoutMode === AGENT_LAYOUT_MODE.TRADE_OPTIMIZE ? "active" : ""}`}
                onClick={() =>
                  onSetLayoutMode(AGENT_LAYOUT_MODE.TRADE_OPTIMIZE)
                }
              >
                <ChartIcon />
              </div>
            </Tooltip>

            <Tooltip title={translate("agent.chatOptimizeView")}>
              <div
                className={`icon ${layoutMode === AGENT_LAYOUT_MODE.CHAT_OPTIMIZE ? "active" : ""}`}
                onClick={() => onSetLayoutMode(AGENT_LAYOUT_MODE.CHAT_OPTIMIZE)}
              >
                <CommentIcon />
              </div>
            </Tooltip>
          </div>
        ) : (
          <div className="spacer" />
        )}

        {extraActions}

        {loading ? (
          <Button
            onClick={onStop}
            icon={
              <StopCircle width={18} height={18} color="var(--color-error)" />
            }
            className="stop-button"
          />
        ) : (
          onReset && (
            <Button
              onClick={onReset}
              disabled={disabled || !canReset}
              className="reset-button"
            >
              {translate("agent.reset")}
            </Button>
          )
        )}

        <Button
          ref={sendButtonRef}
          type="primary"
          onClick={onSend}
          loading={loading}
          disabled={isSendDisabled}
          className="send-button"
        >
          {!loading && (
            <PaperPlaneIcon
              width={16}
              height={16}
              color={isSendDisabled ? "#595959" : "currentColor"}
              className="paper-plane-icon"
            />
          )}
          {translate("agent.send")}
        </Button>
      </div>
    </ChatComposerWrapper>
  );
};

export default ChatComposer;
