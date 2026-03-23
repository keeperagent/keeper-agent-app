import { Button, Input } from "antd";
import { useTranslation } from "@/hook/useTranslation";
import { StopCircle } from "@/component/Icon";
import { ChatInputWrapper } from "./style";

const { TextArea } = Input;

type Props = {
  onSend: (input: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  encryptKey?: string;
  setEncryptKey?: (key: string) => void;
};

const ChatInput = ({
  onSend,
  onStop,
  isStreaming,
  encryptKey,
  setEncryptKey,
}: Props) => {
  const { translate } = useTranslation();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const target = event.target as HTMLTextAreaElement;
      const value = target.value.trim();

      if (value && !isStreaming) {
        onSend(value);
        target.form?.reset();
      }
    }
  };

  return (
    <ChatInputWrapper>
      {setEncryptKey !== undefined && (
        <div className="encrypt-row">
          <span className="encrypt-label">
            {translate("agent.encryptKey")}:
          </span>

          <Input.Password
            value={encryptKey || ""}
            onChange={(event) => setEncryptKey(event.target.value)}
            placeholder={translate("agent.encryptKeyPlaceholder")}
            className="custom-input"
            size="small"
            style={{ flex: 1 }}
          />
        </div>
      )}

      <form
        className="input-row"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const inputValue = ((formData.get("message") as string) || "").trim();
          if (inputValue && !isStreaming) {
            onSend(inputValue);
            event.currentTarget.reset();
          }
        }}
      >
        <TextArea
          name="message"
          placeholder={translate("agent.askMeAnything")}
          rows={2}
          disabled={isStreaming}
          onKeyDown={handleKeyDown}
          className="custom-input"
        />

        {isStreaming ? (
          <Button
            onClick={onStop}
            icon={
              <StopCircle width={18} height={18} color="var(--color-error)" />
            }
            className="stop-button"
          />
        ) : (
          <Button type="primary" htmlType="submit">
            {translate("agent.send")}
          </Button>
        )}
      </form>
    </ChatInputWrapper>
  );
};

export default ChatInput;
