import { Form, Button, Row, Input, message } from "antd";
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

const GeminiSetting = (props: IProps) => {
  const { preference } = props;
  const [form] = Form.useForm();
  const { translate } = useTranslation();
  const { updatePreference, loading, isSuccess } = useUpdatePreference();
  const { checkModelCapability } = useCheckModelCapability();

  useEffect(() => {
    form.setFieldsValue({
      googleGeminiApiKey: preference?.googleGeminiApiKey,
      googleGeminiModel: preference?.googleGeminiModel,
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
        googleGeminiApiKey,
        googleGeminiModel,
        googleGeminiBackgroundModel,
      } = await form.validateFields([
        "googleGeminiApiKey",
        "googleGeminiModel",
        "googleGeminiBackgroundModel",
      ]);

      if (googleGeminiModel) {
        checkModelCapability(googleGeminiModel, LLMProvider.GEMINI);
      }

      await updatePreference({
        id: preference?.id,
        googleGeminiApiKey,
        googleGeminiModel: googleGeminiModel || "",
        googleGeminiBackgroundModel: googleGeminiBackgroundModel || "",
      }, true);
    } catch {}
  };

  return (
    <Wrapper>
      <Form layout="vertical" form={form}>
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
)(GeminiSetting);
