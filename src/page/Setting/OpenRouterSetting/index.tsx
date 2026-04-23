import { Form, Button, Row, Input, message } from "antd";
import { useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useUpdatePreference, useTranslation } from "@/hook";
import { IPreference, LLMProvider } from "@/electron/type";
import { PasswordInput } from "@/component/Input";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { ProviderLabel } from "@/page/Setting/ProviderLabel";
import { Wrapper } from "./style";

type IProps = {
  preference: IPreference | null;
};

const OpenRouterSetting = (props: IProps) => {
  const { preference } = props;
  const [form] = Form.useForm();
  const { translate } = useTranslation();
  const { updatePreference, loading, isSuccess } = useUpdatePreference();

  useEffect(() => {
    form.setFieldsValue({
      openRouterApiKey: preference?.openRouterApiKey,
      openRouterModel: preference?.openRouterModel,
    });
  }, [preference]);

  useEffect(() => {
    if (!loading && isSuccess) {
      message.success(translate("updateSuccess"));
    }
  }, [loading, isSuccess]);

  const onSubmitForm = async () => {
    try {
      const { openRouterApiKey, openRouterModel } = await form.validateFields([
        "openRouterApiKey",
        "openRouterModel",
      ]);

      await updatePreference({
        id: preference?.id,
        openRouterApiKey,
        openRouterModel: openRouterModel || "",
      });
    } catch {}
  };

  return (
    <Wrapper>
      <Form layout="vertical" form={form}>
        <Form.Item
          label={
            <ProviderLabel
              provider={LLMProvider.OPENROUTER}
              label={`${translate("setting.openRouterApiKey")}:`}
            />
          }
          name="openRouterApiKey"
          tooltip={translate("setting.openRouterApiKeyTooltip")}
        >
          <PasswordInput
            name="openRouterApiKey"
            placeholder={translate("setting.enterOpenRouterApiKey")}
            extendClass="openRouterApiKey"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("setting.openRouterModel")}:`}
          name="openRouterModel"
          tooltip={translate("setting.openRouterModelTooltip")}
          style={{ marginTop: "-1.5rem" }}
        >
          <Input
            className="custom-input"
            placeholder={DEFAULT_LLM_MODELS[LLMProvider.OPENROUTER]}
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
)(OpenRouterSetting);
