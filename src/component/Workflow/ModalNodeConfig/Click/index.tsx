import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Alert, Tooltip, Collapse } from "antd";
import { IClickNodeConfig } from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { SELECTOR_TYPE, SELECTOR_NAME, NODE_STATUS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { TagOption, Code } from "@/component";
import { SAMPLE_XPATH } from "@/config/constant";
import { MinusCircleIcon, SquarePlusIcon } from "@/component/Icon";
import { Wrapper, HelpWrapper } from "./style";
import { TAB, TAB_NAME_EN } from "../util";
import CommonSetting from "../CommonSetting";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";
import SkipSetting from "../SkipSetting";

const { TextArea } = Input;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IClickNodeConfig) => void;
  config: IClickNodeConfig;
  isModalOpen: boolean;
};

const Click = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [mode, setMode] = useState(SELECTOR_TYPE.CSS_SELECTOR);
  const [activeKey, setActiveKey] = useState("0");
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      cssSelector: config?.cssSelector,
      listShadowRoot: config?.listShadowRoot,
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

    if ((config?.listShadowRoot?.length || 0) > 0) {
      setActiveKey("1");
    }
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        sleep,
        name,
        timeout,
        cssSelector,
        xPathSelector,
        listShadowRoot,
        onError,
        onSuccess,
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
        "listShadowRoot",
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
        selectorType: mode,
        cssSelector,
        xPathSelector,
        listShadowRoot,
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

  const renderShadowRoot = () => {
    return (
      <Form.List name="listShadowRoot">
        {(fields, { add, remove }) => (
          <Row justify="center">
            {fields.map(({ key, name, ...restField }) => {
              return (
                <div className="item" key={key}>
                  <Form.Item
                    {...restField}
                    name={[name]}
                    rules={[
                      {
                        required: true,
                        message: translate("form.requiredField"),
                      },
                    ]}
                    style={{ width: "100%", margin: 0 }}
                  >
                    <Input
                      placeholder={translate("workflow.enter.listShadowRoot")}
                      className="custom-input"
                      size="large"
                    />
                  </Form.Item>

                  {fields?.length > 0 && (
                    <div className="icon" onClick={() => remove(name)}>
                      <MinusCircleIcon />
                    </div>
                  )}
                </div>
              );
            })}

            <Tooltip title={translate("workflow.add.listShadowRoot")}>
              <div className="plus" onClick={() => add()}>
                <SquarePlusIcon />
              </div>
            </Tooltip>
          </Row>
        )}
      </Form.List>
    );
  };

  const onCollapse = (keys: string | string[]) => {
    setActiveKey(keys[1]);
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
                    placeholder={translate("workflow.enterCssSelector")}
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

            {mode === SELECTOR_TYPE.CSS_SELECTOR && (
              <Collapse
                bordered={false}
                ghost
                activeKey={activeKey}
                items={[
                  {
                    label: `shadowRoot (${translate("skipIfNotUse")})`,
                    children: renderShadowRoot(),
                    key: "1",
                  },
                ]}
                className="collapse"
                onChange={onCollapse}
              />
            )}
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

export default Click;
