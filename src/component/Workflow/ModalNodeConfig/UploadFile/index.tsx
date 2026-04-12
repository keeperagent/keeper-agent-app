import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button } from "antd";
import { IUploadFileNodeConfig } from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { NODE_STATUS, SELECTOR_TYPE, SELECTOR_NAME } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { TagOption } from "@/component";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

const { TextArea } = Input;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IUploadFileNodeConfig) => void;
  config: IUploadFileNodeConfig;
  isModalOpen: boolean;
};

const UploadFile = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [selectorType, setSelectorType] = useState(SELECTOR_TYPE.CSS_SELECTOR);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      cssSelector: config?.cssSelector || "",
      xPathSelector: config?.xPathSelector || "",
      filePath: config?.filePath || "",
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      retry: config?.retry || 0,
    });
    setSelectorType(config?.selectorType || SELECTOR_TYPE.CSS_SELECTOR);
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        name,
        sleep,
        timeout,
        cssSelector,
        xPathSelector,
        filePath,
        onSuccess,
        onError,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        retry,
      } = await form?.validateFields([
        "name",
        "sleep",
        "timeout",
        "cssSelector",
        "xPathSelector",
        "filePath",
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
        sleep,
        timeout,
        selectorType,
        cssSelector,
        xPathSelector,
        filePath,
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
            <div className="mode">
              <TagOption
                content={SELECTOR_NAME[SELECTOR_TYPE.CSS_SELECTOR]}
                checked={selectorType === SELECTOR_TYPE.CSS_SELECTOR}
                onClick={() => setSelectorType(SELECTOR_TYPE.CSS_SELECTOR)}
                style={{ fontSize: "1.1rem" }}
              />
              <TagOption
                content={SELECTOR_NAME[SELECTOR_TYPE.XPATH_SELECTOR]}
                checked={selectorType === SELECTOR_TYPE.XPATH_SELECTOR}
                onClick={() => setSelectorType(SELECTOR_TYPE.XPATH_SELECTOR)}
                style={{ fontSize: "1.1rem" }}
              />
            </div>

            {selectorType === SELECTOR_TYPE.CSS_SELECTOR && (
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

            {selectorType === SELECTOR_TYPE.XPATH_SELECTOR && (
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
            )}

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">File path:</span>
                  <WorkflowVariable form={form} fieldName="filePath" />
                </FormLabelWrapper>
              }
              name="filePath"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Input
                placeholder="/absolute/path/to/file.png"
                className="custom-input"
                size="large"
              />
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

export default UploadFile;
