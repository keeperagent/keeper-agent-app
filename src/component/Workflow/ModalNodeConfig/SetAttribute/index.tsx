import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Alert, Col } from "antd";
import { ISetAttributeNodeConfig } from "@/electron/type";
import { useTranslation } from "@/hook";
import { NODE_STATUS } from "@/electron/constant";
import { TagOption } from "@/component";
import { SET_ATTRIBUTE_MODE } from "@/electron/constant";
import { MinusCircleIcon, SquarePlusIcon } from "@/component/Icon";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ISetAttributeNodeConfig) => void;
  config: ISetAttributeNodeConfig;
  isModalOpen: boolean;
};

const SetAttribute = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [mode, setMode] = useState(SET_ATTRIBUTE_MODE.BASIC);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      variable: config?.variable,
      value: config?.value,
      sleep: config?.sleep,
      name: config?.name,
      comparedValue: config?.comparedValue,
      listValue: config?.listValue || [{ value: "", targetValue: "" }],
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setMode((config?.mode as SET_ATTRIBUTE_MODE) || SET_ATTRIBUTE_MODE.BASIC);
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        variable,
        value,
        name,
        sleep,
        leftSide,
        condition,
        rightSide,
        comparedValue,
        listValue,
      } = await form?.validateFields([
        "variable",
        "value",
        "name",
        "sleep",
        "leftSide",
        "condition",
        "rightSide",
        "comparedValue",
        "listValue",
      ]);

      onSaveNodeConfig({
        name,
        variable,
        value,
        sleep,
        status: NODE_STATUS.RUN,
        mode,
        comparedValue,
        listValue,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
        retry: 0,
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

            <div className="mode">
              <TagOption
                content={translate("basic")}
                checked={mode === SET_ATTRIBUTE_MODE.BASIC}
                onClick={() => setMode(SET_ATTRIBUTE_MODE.BASIC)}
                style={{ fontSize: "1.2rem" }}
              />

              <TagOption
                content={translate("advanced")}
                checked={mode === SET_ATTRIBUTE_MODE.ADVANCED}
                onClick={() => setMode(SET_ATTRIBUTE_MODE.ADVANCED)}
                style={{ fontSize: "1.2rem" }}
              />
            </div>

            {mode === SET_ATTRIBUTE_MODE.BASIC && (
              <Form.Item
                name="value"
                label={
                  <FormLabelWrapper>
                    <span className="text">
                      {translate("workflow.value")}:{" "}
                    </span>
                    <WorkflowVariable form={form} fieldName="value" />
                  </FormLabelWrapper>
                }
              >
                <Input
                  placeholder={translate(
                    "workflow.setAttributeValuePlaceholder",
                  )}
                  className="custom-input"
                  size="large"
                />
              </Form.Item>
            )}

            {mode === SET_ATTRIBUTE_MODE.ADVANCED && (
              <Fragment>
                <Alert
                  title={translate("workflow.selectValueBaseOnCondition")}
                  type="info"
                  showIcon
                  className="help"
                />

                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">{translate("if")}: </span>
                      <WorkflowVariable form={form} fieldName="comparedValue" />
                    </FormLabelWrapper>
                  }
                  name="comparedValue"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <Input
                    placeholder={translate("workflow.enterObjectToCompare")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>

                <Form.List name="listValue">
                  {(fields, { add, remove }) => (
                    <Fragment>
                      {fields.map(({ key, name, ...restField }) => (
                        <Row gutter={8} key={key} align="middle">
                          <Col span={10}>
                            <Form.Item
                              {...restField}
                              label={`${translate("isEqualTo")}:`}
                              name={[name, "targetValue"]}
                            >
                              <Input
                                placeholder={translate(
                                  "workflow.enterValueToCompare",
                                )}
                                className="custom-input"
                                size="large"
                              />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item
                              label={
                                <FormLabelWrapper>
                                  <span style={{ marginRight: "0.5rem" }}>
                                    {translate("workflow.thenValueIs")}:
                                  </span>

                                  <WorkflowVariable
                                    form={form}
                                    fieldName="rightSide"
                                  />
                                </FormLabelWrapper>
                              }
                              {...restField}
                              name={[name, "value"]}
                            >
                              <Input
                                placeholder={translate("workflow.enterResult")}
                                className="custom-input"
                                size="large"
                              />
                            </Form.Item>
                          </Col>

                          <Col span={2}>
                            {fields?.length > 1 && (
                              <div
                                className="minus"
                                onClick={() => remove(name)}
                              >
                                <MinusCircleIcon />
                              </div>
                            )}
                          </Col>
                        </Row>
                      ))}

                      <div className="plus">
                        <span onClick={() => add()}>
                          <SquarePlusIcon />
                        </span>
                      </div>
                    </Fragment>
                  )}
                </Form.List>
              </Fragment>
            )}
          </Fragment>
        )}

        {activeTab === TAB.SETTING && (
          <CommonSetting
            hideCondition={true}
            hideTimeout={true}
            hideTelegramCheckbox={true}
            hideRetry={true}
          />
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

export default SetAttribute;
