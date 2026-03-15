import { useEffect, useState } from "react";
import { Form, Switch, Button, message, QRCode } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useUpdatePreference, useTranslation } from "@/hook";
import { IPreference } from "@/electron/type";
import { WhatsAppStatus } from "@/electron/chatGateway/types";
import Status from "@/component/Status";
import { MESSAGE } from "@/electron/constant";
import { Wrapper } from "./style";

type IProps = {
  preference: IPreference | null;
};

const ConnectWhatsApp = (props: IProps) => {
  const { preference } = props;
  const { updatePreference, loading, isSuccess } = useUpdatePreference();
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
    if (!loading && isSuccess) {
      message.success(translate("updateSuccess"));
    }
  }, [loading, isSuccess, translate]);

  useEffect(() => {
    const handleQr = (_event: any, data: { qr: string }) => {
      setQrCode(data.qr);
      setStatus(WhatsAppStatus.CONNECTING);
    };

    const handleStatus = (_event: any, data: { status: WhatsAppStatus }) => {
      setStatus(data.status);
      if (data.status === WhatsAppStatus.CONNECTED) {
        setQrCode(null);
      }
    };

    window.electron.on(MESSAGE.WHATSAPP_QR, handleQr);
    window.electron.on(MESSAGE.WHATSAPP_STATUS, handleStatus);

    return () => {
      window.electron.removeAllListeners(MESSAGE.WHATSAPP_QR);
      window.electron.removeAllListeners(MESSAGE.WHATSAPP_STATUS);
    };
  }, []);

  const onSubmitForm = async () => {
    try {
      const { isWhatsAppOn } = await form.validateFields(["isWhatsAppOn"]);

      await updatePreference({
        id: preference?.id,
        isWhatsAppOn,
      });

      window.electron.send(MESSAGE.RESTART_WHATSAPP);
    } catch {}
  };

  const statusLabel =
    status === WhatsAppStatus.CONNECTED
      ? "Connected"
      : status === WhatsAppStatus.CONNECTING
        ? "Connecting..."
        : "Disconnected";

  return (
    <Wrapper>
      <div className="status-wrapper">
        <Status
          content={statusLabel}
          isSuccess={status === WhatsAppStatus.CONNECTED}
          isLarge={true}
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
          />
        </Form.Item>
      </Form>

      {qrCode && status !== WhatsAppStatus.CONNECTED && (
        <div className="qr-container">
          <QRCode value={qrCode} size={240} />
        </div>
      )}

      <div className="button">
        <Button type="primary" onClick={onSubmitForm} loading={loading}>
          {translate("save")}
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
