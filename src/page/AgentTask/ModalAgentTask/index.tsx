import { useEffect } from "react";
import dayjs from "dayjs";
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Row,
  Col,
  DatePicker,
} from "antd";
import {
  IAgentTask,
  AgentTaskPriority,
  AgentTaskStatus,
} from "@/electron/type";
import { useCreateAgentTask, useUpdateAgentTask } from "@/hook/agentTask";
import { useTranslation } from "@/hook/useTranslation";
import { TaskHistory } from "../TaskHistory";
import { TaskResult } from "../TaskResult";
import { OptionWrapper } from "./style";

const PRIORITY_OPTIONS = [
  { label: "Low", value: AgentTaskPriority.LOW },
  { label: "Medium", value: AgentTaskPriority.MEDIUM },
  { label: "High", value: AgentTaskPriority.HIGH },
  { label: "Urgent", value: AgentTaskPriority.URGENT },
];

type AgentOption = { label: string; value: number; activeCount?: number };

interface ModalAgentTaskProps {
  open: boolean;
  editingTask: IAgentTask | null;
  agentOptions: AgentOption[];
  onClose: () => void;
}

export const ModalAgentTask = ({
  open,
  editingTask,
  agentOptions,
  onClose,
}: ModalAgentTaskProps) => {
  const { translate } = useTranslation();
  const [form] = Form.useForm();
  const { createAgentTask, loading: createLoading, isSuccess: createSuccess } = useCreateAgentTask();
  const { updateAgentTask, loading: updateLoading, isSuccess: updateSuccess } = useUpdateAgentTask();

  const canEditDueDate =
    !editingTask || editingTask.status === AgentTaskStatus.INIT;

  useEffect(() => {
    if (!open) {
      return;
    }
    if (editingTask) {
      form.setFieldsValue({
        title: editingTask.title,
        description: editingTask.description || "",
        priority: editingTask.priority || AgentTaskPriority.MEDIUM,
        assignedAgentId: editingTask.assignedAgentId || undefined,
        dueAt: editingTask.dueAt ? dayjs(editingTask.dueAt) : undefined,
        timeout: editingTask.timeout || undefined,
      });
    } else {
      form.setFieldsValue({ priority: AgentTaskPriority.MEDIUM });
    }
  }, [open, editingTask?.id]);

  useEffect(() => {
    if (open && (createSuccess || updateSuccess)) {
      onClose();
    }
  }, [createSuccess, updateSuccess]);

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        title: (values.title || "").trim(),
        dueAt: values.dueAt ? values.dueAt.valueOf() : undefined,
      };
      if (editingTask) {
        updateAgentTask(editingTask.id!, payload);
      } else {
        createAgentTask(payload);
      }
    } catch {}
  };

  return (
    <Modal
      title={
        editingTask
          ? translate("agentTask.modal.editTitle")
          : translate("agentTask.modal.createTitle")
      }
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={createLoading || updateLoading}
      destroyOnHidden
      width={520}
      style={{ top: "5rem" }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label={`${translate("agentTask.label.title")}:`}
          rules={[
            {
              required: true,
              validator: (_, value) => {
                if (!value || !value.trim()) {
                  return Promise.reject(translate("form.requiredField"));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder={translate("agentTask.placeholder.title")}
            className="custom-input"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={`${translate("agentTask.label.description")}:`}
        >
          <Input.TextArea
            placeholder={translate("agentTask.placeholder.description")}
            rows={3}
            className="custom-input"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="assignedAgentId"
          label={`${translate("agentTask.label.assignedAgent")}:`}
        >
          <Select
            options={agentOptions}
            allowClear
            placeholder={translate("agentTask.placeholder.assignedAgent")}
            className="custom-select"
            size="large"
            optionRender={(option) => (
              <OptionWrapper>
                <div className="name">{option.data.label}</div>
                <div className="description">
                  {(option.data.activeCount || 0) > 0
                    ? `${option.data.activeCount} active task${(option.data.activeCount || 0) > 1 ? "s" : ""}`
                    : translate("agentTask.label.noActiveTasks")}
                </div>
              </OptionWrapper>
            )}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="priority"
              label={`${translate("agentTask.label.priority")}:`}
            >
              <Select
                options={PRIORITY_OPTIONS}
                className="custom-select"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col span={10}>
            <Form.Item
              name="dueAt"
              label={`${translate("agentTask.label.dueAt")}:`}
            >
              <DatePicker
                showTime
                allowClear={canEditDueDate}
                disabled={!canEditDueDate}
                placeholder={translate("agentTask.placeholder.dueAt")}
                className="custom-date-picker"
                size="large"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="timeout"
              label={`${translate("agentTask.label.timeout")}:`}
            >
              <InputNumber
                placeholder={translate("agentTask.placeholder.timeout")}
                className="custom-input"
                size="large"
                min={1}
                max={9999}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {editingTask && <TaskResult task={editingTask} />}
      {editingTask && <TaskHistory task={editingTask} />}
    </Modal>
  );
};
