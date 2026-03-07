import { Form, Row, Col, Alert } from "antd";
import { useTranslation } from "@/hook";
import { PasswordInput } from "@/component/Input";
import { PrimaryButton } from "@/component/Button";

type CreateFormProps = {
  form: ReturnType<typeof Form.useForm>[0];
  onSubmit: () => void;
  loading: boolean;
  errorMessage: string | null;
};

const CreateForm = ({
  form,
  onSubmit,
  loading,
  errorMessage,
}: CreateFormProps) => {
  const { translate } = useTranslation();

  const focusConfirmPassword = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    event?.preventDefault();
    event?.stopPropagation();
    const el = document.querySelector<HTMLInputElement>(
      ".input-password-confirm-password input",
    );
    el?.focus();
  };

  const onPressEnterConfirmPassword = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    event?.preventDefault();
    event?.stopPropagation();
    onSubmit();
  };

  return (
    <Form layout="vertical" form={form} onFinish={onSubmit}>
      <Row justify="center" style={{ marginTop: "var(--margin-top)" }}>
        <Col span={24}>
          <Form.Item
            label={`${translate("masterPassword.label")}:`}
            className="password"
          >
            <PasswordInput
              name="masterPassword"
              extendClass="master-password"
              onPressEnter={focusConfirmPassword}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row justify="center">
        <Col span={24}>
          <Form.Item
            label={`${translate("masterPassword.confirmLabel")}:`}
            className="password"
          >
            <PasswordInput
              name="confirmPassword"
              extendClass="confirm-password"
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
            title={translate("masterPassword.setupInfo")}
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
            text={translate("masterPassword.createButton")}
            onClick={onSubmit}
            loading={loading}
          />
        </Col>
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

export default CreateForm;
