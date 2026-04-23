import { Form, Button, Row, message } from "antd";
import { useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useUpdatePreference, useTranslation } from "@/hook";
import { IPreference } from "@/electron/type";
import { PasswordInput } from "@/component/Input";
import { Wrapper } from "./style";

type IProps = {
  preference: IPreference | null;
};

const WebSearch = (props: IProps) => {
  const { preference } = props;
  const [form] = Form.useForm();
  const { translate } = useTranslation();

  useEffect(() => {
    form.setFieldsValue({
      tavilyApiKey: preference?.tavilyApiKey,
      exaApiKey: preference?.exaApiKey,
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
      const { tavilyApiKey, exaApiKey } = await form.validateFields([
        "tavilyApiKey",
        "exaApiKey",
      ]);

      await updatePreference({
        id: preference?.id,
        tavilyApiKey,
        exaApiKey,
      });
    } catch {}
  };

  return (
    <Wrapper>
      <Form layout="vertical" form={form}>
        <Form.Item
          label={`${translate("workflow.tavilyApiKeyLabel")}:`}
          name="tavilyApiKey"
          tooltip={translate("workflow.tavilyApiKeyTooltip")}
        >
          <PasswordInput
            name="tavilyApiKey"
            placeholder={translate("workflow.enterTavilyApiKeyPlaceholder")}
            extendClass="tavilyApiKey"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("workflow.exaApiKeyLabel")}:`}
          name="exaApiKey"
          tooltip={translate("workflow.exaApiKeyTooltip")}
          style={{ marginTop: "-1rem" }}
        >
          <PasswordInput
            name="exaApiKey"
            placeholder={translate("workflow.enterExaApiKeyPlaceholder")}
            extendClass="exaApiKey"
          />
        </Form.Item>
      </Form>

      <Row justify="end">
        <Button
          type="primary"
          onClick={onSubmitForm}
          loading={loading}
          style={{ marginTop: "-1.5rem" }}
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
)(WebSearch);
