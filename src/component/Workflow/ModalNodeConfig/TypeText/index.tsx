import { Fragment, useEffect, useState, useMemo } from "react";
import {
  Tabs,
  Form,
  Input,
  InputNumber,
  Row,
  Button,
  Alert,
  Checkbox,
} from "antd";
import { ITypeTextNodeConfig } from "@/electron/type";
import { SELECTOR_TYPE, SELECTOR_NAME } from "@/electron/constant";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { TagOption, Code } from "@/component";
import { SAMPLE_XPATH } from "@/config/constant";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { Wrapper, HelpWrapper } from "./style";
import { TAB, TAB_NAME_EN } from "../util";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";

const { TextArea } = Input;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ITypeTextNodeConfig) => void;
  config: ITypeTextNodeConfig;
  isModalOpen: boolean;
};

const TypeText = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [mode, setMode] = useState(SELECTOR_TYPE.CSS_SELECTOR);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      content: config?.content,
      speed: config?.speed || 0,
      shouldClearInput: config?.shouldClearInput,
      sleep: config?.sleep,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      cssSelector: config?.cssSelector,
      xPathSelector: config?.xPathSelector,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      retry: config?.retry || 0,
    });
    setMode(config?.selectorType || SELECTOR_TYPE.CSS_SELECTOR);
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        content,
        speed,
        shouldClearInput,
        sleep,
        name,
        timeout,
        cssSelector,
        xPathSelector,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        retry,
      } = await form?.validateFields([
        "name",
        "content",
        "speed",
        "shouldClearInput",
        "sleep",
        "timeout",
        "cssSelector",
        "xPathSelector",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "retry",
      ]);
      onSaveNodeConfig({
        name,
        content,
        shouldClearInput,
        sleep,
        speed,
        timeout,
        selectorType: mode,
        cssSelector,
        xPathSelector,
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
            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate(
                    "workflow.contentType",
                  )}:`}</span>
                  <WorkflowVariable form={form} fieldName="content" />
                </FormLabelWrapper>
              }
              name="content"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <TextArea
                placeholder={translate("workflow.placeholderTypeText")}
                className="custom-input"
                size="large"
                rows={2}
              />
            </Form.Item>

            <Form.Item
              label={`${translate("workflow.speedType")}:`}
              name="speed"
            >
              <InputNumber
                placeholder={translate("workflow.egSpeedType")}
                className="custom-input"
                size="large"
                style={{ width: "100%" }}
                min={0}
              />
            </Form.Item>

            <div className="mode">
              <TagOption
                content={SELECTOR_NAME[SELECTOR_TYPE.CSS_SELECTOR]}
                checked={mode === SELECTOR_TYPE.CSS_SELECTOR}
                onClick={() => setMode(SELECTOR_TYPE.CSS_SELECTOR)}
                style={{ fontSize: "1.1rem" }}
              />

              <TagOption
                content={SELECTOR_NAME[SELECTOR_TYPE.XPATH_SELECTOR]}
                checked={mode === SELECTOR_TYPE.XPATH_SELECTOR}
                onClick={() => setMode(SELECTOR_TYPE.XPATH_SELECTOR)}
                style={{ fontSize: "1.1rem" }}
              />
            </div>

            {mode === SELECTOR_TYPE.CSS_SELECTOR && (
              <Form.Item
                label={
                  <FormLabelWrapper>
                    <span className="text">CSS selector:</span>
                    <WorkflowVariable form={form} fieldName="cssSelector" />
                  </FormLabelWrapper>
                }
                name="cssSelector"
                rules={[
                  {
                    required: true,
                    message: translate("form.requiredField"),
                  },
                ]}
              >
                <TextArea
                  placeholder={translate("workflow.enterCssSelector")}
                  className="custom-input"
                  size="large"
                  rows={2}
                />
              </Form.Item>
            )}

            {mode === SELECTOR_TYPE.XPATH_SELECTOR && (
              <Fragment>
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">XPath selector:</span>
                      <WorkflowVariable form={form} fieldName="xPathSelector" />
                    </FormLabelWrapper>
                  }
                  name="xPathSelector"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <TextArea
                    placeholder={translate("workflow.enterXPathSelector")}
                    className="custom-input"
                    size="large"
                    rows={2}
                  />
                </Form.Item>

                <Form.Item style={{ marginTop: "-1rem" }}>
                  <Alert
                    title={
                      <HelpWrapper>
                        <div className="title">
                          {translate("select.example")} <strong>button</strong>{" "}
                          {translate("containWord")}{" "}
                          <strong>Connect Wallet</strong> ,{" "}
                          {translate("pleaseEnter")}:
                        </div>

                        <div className="description">
                          <Code text={SAMPLE_XPATH} isWithCopy={true} />
                        </div>
                      </HelpWrapper>
                    }
                    type="info"
                    showIcon
                    className="help"
                  />
                </Form.Item>
              </Fragment>
            )}

            <Form.Item name="shouldClearInput" valuePropName="checked">
              <Checkbox>{translate("workflow.clearInputBeforeType")}</Checkbox>
            </Form.Item>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && (
          <CommonSetting hideMaxConcurrency={true} />
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

export default TypeText;
