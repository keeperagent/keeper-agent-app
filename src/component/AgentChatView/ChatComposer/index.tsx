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
}: Props) => {
  const { translate } = useTranslation();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const isSendDisabled = disabled || loading || value.trim().length === 0;

  return (
    <ChatComposerWrapper>
      {onRemoveFile && (
        <AttachedFiles files={attachedFiles} onRemove={onRemoveFile} />
      )}

      <div className="input input-with-upload">
        <TextArea
          value={value}
          onChange={(event) => onChange(event.target.value || "")}
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
              color={isSendDisabled ? "#595959" : "#fff"}
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
