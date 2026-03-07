import { Form, Button, Row, message, Input, Divider } from "antd";
import { useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useUpdatePreference, useTranslation } from "@/hook";
import { IPreference, LLMProvider } from "@/electron/type";
import { PasswordInput } from "@/component/Input";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { Wrapper } from "./style";

type IProps = {
  preference: IPreference | null;
};

const LanguageModel = (props: IProps) => {
  const { preference } = props;
  const [form] = Form.useForm();
  const { translate } = useTranslation();

  useEffect(() => {
    form.setFieldsValue({
      openAIApiKey: preference?.openAIApiKey,
      anthropicApiKey: preference?.anthropicApiKey,
      googleGeminiApiKey: preference?.googleGeminiApiKey,
      openAIModel: preference?.openAIModel,
      anthropicModel: preference?.anthropicModel,
      googleGeminiModel: preference?.googleGeminiModel,
    });
  }, [preference]);

  const { updatePreference, loading, isSuccess } = useUpdatePreference();

  useEffect(() => {
    if (!loading && isSuccess) {
      message.success(translate("updateSuccess"));
    }
  }, [loading, isSuccess]);

  const onSubmitForm = async () => {
    try {
      const {
        openAIApiKey,
        anthropicApiKey,
        googleGeminiApiKey,
        openAIModel,
        anthropicModel,
        googleGeminiModel,
      } = await form.validateFields([
        "openAIApiKey",
        "anthropicApiKey",
        "googleGeminiApiKey",
        "openAIModel",
        "anthropicModel",
        "googleGeminiModel",
      ]);

      await updatePreference({
        id: preference?.id,
        openAIApiKey,
        anthropicApiKey,
        googleGeminiApiKey,
        openAIModel: openAIModel || "",
        anthropicModel: anthropicModel || "",
        googleGeminiModel: googleGeminiModel || "",
      });
    } catch {}
  };

  return (
    <Wrapper>
      <Form layout="vertical" form={form}>
        <Form.Item
          label={`${translate("workflow.anthropicApiKeyLabel")}:`}
          name="anthropicApiKey"
          tooltip={translate("workflow.anthropicApiKeyTooltip")}
        >
          <PasswordInput
            name="anthropicApiKey"
            placeholder={translate("workflow.enterAnthropicApiKeyPlaceholder")}
            extendClass="anthropicApiKey"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("workflow.anthropicModelLabel")}:`}
          name="anthropicModel"
          tooltip={translate("workflow.anthropicModelTooltip")}
          style={{ marginTop: "-1rem" }}
        >
          <Input
            className="custom-input"
            placeholder={DEFAULT_LLM_MODELS[LLMProvider.CLAUDE]}
            size="large"
          />
        </Form.Item>

        <Divider />

        <Form.Item
          label={`${translate("workflow.openAIApiKeyLabel")}:`}
          name="openAIApiKey"
          tooltip={translate("workflow.openAIApiKeyTooltip")}
        >
          <PasswordInput
            name="openAIApiKey"
            placeholder={translate("workflow.enterOpenAIApiKeyPlaceholder")}
            extendClass="openAIApiKey"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("workflow.openAIModelLabel")}:`}
          name="openAIModel"
          tooltip={translate("workflow.openAIModelTooltip")}
          style={{ marginTop: "-1rem" }}
        >
          <Input
            className="custom-input"
            placeholder={DEFAULT_LLM_MODELS[LLMProvider.OPENAI]}
            size="large"
          />
        </Form.Item>

        <Divider />

        <Form.Item
          label={`${translate("workflow.googleGeminiApiKeyLabel")}:`}
          name="googleGeminiApiKey"
          tooltip={translate("workflow.googleGeminiApiKeyTooltip")}
        >
          <PasswordInput
            name="googleGeminiApiKey"
            placeholder={translate("workflow.enterGoogleGeminiApiKeyPlaceholder")}
            extendClass="googleGeminiApiKey"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("workflow.googleGeminiModelLabel")}:`}
          name="googleGeminiModel"
          tooltip={translate("workflow.googleGeminiModelTooltip")}
          style={{ marginTop: "-1rem" }}
        >
          <Input
            className="custom-input"
            placeholder={DEFAULT_LLM_MODELS[LLMProvider.GEMINI]}
            size="large"
          />
        </Form.Item>
      </Form>

      <Row justify="end">
        <Button
          type="primary"
          onClick={onSubmitForm}
          loading={loading}
          style={{ marginTop: 0 }}
        >
          {translate("save")}
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
)(LanguageModel);
