import { Form, Button, Row, Input, Switch, Typography, message } from "antd";
import { useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  useUpdatePreference,
  useTranslation,
  useCheckModelCapability,
} from "@/hook";
import { useCheckClaudeCLIAvailable } from "@/hook/preference";
import { IPreference, LLMProvider } from "@/electron/type";
import { PasswordInput } from "@/component/Input";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { ProviderLabel } from "@/page/Setting/ProviderLabel";
import { Wrapper } from "./style";

const { Text } = Typography;

type IProps = {
  preference: IPreference | null;
};

const AnthropicSetting = (props: IProps) => {
  const { preference } = props;
  const [form] = Form.useForm();
  const { translate } = useTranslation();
  const { updatePreference, loading, isSuccess } = useUpdatePreference();
  const { checkModelCapability } = useCheckModelCapability();
  const { checkClaudeCLIAvailable } = useCheckClaudeCLIAvailable();

  useEffect(() => {
    form.setFieldsValue({
      anthropicApiKey: preference?.anthropicApiKey,
      anthropicModel: preference?.anthropicModel,
      anthropicBackgroundModel: preference?.anthropicBackgroundModel,
    });
  }, [preference]);

  useEffect(() => {
    if (!loading && isSuccess) {
      message.success(translate("updateSuccess"));
    }
  }, [loading, isSuccess]);

  const onToggleClaudeCLI = async (checked: boolean) => {
    if (checked) {
      const available = await checkClaudeCLIAvailable();
      if (!available) {
        message.error(translate("setting.useClaudeCLINotAvailable"));
        return;
      }
    }
    updatePreference({ id: preference?.id, useClaudeCLI: checked }, true);
  };

  const onSubmitForm = async () => {
    try {
      const { anthropicApiKey, anthropicModel, anthropicBackgroundModel } =
        await form.validateFields([
          "anthropicApiKey",
          "anthropicModel",
          "anthropicBackgroundModel",
        ]);

      if (anthropicModel) {
        checkModelCapability(anthropicModel, LLMProvider.CLAUDE);
      }

      await updatePreference(
        {
          id: preference?.id,
          anthropicApiKey,
          anthropicModel: anthropicModel || "",
          anthropicBackgroundModel: anthropicBackgroundModel || "",
        },
        true,
      );
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
          style={{ marginTop: "-1.5rem" }}
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
        >
          <Input
            className="custom-input"
            placeholder="haiku-4-5-20251001"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("setting.useClaudeCLI")}:`}
          tooltip={translate("setting.useClaudeCLITooltip")}
        >
          <Switch
            checked={Boolean(preference?.useClaudeCLI)}
            onChange={onToggleClaudeCLI}
          />

          {preference?.useClaudeCLI && (
            <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
              {translate("setting.useClaudeCLIActive")}
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
)(AnthropicSetting);
