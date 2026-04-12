import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Select, Row, Button } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  IAgentProfile,
  IRunAgentNodeConfig,
  RUN_AGENT_OUTPUT_FORMAT,
} from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { useGetListAgentProfile } from "@/hook/agentProfile";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

const { TextArea } = Input;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IRunAgentNodeConfig) => void;
  config: IRunAgentNodeConfig;
  isModalOpen: boolean;
  listAgentProfile: IAgentProfile[];
};

const RunAgent = (props: Props) => {
  const { translate, locale } = useTranslation();
  const {
    onCloseModal,
    onSaveNodeConfig,
    config,
    isModalOpen,
    listAgentProfile,
  } = props;
  const { getListAgentProfile } = useGetListAgentProfile();

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    getListAgentProfile({ page: 1, pageSize: 1000 });
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
      variable: config?.variable || "AGENT_OUTPUT",
      agentProfileId: config?.agentProfileId,
      promptTemplate: config?.promptTemplate,
      outputFormat: config?.outputFormat || RUN_AGENT_OUTPUT_FORMAT.TEXT,
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
        variable,
        agentProfileId,
        promptTemplate,
        outputFormat,
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
        "variable",
        "agentProfileId",
        "promptTemplate",
        "outputFormat",
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
        variable,
        agentProfileId,
        promptTemplate,
        outputFormat,
        retry,
        maxConcurrency,
      });
      onCloseModal();
    } catch {}
  };

  const agentProfileOptions = listAgentProfile.map((agentProfile) => ({
    label: agentProfile.name,
    value: agentProfile.id,
  }));

  return (
    <Wrapper>
      <Tabs
        onChange={onChange}
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
              label={`${translate("workflow.variableToSaveResult")}:`}
              name="variable"
              rules={[
                { required: true, message: translate("form.requiredField") },
              ]}
            >
              <Input
                placeholder={translate(
                  "workflow.variableToSaveResultPlaceholder",
                )}
                className="custom-input"
                size="large"
                onInput={(inputEvent) =>
                  ((inputEvent.target as HTMLInputElement).value = (
                    inputEvent.target as HTMLInputElement
                  ).value
                    .toUpperCase()
                    .replaceAll(" ", ""))
                }
              />
            </Form.Item>

            <Form.Item
              label="Agent profile:"
              name="agentProfileId"
              rules={[
                { required: true, message: translate("form.requiredField") },
              ]}
            >
              <Select
                className="custom-select"
                size="large"
                placeholder="Select an agent profile"
                options={agentProfileOptions}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">Prompt:</span>
                  <WorkflowVariable form={form} fieldName="promptTemplate" />
                </FormLabelWrapper>
              }
              name="promptTemplate"
              rules={[
                { required: true, message: translate("form.requiredField") },
              ]}
            >
              <TextArea
                placeholder={translate("workflow.enterPromptPlaceholder")}
                className="custom-input"
                size="large"
                rows={5}
              />
            </Form.Item>

            <Form.Item label="Output format:" name="outputFormat">
              <Select
                className="custom-select"
                size="large"
                options={[
                  { label: "Text", value: RUN_AGENT_OUTPUT_FORMAT.TEXT },
                  { label: "JSON", value: RUN_AGENT_OUTPUT_FORMAT.JSON },
                ]}
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

export default connect(
  (state: RootState) => ({
    listAgentProfile: state?.AgentProfile?.listAgentProfile || [],
  }),
  {},
)(RunAgent);
