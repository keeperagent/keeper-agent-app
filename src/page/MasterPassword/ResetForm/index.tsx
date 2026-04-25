import { Form, Row, Col, Alert, Button } from "antd";
import { useTranslation } from "@/hook";
import { PasswordInput } from "@/component/Input";
import { PrimaryButton } from "@/component/Button";

type ResetFormProps = {
  onSubmit: (values: {
    newPassword?: string;
    confirmNewPassword?: string;
  }) => void;
  loading: boolean;
  errorMessage: string | null;
  onBack: () => void;
};

const ResetForm = ({
  onSubmit,
  loading,
  errorMessage,
  onBack,
}: ResetFormProps) => {
  const [form] = Form.useForm();
  const { translate } = useTranslation();

  const submitForm = () => {
    const values = form.getFieldsValue();
    const newPwd = values?.newPassword;
    const confirmPwd = values?.confirmNewPassword;

    if (!newPwd) {
      form.setFields([
        {
          name: "newPassword",
          errors: [translate("masterPassword.required")],
        },
      ]);
      return;
    }

    if (!confirmPwd) {
      form.setFields([
        {
          name: "confirmNewPassword",
          errors: [translate("masterPassword.confirmRequired")],
        },
      ]);
      return;
    }

    if (newPwd !== confirmPwd) {
      form.setFields([
        {
          name: "confirmNewPassword",
          errors: [translate("masterPassword.mismatch")],
        },
      ]);
      return;
    }

    onSubmit(values);
  };

  const focusConfirmPassword = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    event?.preventDefault();
    event?.stopPropagation();
    const el = document.querySelector<HTMLInputElement>(
      ".input-password-confirm-new-password input",
    );
    el?.focus();
  };

  const onPressEnterConfirmPassword = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    event?.preventDefault();
    event?.stopPropagation();
    submitForm();
  };

  return (
    <Form layout="vertical" form={form} onFinish={submitForm}>
      <Row justify="center" style={{ marginTop: "var(--margin-top)" }}>
        <Col span={24}>
          <Form.Item
            label={`${translate("masterPassword.newPasswordLabel")}:`}
            className="password"
          >
            <PasswordInput
              name="newPassword"
              extendClass="new-password"
              onPressEnter={focusConfirmPassword}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={`${translate("masterPassword.confirmLabel")}:`}
            className="password"
          >
            <PasswordInput
              name="confirmNewPassword"
              extendClass="confirm-new-password"
              onPressEnter={onPressEnterConfirmPassword}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row
        style={{
          marginBottom: "var(--margin-bottom)",
          width: "100%",
        }}
      >
        <Col span={24}>
          <Alert
            type="info"
            title={translate("masterPassword.changeInfo")}
            style={{
              borderColor: "transparent",
              width: "100%",
            }}
          />
        </Col>
      </Row>

      <Row justify="center">
        <Col span={24}>
          <PrimaryButton
            text={translate("masterPassword.changeButton")}
            onClick={submitForm}
            loading={loading}
          />
        </Col>
      </Row>

      <Row
        justify="end"
        style={{
          marginTop: "1.5rem",
          width: "100%",
        }}
      >
        <Button type="link" onClick={onBack} style={{ padding: 0 }}>
          {translate("masterPassword.backToUnlock")}
        </Button>
      </Row>

      {!loading && errorMessage && (
        <Row style={{ marginTop: "2rem", width: "100%" }}>
          <Col span={24}>
            <Alert
              title={errorMessage}
              type="error"
              style={{
                borderColor: "transparent",
                width: "100%",
              }}
            />
          </Col>
        </Row>
      )}
    </Form>
  );
};

export default ResetForm;
