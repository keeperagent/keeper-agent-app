import { useEffect, useState } from "react";
import { Button, QRCode } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation } from "@/hook";
import { WhatsAppStatus, WhatsAppAction } from "@/electron/chatGateway/types";
import Status from "@/component/Status";
import { MESSAGE } from "@/electron/constant";
import { Wrapper } from "./style";

const ConnectWhatsApp = () => {
  const { translate } = useTranslation();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<WhatsAppStatus>(
    WhatsAppStatus.DISCONNECTED,
  );

  useEffect(() => {
    const handleQr = (_event: any, data: { qr: string }) => {
      setQrCode(data.qr);
    };

    const handleStatus = (_event: any, data: { status: WhatsAppStatus }) => {
      setStatus(data.status);
      if (data.status === WhatsAppStatus.CONNECTED) {
        setQrCode(null);
      }
    };

    window.electron.on(MESSAGE.WHATSAPP_QR, handleQr);
    window.electron.on(MESSAGE.WHATSAPP_STATUS, handleStatus);

    // Request current status on mount
    window.electron.send(MESSAGE.RESTART_WHATSAPP, {
      action: WhatsAppAction.STATUS,
    });

    return () => {
      window.electron.removeAllListeners(MESSAGE.WHATSAPP_QR);
      window.electron.removeAllListeners(MESSAGE.WHATSAPP_STATUS);
    };
  }, []);

  const onConnect = () => {
    window.electron.send(MESSAGE.RESTART_WHATSAPP, {
      action: WhatsAppAction.CONNECT,
    });
  };

  const onDisconnect = () => {
    window.electron.send(MESSAGE.RESTART_WHATSAPP, {
      action: WhatsAppAction.DISCONNECT,
    });
    setQrCode(null);
  };

  const statusLabel =
    status === WhatsAppStatus.CONNECTED
      ? translate("connected")
      : status === WhatsAppStatus.CONNECTING
        ? translate("connecting")
        : translate("disconnected");

  return (
    <Wrapper>
      <div className="status-wrapper">
        <Status
          content={statusLabel}
          isSuccess={status === WhatsAppStatus.CONNECTED}
        />
      </div>

      {qrCode && status !== WhatsAppStatus.CONNECTED && (
        <div className="qr-container">
          <QRCode value={qrCode} size={240} />
        </div>
      )}

      <div className="button">
        {status === WhatsAppStatus.CONNECTED && (
          <Button
            danger
            onClick={onDisconnect}
            style={{ marginRight: "var(--margin-right)" }}
          >
            {translate("disconnect")}
          </Button>
        )}

        <Button type="primary" onClick={onConnect}>
          {status === WhatsAppStatus.CONNECTED
            ? translate("reconnect")
            : translate("connect")}
        </Button>
      </div>
    </Wrapper>
  );
};

export default connect((state: RootState) => ({}), {})(ConnectWhatsApp);
