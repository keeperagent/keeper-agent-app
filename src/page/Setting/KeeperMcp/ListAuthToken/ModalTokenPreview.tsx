import { Button, message, Modal } from "antd";
import copy from "copy-to-clipboard";
import { useTranslation } from "@/hook";
import { ModalMcpTokenCreatedWrapper } from "../style";

type IProps = {
  plainToken: string | null;
  onClose: () => void;
};

const ModalTokenPreview = ({ plainToken, onClose }: IProps) => {
  const { translate } = useTranslation();

  const onCopy = () => {
    copy(plainToken || "");
    message.success(translate("copied"));
  };

  return (
    <Modal
      title={translate("mcp.tokenPreview")}
      open={Boolean(plainToken)}
      onCancel={onClose}
      mask={{ closable: false }}
      footer={null}
    >
      <ModalMcpTokenCreatedWrapper>
        <div className="plain-token-label">
          {translate("mcp.tokenCreatedNote")}
        </div>
        <div className="plain-token-value">{plainToken}</div>
        <Button
          type="primary"
          size="small"
          className="plain-token-copy"
          onClick={onCopy}
        >
          {translate("mcp.copyToken")}
        </Button>
      </ModalMcpTokenCreatedWrapper>
    </Modal>
  );
};

export default ModalTokenPreview;
