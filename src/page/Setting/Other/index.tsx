import { Form, Button, Row, message, InputNumber, Input, Switch } from "antd";
import { useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useUpdatePreference, useTranslation } from "@/hook";
import { IPreference } from "@/electron/type";
import { Wrapper } from "./style";

type IProps = {
  preference: IPreference | null;
};

const { TextArea } = Input;

const Other = (props: IProps) => {
  const { preference } = props;
  const [form] = Form.useForm();
  const { translate } = useTranslation();

  useEffect(() => {
    form.setFieldsValue({
      maxConcurrentJob: preference?.maxConcurrentJob,
      jupiterApiKeys: preference?.jupiterApiKeys?.join(","),
    });
  }, [preference]);

  const { updatePreference, loading, isSuccess } = useUpdatePreference();
  const { updatePreference: updateProtection } = useUpdatePreference();

  useEffect(() => {
    if (!loading && isSuccess) {
      message.success(translate("updateSuccess"));
    }
  }, [loading, isSuccess]);

  const onSubmitForm = async () => {
    try {
      const { maxConcurrentJob, jupiterApiKeys } = await form.validateFields([
        "maxConcurrentJob",
        "jupiterApiKeys",
      ]);

      let listJupiterApiKeys = [];
      if (jupiterApiKeys) {
        listJupiterApiKeys = jupiterApiKeys?.split(",");
      }
      await updatePreference({
        id: preference?.id,
        maxConcurrentJob,
        jupiterApiKeys: listJupiterApiKeys,
      });
    } catch {}
  };

  return (
    <Wrapper>
      <Form layout="vertical" form={form}>
        <Form.Item
          label={`${translate("setting.maxConcurrentWorkflow")}:`}
          name="maxConcurrentJob"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
          tooltip={translate("setting.maxConcurrentWorkflowTooltip")}
        >
          <InputNumber
            className="custom-input-number"
            placeholder={translate("setting.maxConcurrentWorkflowPlaceholder")}
            style={{ width: "100%" }}
            min={1}
          />
        </Form.Item>

        <Form.Item
          label="Jupiter API Key:"
          name="jupiterApiKeys"
          tooltip={translate("workflow.jupiterApiKeyTooltip")}
        >
          <TextArea
            name="jupiterApiKeys"
            placeholder={translate("workflow.enterJupiterApiKeyPlaceholder")}
            className="custom-input"
            rows={2}
          />
        </Form.Item>

        <Form.Item
          label={translate("setting.screenCaptureProtection")}
          tooltip={translate("setting.screenCaptureProtectionTooltip")}
        >
          <Switch
            checked={Boolean(preference?.isScreenCaptureProtectionOn)}
            onChange={(checked) =>
              updateProtection({
                id: preference?.id,
                isScreenCaptureProtectionOn: checked,
              })
            }
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
)(Other);
