import { Form, Button, Row, Input, message } from "antd";
import { useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useUpdatePreference, useTranslation } from "@/hook";
import { IPreference, LLMProvider } from "@/electron/type";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { ProviderLabel } from "@/page/Setting/ProviderLabel";
import { Wrapper } from "./style";

type IProps = {
  preference: IPreference | null;
};

const OllamaSetting = (props: IProps) => {
  const { preference } = props;
  const [form] = Form.useForm();
  const { translate } = useTranslation();
  const { updatePreference, loading, isSuccess } = useUpdatePreference();

  useEffect(() => {
    form.setFieldsValue({
      ollamaBaseUrl: preference?.ollamaBaseUrl,
      ollamaModel: preference?.ollamaModel,
    });
  }, [preference]);

  useEffect(() => {
    if (!loading && isSuccess) {
      message.success(translate("updateSuccess"));
    }
  }, [loading, isSuccess]);

  const onSubmitForm = async () => {
    try {
      const { ollamaBaseUrl, ollamaModel } = await form.validateFields([
        "ollamaBaseUrl",
        "ollamaModel",
      ]);

      await updatePreference(
        {
          id: preference?.id,
          ollamaBaseUrl: ollamaBaseUrl || "",
          ollamaModel: ollamaModel || "",
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
              provider={LLMProvider.OLLAMA}
              label={`${translate("setting.ollamaBaseUrl")}:`}
            />
          }
          name="ollamaBaseUrl"
          tooltip={translate("setting.ollamaBaseUrlTooltip")}
        >
          <Input
            className="custom-input"
            placeholder="http://localhost:11434"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("setting.ollamaModel")}:`}
          name="ollamaModel"
          tooltip={translate("setting.ollamaModelTooltip")}
        >
          <Input
            className="custom-input"
            placeholder={DEFAULT_LLM_MODELS[LLMProvider.OLLAMA]}
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
)(OllamaSetting);
