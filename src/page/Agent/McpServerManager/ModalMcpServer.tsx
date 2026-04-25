import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Form, Input, Modal, Switch } from "antd";
import CodeEditor from "@/component/CodeEditor";
import {
  actSetModalOpenMcpServer,
  actSaveSelectedMcpServer,
} from "@/redux/mcpServer";
import { RootState } from "@/redux/store";
import { useCreateMcpServer, useUpdateMcpServer } from "@/hook/mcpServer";
import { useTranslation } from "@/hook/useTranslation";
import { IMcpServer, MCPServerStatus } from "@/electron/type";

const { TextArea } = Input;

const sampleConfig = `{
  "mcpServers": {
    "coingecko_api": {
      "command": "npx",
      "args": [
        "-y",
        "@coingecko/coingecko-mcp"
      ],
      "env": {
        "COINGECKO_PRO_API_KEY": "your_api_key",
        "COINGECKO_ENVIRONMENT": "pro"
      }
    }
  }
}`;

type JsonEditorProps = {
  value?: string;
  onChange?: (v: string) => void;
};

const ConfigJsonEditor = (props: JsonEditorProps) => {
  const { value, onChange } = props;

  return (
    <CodeEditor
      height="40rem"
      language="json"
      value={value || ""}
      onChange={(v) => onChange?.(v || "")}
      fontSize={14}
    />
  );
};

const ModalMcpServer = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, selectedMcpServer } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();

  const { createMcpServer, isSuccess: createSuccess } = useCreateMcpServer();
  const { updateMcpServer, isSuccess: updateSuccess } = useUpdateMcpServer();

  useEffect(() => {
    if (isModalOpen) {
      setBtnLoading(false);

      form.setFieldsValue({
        name: selectedMcpServer?.name || "",
        description: selectedMcpServer?.description || "",
        config: selectedMcpServer?.config?.trim() || sampleConfig,
        isEnabled: selectedMcpServer?.isEnabled || false,
      });
    }
  }, [isModalOpen, form, selectedMcpServer]);

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      setBtnLoading(false);
      props?.actSetModalOpenMcpServer(false);
      props?.actSaveSelectedMcpServer(null);
      form.resetFields();
    }
  }, [createSuccess, updateSuccess]);

  const onCloseModal = () => {
    props?.actSetModalOpenMcpServer(false);
    props?.actSaveSelectedMcpServer(null);
    setBtnLoading(false);
    setTimeout(() => form.resetFields(), 300);
  };

  const onSubmitForm = async () => {
    try {
      const { name, description, config, isEnabled } =
        await form.validateFields([
          "name",
          "description",
          "config",
          "isEnabled",
        ]);
      setBtnLoading(true);
      const configStr = config?.trim();
      const payload: IMcpServer = {
        name,
        description,
        config: configStr,
        isEnabled: isEnabled ?? true,
        status: MCPServerStatus.DISCONNECTED,
      };

      if (selectedMcpServer?.id) {
        updateMcpServer({ ...payload, id: selectedMcpServer.id } as IMcpServer);
      } else {
        createMcpServer(payload);
      }
    } catch {
      setBtnLoading(false);
    }
  };

  return (
    <Modal
      title={
        selectedMcpServer
          ? translate("agent.editMcpServer")
          : translate("agent.addMcpServer")
      }
      open={isModalOpen}
      onCancel={onCloseModal}
      onOk={onSubmitForm}
      okText={
        selectedMcpServer
          ? translate("button.update")
          : translate("button.createNew")
      }
      cancelText={translate("cancel")}
      width="65rem"
      mask={{ closable: false }}
      confirmLoading={isBtnLoading}
      style={{ top: "6rem" }}
    >
      <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
        <Form.Item
          label={`${translate("agent.serverName")}:`}
          name="name"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <Input
            className="custom-input"
            placeholder={translate("agent.serverNamePlaceholder")}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("agent.description")}:`}
          name="description"
        >
          <TextArea
            className="custom-input"
            placeholder={translate("agent.serverDescriptionPlaceholder")}
            rows={2}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={translate("agent.configJson")}
          name="config"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <ConfigJsonEditor />
        </Form.Item>

        <Form.Item
          label={translate("agent.enabled")}
          name="isEnabled"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isModalOpen: state?.McpServer?.isModalOpen,
    selectedMcpServer: state?.McpServer?.selectedMcpServer,
  }),
  {
    actSetModalOpenMcpServer,
    actSaveSelectedMcpServer,
  },
)(ModalMcpServer);
