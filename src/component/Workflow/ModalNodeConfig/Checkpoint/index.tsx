import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Select } from "antd";
import {
  ICheckpointNodeConfig,
  IWorkflow,
  IWorkflowVariable,
} from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { RootState } from "@/redux/store";
import { connect } from "react-redux";
import { FormLabelWrapper } from "../style";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import WorkflowVariable from "../../WorkflowVariable";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ICheckpointNodeConfig) => void;
  config: ICheckpointNodeConfig;
  isModalOpen: boolean;
  selectedWorkflow: IWorkflow | null;
};

const Checkpoint = (props: Props) => {
  const { translate, locale } = useTranslation();
  const {
    onCloseModal,
    onSaveNodeConfig,
    config,
    isModalOpen,
    selectedWorkflow,
  } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  const variableOptions = useMemo(() => {
    return (selectedWorkflow?.listVariable || []).map(
      (variable: IWorkflowVariable) => ({
        label: variable?.variable,
        value: variable?.variable,
      }),
    );
  }, [selectedWorkflow]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      variableName: config?.variableName || undefined,
      value: config?.value || "",
      sleep: config?.sleep,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
  }, [isModalOpen, config, form]);

  const onSubmit = async () => {
    try {
      const {
        name,
        variableName,
        value,
        sleep,
        onSuccess,
        onError,
        retry,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
      } = await form?.validateFields([
        "name",
        "variableName",
        "value",
        "sleep",
        "onSuccess",
        "onError",
        "retry",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
      ]);
      onSaveNodeConfig({
        name,
        variableName,
        value,
        sleep,
        status: NODE_STATUS.RUN,
        onSuccess,
        onError,
        retry,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
        alertTelegramWhenError,
      });
      onCloseModal();
    } catch {}
  };

  return (
    <Wrapper>
      <Tabs
        onChange={setActiveTab}
        type="card"
        size="small"
        items={[
          { label: TAB_NAME[TAB.DETAIL], key: TAB.DETAIL },
          { label: TAB_NAME[TAB.SETTING], key: TAB.SETTING },
          { label: TAB_NAME[TAB.SKIP], key: TAB.SKIP },
        ]}
        activeKey={activeTab}
      />

      <Form layout="vertical" form={form} initialValues={{ sleep: 0 }}>
        {activeTab === TAB.DETAIL && (
          <Fragment>
            <Form.Item
              label={`${translate("workflow.variableNameLabel")}:`}
              name="variableName"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                className="custom-select"
                placeholder={translate("select.variable")}
                size="large"
                options={variableOptions}
                showSearch
              />
            </Form.Item>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">{translate("workflow.value")}:</span>
                  <WorkflowVariable
                    form={form}
                    fieldName="value"
                    isAppend={false}
                  />
                </FormLabelWrapper>
              }
              name="value"
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
          </Fragment>
        )}

        {activeTab === TAB.SETTING && <CommonSetting />}

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

export default connect((state: RootState) => ({
  selectedWorkflow: state?.Workflow?.selectedWorkflow,
}))(Checkpoint);
