import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Select, Col } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  IGenerateImageNodeConfig,
  OPENAI_IMAGE_SIZE,
  OPENAI_IMAGE_QUALITY,
  IPreference,
} from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { NODE_STATUS } from "@/electron/constant";
import { useChooseFolder, useTranslation } from "@/hook";
import { PasswordInput } from "@/component/Input";
import { UploadIcon } from "@/component/Icon";
import { IconWrapper, Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

const { TextArea } = Input;
const { Option } = Select;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IGenerateImageNodeConfig) => void;
  config: IGenerateImageNodeConfig;
  isModalOpen: boolean;
  preference: IPreference | null;
};

const GenerateImage = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen, preference } =
    props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [form] = Form.useForm();

  const { chooseFolder } = useChooseFolder();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

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

      variable: config?.variable || "IMAGE_PATH",
      prompt: config?.prompt,
      model: config?.model || "gpt-4o-mini",
      folderPath: config?.folderPath || "",
      fileName: config?.fileName || "",
      size: config?.size || OPENAI_IMAGE_SIZE.SIZE_1024_1024,
      quality: config?.quality || OPENAI_IMAGE_QUALITY.MEDIUM,
      apiKey: config?.apiKey || preference?.openAIApiKey,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
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
        apiKey,
        folderPath,
        fileName,
        size,
        quality,
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
        "model",
        "apiKey",
        "folderPath",
        "fileName",
        "size",
        "quality",
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
        prompt,
        model,
        apiKey,
        folderPath,
        fileName,
        size,
        quality,
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

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">Prompt:</span>
                  <WorkflowVariable form={form} fieldName="prompt" />
                </FormLabelWrapper>
              }
              name="prompt"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <TextArea
                placeholder={translate("workflow.enterPromptPlaceholder")}
                className="custom-input"
                size="large"
                rows={9}
              />
            </Form.Item>

            <Form.Item
              label={`${translate("workflow.modelName")}:`}
              name="model"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Input
                placeholder={translate("workflow.modelNamePlaceholder")}
                className="custom-input"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="OpenAI API key:"
              name="apiKey"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <PasswordInput
                name="apiKey"
                placeholder={translate("workflow.enterApiKeyPlaceholder")}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={`${translate("workflow.imageSize")}:`}
                  name="size"
                >
                  <Select className="custom-select" size="large">
                    <Option
                      key={OPENAI_IMAGE_SIZE?.SIZE_1024_1024}
                      value={OPENAI_IMAGE_SIZE?.SIZE_1024_1024}
                    >
                      1024 x 1024
                    </Option>

                    <Option
                      key={OPENAI_IMAGE_SIZE?.SIZE_1024_1536}
                      value={OPENAI_IMAGE_SIZE?.SIZE_1024_1536}
                    >
                      1024 x 1536
                    </Option>

                    <Option
                      key={OPENAI_IMAGE_SIZE?.SIZE_1536_1024}
                      value={OPENAI_IMAGE_SIZE?.SIZE_1536_1024}
                    >
                      1536 x 1024
                    </Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label={`${translate("workflow.imageQuality")}:`}
                  name="quality"
                >
                  <Select className="custom-select" size="large">
                    <Option
                      key={OPENAI_IMAGE_QUALITY?.LOW}
                      value={OPENAI_IMAGE_QUALITY?.LOW}
                    >
                      Low
                    </Option>

                    <Option
                      key={OPENAI_IMAGE_QUALITY?.MEDIUM}
                      value={OPENAI_IMAGE_QUALITY?.MEDIUM}
                    >
                      Medium
                    </Option>

                    <Option
                      key={OPENAI_IMAGE_QUALITY?.HIGH}
                      value={OPENAI_IMAGE_QUALITY?.HIGH}
                    >
                      High
                    </Option>

                    <Option
                      key={OPENAI_IMAGE_QUALITY?.AUTO}
                      value={OPENAI_IMAGE_QUALITY?.AUTO}
                    >
                      Auto
                    </Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Folder path:"
              name="folderPath"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
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
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
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

export default connect(
  (state: RootState) => ({
    preference: state?.Preference?.preference,
  }),
  {},
)(GenerateImage);
