import { Form, Button, Row, Input, Switch, Typography, message } from "antd";
import { useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  useUpdatePreference,
  useTranslation,
  useCheckModelCapability,
} from "@/hook";
import { useCheckCodexCLIAvailable } from "@/hook/preference";
import { IPreference, LLMProvider } from "@/electron/type";
import { PasswordInput } from "@/component/Input";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { ProviderLabel } from "@/page/Setting/ProviderLabel";
import { Wrapper } from "./style";

const { Text } = Typography;

type IProps = {
  preference: IPreference | null;
};

const OpenAISetting = (props: IProps) => {
  const { preference } = props;
  const [form] = Form.useForm();
  const { translate } = useTranslation();
  const { updatePreference, loading, isSuccess } = useUpdatePreference();
  const { checkModelCapability } = useCheckModelCapability();
  const { checkCodexCLIAvailable } = useCheckCodexCLIAvailable();

  useEffect(() => {
    form.setFieldsValue({
      openAIApiKey: preference?.openAIApiKey,
      openAIModel: preference?.openAIModel,
      openAIBackgroundModel: preference?.openAIBackgroundModel,
    });
  }, [preference]);

  useEffect(() => {
    if (!loading && isSuccess) {
      message.success(translate("updateSuccess"));
    }
  }, [loading, isSuccess]);

  const onToggleCodexCLI = async (checked: boolean) => {
    if (checked) {
      const available = await checkCodexCLIAvailable();
      if (!available) {
        message.error(translate("setting.useCodexCLINotAvailable"));
        return;
      }
    }
    updatePreference({ id: preference?.id, useCodexCLI: checked }, true);
  };

  const onSubmitForm = async () => {
    try {
      const { openAIApiKey, openAIModel, openAIBackgroundModel } =
        await form.validateFields([
          "openAIApiKey",
          "openAIModel",
          "openAIBackgroundModel",
        ]);

      if (openAIModel) {
        checkModelCapability(openAIModel, LLMProvider.OPENAI);
      }

      await updatePreference({
        id: preference?.id,
        openAIApiKey,
        openAIModel: openAIModel || "",
        openAIBackgroundModel: openAIBackgroundModel || "",
      });
    } catch {}
  };

  return (
    <Wrapper>
      <Form layout="vertical" form={form}>
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
          style={{ marginTop: "-1.5rem" }}
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
        >
          <Input
            className="custom-input"
            placeholder="gpt-4o-mini"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("setting.useCodexCLI")}:`}
          tooltip={translate("setting.useCodexCLITooltip")}
        >
          <Switch
            checked={Boolean(preference?.useCodexCLI)}
            onChange={onToggleCodexCLI}
          />

          {preference?.useCodexCLI && (
            <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
              {translate("setting.useCodexCLIActive")}
            </Text>
          )}
        </Form.Item>
      </Form>

      <Row justify="end">
        <Button type="primary" onClick={onSubmitForm} loading={loading}>
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
)(OpenAISetting);
