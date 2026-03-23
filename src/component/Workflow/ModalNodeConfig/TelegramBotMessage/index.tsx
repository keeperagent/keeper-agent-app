import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Alert } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { IPreference, ISendTelegramNodeConfig } from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { NODE_STATUS } from "@/electron/constant";
import { Code } from "@/component";
import { useTranslation } from "@/hook";
import { Wrapper, HelpWrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";
import { PasswordInput } from "@/component/Input";

const { TextArea } = Input;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ISendTelegramNodeConfig) => void;
  config: ISendTelegramNodeConfig;
  isModalOpen: boolean;
  preference: IPreference | null;
};

const TelegramBotMessage = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen, preference } =
    props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      chatId: config?.chatId || preference?.chatIdTelegram,
      botToken: config?.botToken || preference?.botTokenTelegram,
      message: config?.message,
      imageGIF: config?.imageGIF,
      sleep: config?.sleep,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      retry: config?.retry || 0,
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
        botToken,
        chatId,
        message,
        imageGIF,
        sleep,
        name,
        onSuccess,
        timeout,
        onError,
        leftSide,
        condition,
        rightSide,
        retry,
      } = await form?.validateFields([
        "botToken",
        "chatId",
        "message",
        "imageGIF",
        "sleep",
        "name",
        "timeout",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "retry",
      ]);
      onSaveNodeConfig({
        botToken,
        chatId,
        message,
        imageGIF,
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
        retry,
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
            <Alert
              title={
                <HelpWrapper>
                  <div className="title">
                    {translate("workflow.findChatIdHelper")}:
                  </div>

                  <div className="description">
                    <Code
                      text={
                        "https://api.telegram.org/bot<your_bot_token>/getUpdates"
                      }
                      isWithCopy={true}
                    />
                  </div>
                </HelpWrapper>
              }
              type="info"
              className="help"
            />

            <Form.Item
              label="Chat ID:"
              name="chatId"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
              style={{ marginTop: "-0.5rem" }}
            >
              <Input
                placeholder={translate("workflow.chatIdPlaceholder")}
                className="custom-input"
                size="large"
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
                placeholder={translate("setting.enterBotToken")}
              />
            </Form.Item>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate(
                    "workflow.message",
                  )}:`}</span>
                  <WorkflowVariable
                    form={form}
                    fieldName="message"
                    isAppend={true}
                  />
                </FormLabelWrapper>
              }
              name="message"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
              style={{ marginTop: "-1rem" }}
            >
              <TextArea
                placeholder={translate("workflow.enterTelegramMessage")}
                className="custom-input"
                size="large"
                rows={7}
              />
            </Form.Item>

            <Form.Item
              label={`${translate("workflow.gifImage")}:`}
              name="imageGIF"
            >
              <TextArea
                placeholder={translate("workflow.gifImagePlaceholder")}
                className="custom-input"
                size="large"
                rows={2}
              />
            </Form.Item>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && (
          <CommonSetting hideTelegramCheckbox={true} />
        )}

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
)(TelegramBotMessage);
