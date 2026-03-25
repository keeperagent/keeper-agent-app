import { Modal, Form, Input, Select } from "antd";
import { McpTokenPermission } from "@/electron/type";
import { useTranslation } from "@/hook";

type IProps = {
  open: boolean;
  loading: boolean;
  form: ReturnType<typeof Form.useForm>[0];
  onOk: () => void;
  onCancel: () => void;
};

const ModalMcpToken = ({ open, loading, form, onOk, onCancel }: IProps) => {
  const { translate } = useTranslation();

  return (
    <Modal
      title={translate("mcp.createToken")}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={translate("add")}
      cancelText={translate("cancel")}
    >
      <Form form={form} layout="vertical" style={{ marginTop: "1.6rem" }}>
        <Form.Item
          label={translate("mcp.tokenName")}
          name="name"
          rules={[{ required: true, message: translate("form.requiredField") }]}
        >
          <Input
            placeholder={translate("mcp.tokenNamePlaceholder")}
            className="custom-input"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={translate("mcp.permission")}
          name="permission"
          initialValue={McpTokenPermission.READ}
        >
          <Select
            options={[
              {
                value: McpTokenPermission.READ,
                label: translate("mcp.permissionRead"),
              },
              {
                value: McpTokenPermission.READ_WRITE,
                label: translate("mcp.permissionReadWrite"),
              },
            ]}
            className="custom-select"
            size="large"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export { ModalMcpToken };
