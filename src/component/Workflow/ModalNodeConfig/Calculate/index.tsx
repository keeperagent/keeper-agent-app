import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Col, Button, Select, InputNumber } from "antd";
import { ICalculateNodeConfig } from "@/electron/type";
import { NODE_ACTION } from "@/electron/simulator/constant";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { MATH_EQUATION } from "@/electron/constant";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import WorkflowVariable from "../WorkflowVariable";
import { FormLabelWrapper } from "../style";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ICalculateNodeConfig) => void;
  config: ICalculateNodeConfig;
  isModalOpen: boolean;
};

const listCondition = (translate: (key: string) => string) => [
  { value: MATH_EQUATION.ADD, label: translate("workflow.add") },
  { value: MATH_EQUATION.SUBSTRACT, label: translate("workflow.substract") },
  { value: MATH_EQUATION.MULTIPLY, label: translate("workflow.multiply") },
  { value: MATH_EQUATION.DEVIDE, label: translate("workflow.divide") },
];

const Calculate = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      sleep: config?.sleep,
      name: config?.name,
      variable: config?.variable || "CALCULATED_VALUE",
      decimal: config?.decimal,
      leftSideEquation: config?.leftSideEquation,
      equation: config?.equation,
      rightSideEquation: config?.rightSideEquation,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
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
        decimal,
        variable,
        leftSideEquation,
        equation,
        rightSideEquation,
        onSuccess,
        onError,
        leftSide,
        condition,
        rightSide,
      } = await form?.validateFields([
        "sleep",
        "name",
        "decimal",
        "variable",
        "onSuccess",
        "onError",
        "leftSideEquation",
        "equation",
        "rightSideEquation",
        "leftSide",
        "condition",
        "rightSide",
      ]);
      onSaveNodeConfig({
        sleep,
        name,
        decimal,
        variable,
        leftSideEquation,
        equation,
        rightSideEquation,
        status: NODE_STATUS.RUN,
        onSuccess,
        onError,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
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

            <Row gutter={8}>
              <Col span={8}>
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <WorkflowVariable
                        form={form}
                        fieldName="leftSideEquation"
                      />
                    </FormLabelWrapper>
                  }
                  name="leftSideEquation"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <Input
                    placeholder={translate("workflow.enterValue")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label={`${translate("workflow.equation")}:`}
                  name="equation"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <Select
                    className="custom-select"
                    placeholder="+ - x /"
                    size="large"
                    options={listCondition(translate)?.map(
                      (condition: any) => ({
                        value: condition?.value,
                        label: condition?.label,
                      }),
                    )}
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <WorkflowVariable
                        form={form}
                        fieldName="rightSideEquation"
                      />
                    </FormLabelWrapper>
                  }
                  name="rightSideEquation"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <Input
                    placeholder={translate("workflow.enterValue")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={`${translate("workflow.decimal")}:`}
              name="decimal"
            >
              <InputNumber
                placeholder={translate("workflow.decimalPlaceholder")}
                className="custom-input-number"
                min={0}
                size="large"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && (
          <CommonSetting hideTimeout={true} hideTelegramCheckbox={true} />
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

export default Calculate;
