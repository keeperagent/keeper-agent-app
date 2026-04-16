import { Fragment, useEffect, useState, useMemo } from "react";
import {
  Tabs,
  Form,
  Input,
  Row,
  Button,
  Select,
  Collapse,
  Tooltip,
} from "antd";
import { connect } from "react-redux";
import CodeEditor from "@/component/CodeEditor";
import { IKeyValue, IHttpRequestNodeConfig } from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { HTTP_METHOD, NODE_STATUS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { QuestionIcon } from "@/component/Icon";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";
import { ListKeyValue } from "./ListKeyValue";

const { TextArea } = Input;
const { Option } = Select;

const defaultHeaders: IKeyValue[] = [
  {
    key: "Accept",
    value: "application/json",
  },
  {
    key: "User-Agent",
    value:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  },
];
const defaultCode = "return API_RESPONSE;";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IHttpRequestNodeConfig) => void;
  config: IHttpRequestNodeConfig;
  isModalOpen: boolean;
};

const HttpRequest = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [form] = Form.useForm();
  const [headers, setHeaders] = useState<IKeyValue[]>([]);
  const [params, setParams] = useState<IKeyValue[]>([]);
  const [requestBody, setRequestBody] = useState("");
  const [extractResponseCode, setExtractResponseCode] = useState("");
  const [method, setMethod] = useState(HTTP_METHOD.GET);

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      variable: config?.variable || "API_RESPONSE",
      url: config?.url,
      method: config?.method || HTTP_METHOD.GET,
      sleep: config?.sleep,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      retry: config?.retry || 0,
      maxConcurrency: config?.maxConcurrency || 0,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    if (!config?.variable) {
      setHeaders(defaultHeaders); // if creating config
    } else {
      setHeaders(config?.headers || []);
    }
    setParams(config?.params || []);
    setRequestBody(config?.requestBody || "");
    setExtractResponseCode(config?.extractResponseCode || defaultCode);
    setMethod(config?.method || HTTP_METHOD.GET);
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        variable,
        url,
        method,
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
        maxConcurrency,
      } = await form?.validateFields([
        "variable",
        "url",
        "method",
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
        "maxConcurrency",
      ]);
      onSaveNodeConfig({
        variable,
        url,
        method,
        headers,
        params,
        requestBody,
        extractResponseCode,
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
        maxConcurrency,
      });
      onCloseModal();
    } catch {}
  };

  const handleRequestBodyChange = (value?: string) => {
    setRequestBody(value || "");
  };

  const handleExtractResponseCodeChange = (value?: string) => {
    setExtractResponseCode(value || "");
  };

  const onChangeMethod = (value: HTTP_METHOD) => {
    setMethod(value);
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
                  ).value
                    ?.toUpperCase()
                    ?.replaceAll(" ", ""))
                }
              />
            </Form.Item>

            <Form.Item
              label="Method:"
              name="method"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                className="custom-select"
                size="large"
                onChange={onChangeMethod}
              >
                <Option value={HTTP_METHOD.GET}>
                  <span
                    style={{ color: "var(--color-success)", fontWeight: 500 }}
                  >
                    GET
                  </span>
                </Option>
                <Option value={HTTP_METHOD.POST}>
                  <span
                    style={{ color: "var(--color-brown)", fontWeight: 500 }}
                  >
                    POST
                  </span>
                </Option>
                <Option value={HTTP_METHOD.PUT}>
                  <span style={{ color: "var(--color-blue)", fontWeight: 500 }}>
                    PUT
                  </span>
                </Option>
                <Option value={HTTP_METHOD.DELETE}>
                  <span
                    style={{ color: "var(--color-error)", fontWeight: 500 }}
                  >
                    DELETE
                  </span>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">URL:</span>
                  <WorkflowVariable
                    form={form}
                    fieldName="url"
                    isAppend={true}
                  />
                </FormLabelWrapper>
              }
              name="url"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <TextArea
                placeholder={translate("workflow.enterValidateLinkURL")}
                className="custom-input"
                size="large"
                rows={3}
              />
            </Form.Item>

            <Collapse
              bordered={false}
              ghost
              className="collapse"
              items={[
                {
                  label: "Headers",
                  children: (
                    <ListKeyValue
                      listKeyValue={headers}
                      setListKeyValue={setHeaders}
                    />
                  ),
                },
              ]}
            />

            <Collapse
              bordered={false}
              ghost
              className="collapse"
              items={[
                {
                  label: "Query params",
                  children: (
                    <ListKeyValue
                      listKeyValue={params}
                      setListKeyValue={setParams}
                    />
                  ),
                },
              ]}
            />

            {(method === HTTP_METHOD.POST || method === HTTP_METHOD.PUT) && (
              <Collapse
                bordered={false}
                ghost
                className="collapse"
                items={[
                  {
                    label: "Body",
                    children: (
                      <Form.Item
                        label={
                          <FormLabelWrapper>
                            <span
                              className="text"
                              style={{ fontSize: "1.1rem" }}
                            >
                              JSON request body:
                            </span>
                            <WorkflowVariable />
                          </FormLabelWrapper>
                        }
                      >
                        <CodeEditor
                          height="20rem"
                          language="json"
                          className="code-editor"
                          fontSize={13}
                          value={requestBody}
                          onChange={handleRequestBodyChange}
                        />
                      </Form.Item>
                    ),
                  },
                ]}
              />
            )}

            <Collapse
              bordered={false}
              ghost
              className="collapse"
              items={[
                {
                  label: "Extract response",
                  children: (
                    <Form.Item
                      label={
                        <FormLabelWrapper>
                          <span className="text" style={{ fontSize: "1.1rem" }}>
                            {translate("workflow.jsCodeToExtractResponse")}:
                          </span>
                          <WorkflowVariable useJavascriptVariable={true} />

                          <Tooltip
                            title={translate(
                              "workflow.jsCodeToAnalyzeVariableHelper",
                            )}
                            placement="top"
                          >
                            <span className="question-icon">
                              <QuestionIcon />
                            </span>
                          </Tooltip>
                        </FormLabelWrapper>
                      }
                    >
                      <CodeEditor
                        height="20rem"
                        language="javascript"
                        className="code-editor"
                        fontSize={13}
                        value={extractResponseCode}
                        onChange={handleExtractResponseCodeChange}
                      />
                    </Form.Item>
                  ),
                },
              ]}
            />
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

export default connect(() => ({}), {})(HttpRequest);
