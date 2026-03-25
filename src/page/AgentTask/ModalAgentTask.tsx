import { Form, FormInstance, Input, Modal, Select } from "antd";
import { IAgentTask, AgentTaskPriority } from "@/electron/type";
import { useTranslation } from "@/hook/useTranslation";

const PRIORITY_OPTIONS = [
  { label: "Low", value: AgentTaskPriority.LOW },
  { label: "Medium", value: AgentTaskPriority.MEDIUM },
  { label: "High", value: AgentTaskPriority.HIGH },
  { label: "Urgent", value: AgentTaskPriority.URGENT },
];

type AgentOption = { label: string; value: number };

interface ModalAgentTaskProps {
  open: boolean;
  editingTask: IAgentTask | null;
  form: FormInstance;
  agentOptions: AgentOption[];
  confirmLoading: boolean;
  onCancel: () => void;
  onOk: () => void;
}

export const ModalAgentTask = ({
  open,
  editingTask,
  form,
  agentOptions,
  confirmLoading,
  onCancel,
  onOk,
}: ModalAgentTaskProps) => {
  const { translate } = useTranslation();

  return (
    <Modal
      title={
        editingTask
          ? translate("agentTask.modal.editTitle")
          : translate("agentTask.modal.createTitle")
      }
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={confirmLoading}
      destroyOnHidden
      width={520}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label={translate("agentTask.label.title")}
          rules={[{ required: true }]}
        >
          <Input
            placeholder={translate("agentTask.placeholder.title")}
            className="custom-input"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={translate("agentTask.label.description")}
        >
          <Input.TextArea
            placeholder={translate("agentTask.placeholder.description")}
            rows={3}
            className="custom-input"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label={translate("agentTask.label.priority")}
        >
          <Select
            options={PRIORITY_OPTIONS}
            className="custom-select"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="assignedAgentId"
          label={translate("agentTask.label.assignedAgent")}
        >
          <Select
            options={agentOptions}
            allowClear
            placeholder={translate("agentTask.placeholder.assignedAgent")}
            className="custom-select"
            size="large"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
