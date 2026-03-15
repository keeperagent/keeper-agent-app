import { useEffect, useState } from "react";
import { Button, Form, Switch, QRCode } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useUpdatePreference, useTranslation } from "@/hook";
import { IPreference } from "@/electron/type";
import { WhatsAppStatus, WhatsAppAction } from "@/electron/chatGateway/types";
import Status from "@/component/Status";
import { MESSAGE } from "@/electron/constant";
import { Wrapper } from "./style";

type IProps = {
  preference: IPreference | null;
};

const ConnectWhatsApp = (props: IProps) => {
  const { preference } = props;
  const { updatePreference, loading } = useUpdatePreference();
  const { translate } = useTranslation();
  const [form] = Form.useForm();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<WhatsAppStatus>(
    WhatsAppStatus.DISCONNECTED,
  );

  useEffect(() => {
    form.setFieldsValue({
      isWhatsAppOn: preference?.isWhatsAppOn,
    });
  }, [preference, form]);

  useEffect(() => {
    const handleQr = (_event: any, data: { qr: string }) => {
      setQrCode(data.qr);
    };

    const handleStatus = (_event: any, data: { status: WhatsAppStatus }) => {
      setStatus(data.status);
      if (data.status !== WhatsAppStatus.CONNECTING) {
        setQrCode(null);
      }
    };

    window.electron.on(MESSAGE.WHATSAPP_QR, handleQr);
    window.electron.on(MESSAGE.WHATSAPP_STATUS, handleStatus);

    window.electron.send(MESSAGE.RESTART_WHATSAPP, {
      action: WhatsAppAction.STATUS,
    });

    return () => {
      window.electron.removeAllListeners(MESSAGE.WHATSAPP_QR);
      window.electron.removeAllListeners(MESSAGE.WHATSAPP_STATUS);
    };
  }, []);

  const onToggle = async (checked: boolean) => {
    await updatePreference({
      id: preference?.id,
      isWhatsAppOn: checked,
    });
    window.electron.send(MESSAGE.RESTART_WHATSAPP);
  };

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

      <Form layout="vertical" form={form}>
        <Form.Item
          label={`${translate("setting.enableWhatsAppAgent")}:`}
          valuePropName="checked"
          name="isWhatsAppOn"
        >
          <Switch
            checkedChildren={translate("yes")}
            unCheckedChildren={translate("no")}
            onChange={onToggle}
            disabled={loading}
          />
        </Form.Item>
      </Form>

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

export default connect(
  (state: RootState) => ({
    preference: state?.Preference?.preference,
  }),
  {},
)(ConnectWhatsApp);
