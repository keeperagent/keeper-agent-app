import { useEffect, useRef, useState } from "react";
import { Form, Switch, Input, Button, message, Tour, TourProps } from "antd";
import { connect } from "react-redux";
import qs from "qs";
import { useLocation } from "react-router-dom";
import { RootState } from "@/redux/store";
import { useUpdatePreference, useTranslation } from "@/hook";
import { PasswordInput } from "@/component/Input";
import { IPreference } from "@/electron/type";
import { Wrapper } from "./style";
import { MESSAGE } from "@/electron/constant";

type IProps = {
  preference: IPreference | null;
};

const ConnectTelegram = (props: IProps) => {
  const { preference } = props;
  const [isTourOpen, setTourOpen] = useState(false);
  const { updatePreference, loading, isSuccess } = useUpdatePreference();

  const [form] = Form.useForm();
  const { translate } = useTranslation();
  const location = useLocation();
  const ref1 = useRef(null);
  const { search } = location;
  const { focusTelegram } = qs.parse(search, { ignoreQueryPrefix: true });

  useEffect(() => {
    form.setFieldsValue({
      isTelegramOn: preference?.isTelegramOn,
      botTokenTelegram: preference?.botTokenTelegram,
      deviceId: preference?.deviceId,
      chatIdTelegram: preference?.chatIdTelegram,
    });
  }, [preference, form]);

  useEffect(() => {
    if (focusTelegram === "true") {
      setTimeout(() => {
        setTourOpen(true);
      }, 500);
    }
  }, [focusTelegram]);

  const onCloseTour = () => {
    setTourOpen(false);
  };

  const steps: TourProps["steps"] = [
    {
      title: translate("setting.connectTelegram"),
      description: translate("tour.telegramSetting"),
      target: () => ref1.current,
      nextButtonProps: { children: translate("gotit") },
    },
  ];

  useEffect(() => {
    if (!loading && isSuccess) {
      message.success(translate("updateSuccess"));
    }
  }, [loading, isSuccess, translate]);

  const onSubmitForm = async () => {
    try {
      const { isTelegramOn, deviceId, botTokenTelegram, chatIdTelegram } =
        await form.validateFields([
          "isTelegramOn",
          "botTokenTelegram",
          "chatIdTelegram",
          "deviceId",
        ]);

      await updatePreference({
        id: preference?.id,
        isTelegramOn,
        botTokenTelegram,
        chatIdTelegram,
        deviceId,
      });

      window.electron.send(MESSAGE.RESTART_TELEGRAM_BOT);
    } catch {}
  };

  return (
    <Wrapper ref={ref1}>
      <Form layout="vertical" form={form}>
        <Form.Item
          label={`${translate("setting.receivNofiTelegram")}:`}
          valuePropName="checked"
          required={true}
          name="isTelegramOn"
        >
          <Switch
            checkedChildren={translate("yes")}
            unCheckedChildren={translate("no")}
          />
        </Form.Item>

        <Form.Item
          label={`${translate("deviceId")}:`}
          name="deviceId"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
          tooltip={translate("setting.telegramHelper")}
        >
          <Input
            placeholder={translate("setting.deviceIdPlaceholder")}
            className="custom-input"
            size="large"
          />
        </Form.Item>

        <Form.Item label="Bot token:" name="botTokenTelegram">
          <PasswordInput
            name="botTokenTelegram"
            placeholder={translate("setting.enterBotToken")}
            extendClass="botTokenTelegram"
          />
        </Form.Item>

        <Form.Item
          label="Chat ID:"
          name="chatIdTelegram"
          style={{ marginTop: "-1.3rem" }}
        >
          <PasswordInput
            name="chatIdTelegram"
            placeholder={translate("setting.chatIdIdPlaceholder")}
          />
        </Form.Item>
      </Form>

      <div className="button">
        <Button type="primary" onClick={onSubmitForm} loading={loading}>
          {translate("save")}
        </Button>
      </div>

      <Tour
        open={isTourOpen}
        onClose={onCloseTour}
        steps={steps}
        type="primary"
      />
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    preference: state?.Preference?.preference,
  }),
  {}
)(ConnectTelegram);
