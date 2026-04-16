import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Select, Col } from "antd";
import { ICheckConditionNodeConfig } from "@/electron/type";
import { NODE_ACTION } from "@/electron/simulator/constant";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { COMPARISION_EXPRESSION } from "@/electron/constant";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "@/component/Workflow/ModalNodeConfig/common/util";
import WorkflowVariable from "@/component/Workflow/WorkflowVariable";
import { FormLabelWrapper } from "@/component/Workflow/ModalNodeConfig/common/sharedStyle";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ICheckConditionNodeConfig) => void;
  config: ICheckConditionNodeConfig;
  isModalOpen: boolean;
};

export const listCondition = (translate: (key: string) => string) => [
  { value: COMPARISION_EXPRESSION.LARGER, label: translate("isGreaterThan") },
  { value: COMPARISION_EXPRESSION.SMALLER, label: translate("isLessThan") },
  { value: COMPARISION_EXPRESSION.EQUAL, label: translate("isEqual") },
  { value: COMPARISION_EXPRESSION.NOT_EQUAL, label: translate("isNotEqual") },
];

const CheckCondition = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      sleep: config?.sleep,
      name: config?.name,
      leftSide: config?.leftSide,
      condition: config?.condition,
      rightSide: config?.rightSide || "",
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      maxConcurrency: config?.maxConcurrency || 0,
    });
    setActiveTab(TAB.DETAIL);
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        sleep,
        name,
        leftSide,
        condition,
        rightSide,
        onSuccess,
        onError,
        maxConcurrency,
      } = await form?.validateFields([
        "sleep",
        "name",
        "leftSide",
        "condition",
        "rightSide",
        "onSuccess",
        "onError",
        "maxConcurrency",
      ]);
      onSaveNodeConfig({
        sleep,
        name,
        leftSide,
        condition,
        rightSide,
        status: NODE_STATUS.RUN,
        onError,
        onSuccess,
        retry: 0,
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
        ]}
        activeKey={activeTab}
      />

      <Form layout="vertical" form={form} initialValues={{ sleep: 0 }}>
        {activeTab === TAB.DETAIL ? (
          <Fragment>
            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">{translate("if")}: </span>
                  <WorkflowVariable form={form} fieldName="leftSide" />
                </FormLabelWrapper>
              }
              name="leftSide"
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

            <Row gutter={8}>
              <Col span={10}>
                <Form.Item
                  label={`${translate("workflow.condition")}:`}
                  name="condition"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <Select
                    className="custom-select"
                    placeholder={translate("workflow.selectCondition")}
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

              <Col span={14}>
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <WorkflowVariable form={form} fieldName="rightSide" />
                    </FormLabelWrapper>
                  }
                  name="rightSide"
                >
                  <Input
                    placeholder={translate("workflow.enterValueToCompare")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <CommonSetting
              hideTimeout={true}
              hideWaitingTime={true}
              hideTelegramCheckbox={true}
              hideRetry={true}
            />
          </Fragment>
        ) : (
          <Fragment>
            <CommonSetting
              hideTimeout={true}
              hideTelegramCheckbox={true}
              hideCondition={true}
              hideRetry={true}
            />
          </Fragment>
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

export default CheckCondition;
