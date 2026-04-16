import { Fragment, useEffect, useState, useMemo } from "react";
import { connect } from "react-redux";
import { Tabs, Form, Input, Row, Button, Select } from "antd";
import { IPreference, ISnipeTelegramNodeConfig } from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { NODE_STATUS, TELEGRAM_SNIPER_MODE } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "@/component/Workflow/ModalNodeConfig/common/util";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";
import SkipSetting from "@/component/Workflow/ModalNodeConfig/common/SkipSetting";
import { PasswordInput } from "@/component/Input";
import { RootState } from "@/redux/store";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ISnipeTelegramNodeConfig) => void;
  config: ISnipeTelegramNodeConfig;
  isModalOpen: boolean;
  preference: IPreference | null;
};

const SnipeTelegram = (props: Props) => {
  const { translate } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen, preference } =
    props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      botToken: config?.botToken || preference?.botTokenTelegram,
      chatId: config?.chatId || preference?.chatIdTelegram,
      variable: config?.variable || "TELEGRAM_MESSAGE",
      profileMode:
        config?.profileMode || TELEGRAM_SNIPER_MODE.ONE_EVENT_ONE_PROFILE,
      retry: config?.retry || 0,
      maxConcurrency: config?.maxConcurrency || 0,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        sleep,
        name,
        onSuccess,
        timeout,
        onError,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        botToken,
        chatId,
        variable,
        profileMode,
        retry,
        maxConcurrency,
      } = await form?.validateFields([
        "sleep",
        "name",
        "timeout",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "botToken",
        "chatId",
        "variable",
        "profileMode",
        "retry",
        "maxConcurrency",
      ]);
      onSaveNodeConfig({
        sleep,
        name,
        timeout,
        status: NODE_STATUS.RUN,
        onError,
        onSuccess,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
        alertTelegramWhenError,
        botToken,
        chatId,
        variable,
        profileMode,
        retry,
        maxConcurrency,
      });
      onCloseModal();
    } catch {}
  };

  return (
    <Wrapper>
      <Tabs
        onChange={onChange}
        type="card"
        size="small"
        items={[
          {
            label: TAB_NAME[TAB.DETAIL],
            key: TAB.DETAIL,
          },
          {
            label: TAB_NAME[TAB.SETTING],
            key: TAB.SETTING,
          },
          {
            label: TAB_NAME[TAB.SKIP],
            key: TAB.SKIP,
          },
        ]}
        activeKey={activeTab}
      />

      <Form layout="vertical" form={form} initialValues={{ sleep: 0 }}>
        {activeTab === TAB.DETAIL && (
          <Fragment>
            <Form.Item
              label={`${translate("workflow.variableToSaveResult")}:`}
              name="variable"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Input
                placeholder={translate(
                  "workflow.variableToSaveResultPlaceholder",
                )}
                className="custom-input"
                size="large"
                onInput={(e) =>
                  ((e.target as HTMLInputElement).value = (
                    e.target as HTMLInputElement
                  )?.value
                    .toUpperCase()
                    ?.replaceAll(" ", ""))
                }
              />
            </Form.Item>

            <Form.Item
              label="Bot token:"
              name="botToken"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <PasswordInput
                name="botToken"
                placeholder="Enter your Telegram bot token"
              />
            </Form.Item>

            <Form.Item
              label="Chat ID or Username:"
              name="chatId"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
              style={{ marginTop: "-1rem" }}
            >
              <Input
                placeholder="e.g., @channelname or -1001234567890"
                className="custom-input"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Mode:"
              name="profileMode"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                size="large"
                className="custom-select"
                options={[
                  {
                    label: translate("workflow.oneEventAllProfile"),
                    value: TELEGRAM_SNIPER_MODE.ONE_EVENT_ALL_PROFILE,
                  },
                  {
                    label: translate("workflow.oneEventOneProfile"),
                    value: TELEGRAM_SNIPER_MODE.ONE_EVENT_ONE_PROFILE,
                  },
                ]}
              />
            </Form.Item>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && <CommonSetting hideTimeout={true} />}

        {activeTab === TAB.SKIP && (
          <SkipSetting form={form} setIsSkip={setIsSkip} isSkip={isSkip} />
        )}
      </Form>

      <Row justify="end">
        <Button
          onClick={onCloseModal}
          style={{ marginRight: "var(--margin-right)" }}
        >
          {translate("cancel")}
        </Button>
        <Button onClick={onSubmit} type="primary">
          {translate("button.update")}
        </Button>
      </Row>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    preference: state?.Preference?.preference,
  }),
  {},
)(SnipeTelegram);
