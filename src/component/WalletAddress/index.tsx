import { useState, ComponentType } from "react";
import { Tooltip, message, QRCode, Modal } from "antd";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import copy from "copy-to-clipboard";
import { CopyIcon, QRCodeIcon, CheckIcon } from "@/component/Icon";
import { useTranslation } from "@/hook";
import { WalletAddressWrapper, QRCodeWrapper } from "./style";
import { removeSpecialCharacter } from "../Workflow/Panel/util";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

type IWalletAddressProps = {
  address: string;
  searchText?: string;
  hideQRCode?: boolean;
};

const WalletAddress = (props: IWalletAddressProps) => {
  const { address, searchText = "", hideQRCode } = props;
  const { translate } = useTranslation();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isCopied, setCopied] = useState(false);

  const onCopy = () => {
    copy(address);
    message.success(translate("copied"));
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const onToggleModal = () => {
    setModalOpen(!isModalOpen);
  };

  return (
    <WalletAddressWrapper>
      <div className="text">
        <Highlighter
          textToHighlight={address}
          searchWords={[removeSpecialCharacter(searchText)]}
          highlightClassName="highlight"
        />
      </div>

      <div className="list-icon">
        <Tooltip title={translate("copy")} placement="top">
          {isCopied ? (
            <div className="icon copied">
              <CheckIcon />
            </div>
          ) : (
            <div className="icon" onClick={onCopy}>
              <CopyIcon />
            </div>
          )}
        </Tooltip>

        {!hideQRCode && (
          <div className="icon" onClick={onToggleModal}>
            <QRCodeIcon color="#867ae9" />
          </div>
        )}
      </div>

      <Modal
        open={isModalOpen}
        footer={null}
        mask={{ closable: true }}
        onCancel={onToggleModal}
        width="50rem"
        title={translate("QRCode")}
      >
        <QRCodeWrapper>
          <div className="address">
            <div className="label">{translate("wallet.walletAddress")}:</div>
            <div>{address}</div>
          </div>
          <QRCode value={address} size={230} iconSize={60} />
        </QRCodeWrapper>
      </Modal>
    </WalletAddressWrapper>
  );
};

export default WalletAddress;
