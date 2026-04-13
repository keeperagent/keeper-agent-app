import { Form, Button, Row, message, Input, Divider } from "antd";
import { useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  useUpdatePreference,
  useTranslation,
  useCheckModelCapability,
} from "@/hook";
import { IPreference, LLMProvider } from "@/electron/type";
import { PasswordInput } from "@/component/Input";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { ProviderLabel } from "@/page/Setting/ProviderLabel";
import { Wrapper } from "./style";

type IProps = {
  preference: IPreference | null;
};

const LanguageModel = (props: IProps) => {
  const { preference } = props;
  const [form] = Form.useForm();
  const { translate } = useTranslation();
  const { updatePreference, loading, isSuccess } = useUpdatePreference();
  const { checkModelCapability } = useCheckModelCapability();

  useEffect(() => {
    form.setFieldsValue({
      openAIApiKey: preference?.openAIApiKey,
      anthropicApiKey: preference?.anthropicApiKey,
      googleGeminiApiKey: preference?.googleGeminiApiKey,
      openAIModel: preference?.openAIModel,
      anthropicModel: preference?.anthropicModel,
      googleGeminiModel: preference?.googleGeminiModel,
      openAIBackgroundModel: preference?.openAIBackgroundModel,
      anthropicBackgroundModel: preference?.anthropicBackgroundModel,
      googleGeminiBackgroundModel: preference?.googleGeminiBackgroundModel,
    });
  }, [preference]);

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
        openAIBackgroundModel,
        anthropicBackgroundModel,
        googleGeminiBackgroundModel,
      } = await form.validateFields([
        "openAIApiKey",
        "anthropicApiKey",
        "googleGeminiApiKey",
        "openAIModel",
        "anthropicModel",
        "googleGeminiModel",
        "openAIBackgroundModel",
        "anthropicBackgroundModel",
        "googleGeminiBackgroundModel",
      ]);

      // trigger in background
      const listModel: { model: string; provider: LLMProvider }[] = [
        { model: anthropicModel, provider: LLMProvider.CLAUDE },
        { model: openAIModel, provider: LLMProvider.OPENAI },
        { model: googleGeminiModel, provider: LLMProvider.GEMINI },
      ].filter((item) => Boolean(item.model));
      for (const { model, provider } of listModel) {
        checkModelCapability(model, provider);
      }

      await updatePreference({
        id: preference?.id,
        openAIApiKey,
        anthropicApiKey,
        googleGeminiApiKey,
        openAIModel: openAIModel || "",
        anthropicModel: anthropicModel || "",
        googleGeminiModel: googleGeminiModel || "",
        openAIBackgroundModel: openAIBackgroundModel || "",
        anthropicBackgroundModel: anthropicBackgroundModel || "",
        googleGeminiBackgroundModel: googleGeminiBackgroundModel || "",
      });
    } catch {}
  };

  return (
    <Wrapper>
      <Form layout="vertical" form={form}>
        <Form.Item
          label={
            <ProviderLabel
              provider={LLMProvider.CLAUDE}
              label={`${translate("workflow.anthropicApiKeyLabel")}:`}
            />
          }
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

        <Form.Item
          label={`${translate("workflow.anthropicBackgroundModelLabel")}:`}
          name="anthropicBackgroundModel"
          tooltip={translate("workflow.backgroundModelTooltip")}
          style={{ marginTop: "-1rem" }}
        >
          <Input
            className="custom-input"
            placeholder="claude-haiku-4-5-20251001"
            size="large"
          />
        </Form.Item>

        <Divider />

        <Form.Item
          label={
            <ProviderLabel
              provider={LLMProvider.OPENAI}
              label={`${translate("workflow.openAIApiKeyLabel")}:`}
            />
          }
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

        <Form.Item
          label={`${translate("workflow.openAIBackgroundModelLabel")}:`}
          name="openAIBackgroundModel"
          tooltip={translate("workflow.backgroundModelTooltip")}
          style={{ marginTop: "-1rem" }}
        >
          <Input
            className="custom-input"
            placeholder="gpt-4o-mini"
            size="large"
          />
        </Form.Item>

        <Divider />

        <Form.Item
          label={
            <ProviderLabel
              provider={LLMProvider.GEMINI}
              label={`${translate("workflow.googleGeminiApiKeyLabel")}:`}
            />
          }
          name="googleGeminiApiKey"
          tooltip={translate("workflow.googleGeminiApiKeyTooltip")}
        >
          <PasswordInput
            name="googleGeminiApiKey"
            placeholder={translate(
              "workflow.enterGoogleGeminiApiKeyPlaceholder",
            )}
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

        <Form.Item
          label={`${translate("workflow.googleGeminiBackgroundModelLabel")}:`}
          name="googleGeminiBackgroundModel"
          tooltip={translate("workflow.backgroundModelTooltip")}
          style={{ marginTop: "-1rem" }}
        >
          <Input
            className="custom-input"
            placeholder="gemini-2.0-flash"
            size="large"
          />
        </Form.Item>
      </Form>

      <Row justify="end">
        <Button
          type="primary"
          onClick={onSubmitForm}
          loading={loading}
          style={{ marginTop: 0, marginBottom: "var(--margin-bottom)" }}
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
