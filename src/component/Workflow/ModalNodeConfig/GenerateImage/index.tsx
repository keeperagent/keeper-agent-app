import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Select, Col } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  IGenerateImageNodeConfig,
  LLMProvider,
  OPENAI_IMAGE_SIZE,
  OPENAI_IMAGE_QUALITY,
  GOOGLE_IMAGE_ASPECT_RATIO,
} from "@/electron/type";
import LlmProviderPicker from "@/component/LlmProviderPicker";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { NODE_STATUS } from "@/electron/constant";
import { useChooseFolder, useTranslation } from "@/hook";
import { UploadIcon } from "@/component/Icon";
import { IconWrapper, Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

const { TextArea } = Input;
const IMAGE_PROVIDER_BLACKLIST = [LLMProvider.CLAUDE];

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IGenerateImageNodeConfig) => void;
  config: IGenerateImageNodeConfig;
  isModalOpen: boolean;
};

const GenerateImage = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [provider, setProvider] = useState<LLMProvider>(LLMProvider.OPENAI);
  const [form] = Form.useForm();

  const { chooseFolder } = useChooseFolder();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    const currentProvider = config?.provider || LLMProvider.OPENAI;
    setProvider(currentProvider);
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
      variable: config?.variable || "IMAGE_PATH",
      prompt: config?.prompt,
      provider: currentProvider,
      model:
        config?.model ||
        (currentProvider === LLMProvider.OPENAI
          ? "gpt-4o"
          : "imagen-3.0-generate-001"),
      size: config?.size || OPENAI_IMAGE_SIZE.SIZE_1024_1024,
      quality: config?.quality || OPENAI_IMAGE_QUALITY.MEDIUM,
      aspectRatio: config?.aspectRatio || GOOGLE_IMAGE_ASPECT_RATIO.SQUARE,
      folderPath: config?.folderPath || "",
      fileName: config?.fileName || "",
      retry: config?.retry || 0,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
  }, [isModalOpen, config, form]);

  const onProviderChange = (value: string) => {
    const llmProvider = value as LLMProvider;
    setProvider(llmProvider);
    form.setFieldsValue({
      model:
        llmProvider === LLMProvider.OPENAI
          ? "gpt-4o"
          : "imagen-3.0-generate-001",
    });
  };

  const onChooseFolder = async () => {
    const folderPath = await chooseFolder();
    if (folderPath === null) {
      return;
    }
    form.setFieldValue("folderPath", folderPath);
    try {
      await form.validateFields(["folderPath"]);
    } catch {}
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
        prompt,
        model,
        folderPath,
        fileName,
        size,
        quality,
        aspectRatio,
        retry,
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
        "prompt",
        "provider",
        "model",
        "folderPath",
        "fileName",
        "size",
        "quality",
        "aspectRatio",
        "retry",
      ]);
      onSaveNodeConfig({
        sleep,
        name,
        timeout,
        status: NODE_STATUS.RUN,
        onError,
        onSuccess,
        skipSetting: { leftSide, rightSide, condition, isSkip },
        alertTelegramWhenError,
        variable,
        prompt,
        provider,
        model,
        folderPath,
        fileName,
        size,
        quality,
        aspectRatio,
        retry,
      });
      onCloseModal();
    } catch {}
  };

  const isOpenAI = provider === LLMProvider.OPENAI;

  return (
    <Wrapper>
      <Tabs
        onChange={(key) => setActiveTab(key)}
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
            <Form.Item label="Provider:" name="provider">
              <LlmProviderPicker
                listBlackList={IMAGE_PROVIDER_BLACKLIST}
                onChange={onProviderChange}
              />
            </Form.Item>

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
              label={
                <FormLabelWrapper>
                  <span className="text">Prompt:</span>
                  <WorkflowVariable form={form} fieldName="prompt" />
                </FormLabelWrapper>
              }
              name="prompt"
              rules={[
                { required: true, message: translate("form.requiredField") },
              ]}
            >
              <TextArea
                placeholder={translate("workflow.enterPromptPlaceholder")}
                className="custom-input"
                size="large"
                rows={7}
              />
            </Form.Item>

            <Form.Item
              label={`${translate("workflow.modelName")}:`}
              name="model"
              rules={[
                { required: true, message: translate("form.requiredField") },
              ]}
            >
              <Input
                placeholder={isOpenAI ? "gpt-4o" : "imagen-3.0-generate-001"}
                className="custom-input"
                size="large"
              />
            </Form.Item>

            {isOpenAI ? (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={`${translate("workflow.imageSize")}:`}
                    name="size"
                  >
                    <Select
                      className="custom-select"
                      size="large"
                      options={[
                        {
                          label: "1024 x 1024",
                          value: OPENAI_IMAGE_SIZE.SIZE_1024_1024,
                        },
                        {
                          label: "1024 x 1536",
                          value: OPENAI_IMAGE_SIZE.SIZE_1024_1536,
                        },
                        {
                          label: "1536 x 1024",
                          value: OPENAI_IMAGE_SIZE.SIZE_1536_1024,
                        },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={`${translate("workflow.imageQuality")}:`}
                    name="quality"
                  >
                    <Select
                      className="custom-select"
                      size="large"
                      options={[
                        { label: "Low", value: OPENAI_IMAGE_QUALITY.LOW },
                        { label: "Medium", value: OPENAI_IMAGE_QUALITY.MEDIUM },
                        { label: "High", value: OPENAI_IMAGE_QUALITY.HIGH },
                        { label: "Auto", value: OPENAI_IMAGE_QUALITY.AUTO },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            ) : (
              <Form.Item label="Aspect ratio:" name="aspectRatio">
                <Select
                  className="custom-select"
                  size="large"
                  options={[
                    {
                      label: "1:1 (Square)",
                      value: GOOGLE_IMAGE_ASPECT_RATIO.SQUARE,
                    },
                    {
                      label: "3:4 (Portrait)",
                      value: GOOGLE_IMAGE_ASPECT_RATIO.PORTRAIT_3_4,
                    },
                    {
                      label: "4:3 (Landscape)",
                      value: GOOGLE_IMAGE_ASPECT_RATIO.LANDSCAPE_4_3,
                    },
                    {
                      label: "9:16 (Tall portrait)",
                      value: GOOGLE_IMAGE_ASPECT_RATIO.PORTRAIT_9_16,
                    },
                    {
                      label: "16:9 (Wide landscape)",
                      value: GOOGLE_IMAGE_ASPECT_RATIO.LANDSCAPE_16_9,
                    },
                  ]}
                />
              </Form.Item>
            )}

            <Form.Item
              label="Folder path:"
              name="folderPath"
              rules={[
                { required: true, message: translate("form.requiredField") },
              ]}
            >
              <Input
                placeholder="Enter folder path to save the image"
                className="custom-input"
                size="large"
                addonAfter={
                  <IconWrapper onClick={onChooseFolder}>
                    <UploadIcon />
                  </IconWrapper>
                }
              />
            </Form.Item>

            <Form.Item
              label="File name:"
              name="fileName"
              rules={[
                { required: true, message: translate("form.requiredField") },
              ]}
            >
              <Input
                placeholder="For example: output_image.png"
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

export default connect((_state: RootState) => ({}), {})(GenerateImage);
