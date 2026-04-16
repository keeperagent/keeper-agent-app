import { Fragment, useEffect, useState, useMemo } from "react";
import { connect } from "react-redux";
import { Tabs, Form, Input, Row, Button } from "antd";
import CodeEditor from "@/component/CodeEditor";
import { IExecuteCodeNodeConfig } from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { TagOption } from "@/component";
import { DEFAULT_EXECUTE_CODE_VARIABLE } from "@/electron/constant";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "@/component/Workflow/ModalNodeConfig/common/util";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";
import SkipSetting from "@/component/Workflow/ModalNodeConfig/common/SkipSetting";
import WorkflowVariable from "@/component/Workflow/WorkflowVariable";
import { FormLabelWrapper } from "@/component/Workflow/ModalNodeConfig/common/sharedStyle";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IExecuteCodeNodeConfig) => void;
  config: IExecuteCodeNodeConfig;
  isModalOpen: boolean;
};

const ExecuteCode = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [useBrowser, setUseBrowser] = useState(false);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      variable: config?.variable || DEFAULT_EXECUTE_CODE_VARIABLE,
      sleep: config?.sleep,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      retry: config?.retry || 0,
    });
    setCodeValue(config?.code || "return 'Write your code here';");
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setUseBrowser(Boolean(config?.useBrowser));
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const handleEditorChange = (value?: string) => {
    setCodeValue(value || "");
  };

  const onSubmit = async () => {
    try {
      const {
        variable,
        sleep,
        name,
        onSuccess,
        timeout,
        onError,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        retry,
      } = await form?.validateFields([
        "variable",
        "sleep",
        "name",
        "timeout",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "retry",
      ]);
      onSaveNodeConfig({
        variable,
        code: codeValue,
        useBrowser,
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
              label={`${translate("workflow.returnVariable")}:`}
              name="variable"
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
                content={translate("workflow.withoutBrowser")}
                checked={!useBrowser}
                onClick={() => setUseBrowser(false)}
                style={{ fontSize: "1.1rem" }}
              />

              <TagOption
                content={translate("workflow.runInsideBrowser")}
                checked={useBrowser}
                onClick={() => setUseBrowser(true)}
                style={{ fontSize: "1.1rem" }}
              />
            </div>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">Javascript code:</span>
                  <WorkflowVariable useJavascriptVariable={true} />
                </FormLabelWrapper>
              }
            >
              <CodeEditor
                height="30rem"
                language="javascript"
                value={codeValue}
                onChange={handleEditorChange}
                className="code-editor"
                fontSize={14}
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

export default connect(() => ({}), {})(ExecuteCode);
