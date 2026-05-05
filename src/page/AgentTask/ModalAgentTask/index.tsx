import { useEffect, useMemo } from "react";
import { connect } from "react-redux";
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
  IAgentProfile,
  AgentTaskPriority,
  AgentTaskStatus,
} from "@/electron/type";
import { useCreateAgentTask, useUpdateAgentTask } from "@/hook/agentTask";
import { useGetListAgentProfile } from "@/hook/agentProfile";
import { useTranslation } from "@/hook/useTranslation";
import { LLM_PROVIDERS } from "@/config/llmProviders";
import { RootState } from "@/redux/store";
import { TaskHistory } from "../TaskHistory";
import { TaskResult } from "../TaskResult";
import { RightPanel, OptionWrapper, AgentSelectWrapper } from "./style";

const PRIORITY_OPTIONS = [
  { label: "Low", value: AgentTaskPriority.LOW },
  { label: "Medium", value: AgentTaskPriority.MEDIUM },
  { label: "High", value: AgentTaskPriority.HIGH },
  { label: "Urgent", value: AgentTaskPriority.URGENT },
];
const DEFAULT_TASK_TIMEOUT_MINUTES = 30;

interface ModalAgentTaskProps {
  open: boolean;
  editingTask: IAgentTask | null;
  onClose: () => void;
  listAgentProfile?: IAgentProfile[];
}

const ModalAgentTaskBase = (props: ModalAgentTaskProps) => {
  const { open, editingTask, onClose, listAgentProfile = [] } = props;
  const { translate } = useTranslation();
  const { getListAgentProfile } = useGetListAgentProfile();

  const [form] = Form.useForm();
  const {
    createAgentTask,
    loading: createLoading,
    isSuccess: createSuccess,
  } = useCreateAgentTask();
  const {
    updateAgentTask,
    loading: updateLoading,
    isSuccess: updateSuccess,
  } = useUpdateAgentTask();

  useEffect(() => {
    if (open) {
      getListAgentProfile({ page: 1, pageSize: 100, searchText: "" });
    }
  }, [open]);

  const agentOptions = useMemo(() => {
    const profiles = [...listAgentProfile];

    if (
      editingTask?.assignedAgent != null &&
      !profiles.some((profile) => profile.id === editingTask.assignedAgentId)
    ) {
      profiles.push(editingTask.assignedAgent);
    }

    return profiles.map((agent) => ({
      label: agent.name || "",
      value: agent.id!,
      description: agent.description || "",
      llmProvider: agent.llmProvider || "",
    }));
  }, [listAgentProfile, editingTask]);

  const canEditDueDate =
    !editingTask || editingTask.status === AgentTaskStatus.INIT;

  const hasOutput =
    Boolean(editingTask) &&
    ((editingTask?.status === AgentTaskStatus.DONE &&
      editingTask?.result != null) ||
      (editingTask?.status === AgentTaskStatus.FAILED &&
        Boolean(editingTask?.errorMessage)));

  useEffect(() => {
    form.setFieldsValue({
      title: editingTask?.title,
      description: editingTask?.description || "",
      priority: editingTask?.priority || AgentTaskPriority.MEDIUM,
      assignedAgentId: editingTask?.assignedAgentId || undefined,
      dueAt: editingTask?.dueAt
        ? dayjs(editingTask?.dueAt)
        : dayjs().add(1, "day"),
      timeout: editingTask?.timeout || DEFAULT_TASK_TIMEOUT_MINUTES,
    });
  }, [open, editingTask]);

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
          ? translate("agentTaskEditModalTitle")
          : translate("agentTaskCreateModalTitle")
      }
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={createLoading || updateLoading}
      destroyOnHidden
      width={hasOutput ? 1200 : 520}
      style={{ top: "5rem" }}
    >
      <Row gutter={24} align="top" wrap={false}>
        <Col flex="auto">
          <Form form={form} layout="vertical">
            <Form.Item
              name="title"
              label={`${translate("agentTaskTitleLabel")}:`}
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
                placeholder={translate("agentTaskTitlePlaceholder")}
                className="custom-input"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="description"
              label={`${translate("agentTaskDescriptionLabel")}:`}
            >
              <Input.TextArea
                placeholder={translate("agentTaskDescriptionPlaceholder")}
                rows={5}
                className="custom-input"
                size="large"
              />
            </Form.Item>

            <AgentSelectWrapper>
              <Form.Item
                name="assignedAgentId"
                label={`${translate("agentTaskAssignedAgentLabel")}:`}
              >
                <Select
                  options={agentOptions}
                  allowClear
                  placeholder={translate("agentTaskAssignedAgentPlaceholder")}
                  className="custom-select"
                  size="large"
                  labelRender={(item) => {
                    const selected = agentOptions.find(
                      (option) => option.value === item.value,
                    );
                    const provider = LLM_PROVIDERS.find(
                      (provider) => provider.key === selected?.llmProvider,
                    );

                    return (
                      <div className="selected-label">
                        {provider?.icon && (
                          <img
                            src={provider.icon}
                            alt={provider.label}
                            className="selected-logo"
                          />
                        )}
                        <span className="selected-name">{item.label}</span>
                      </div>
                    );
                  }}
                  optionRender={(option) => {
                    const provider = LLM_PROVIDERS.find(
                      (provider) => provider.key === option.data.llmProvider,
                    );
                    return (
                      <OptionWrapper>
                        <div className="provider-col">
                          {provider?.icon && (
                            <img
                              src={provider.icon}
                              alt={provider.label}
                              className="provider-logo"
                            />
                          )}
                        </div>
                        <div className="info-col">
                          <div className="name">{option.data.label}</div>
                          {option.data.description && (
                            <div className="description">
                              {option.data.description}
                            </div>
                          )}
                        </div>
                      </OptionWrapper>
                    );
                  }}
                />
              </Form.Item>
            </AgentSelectWrapper>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="dueAt"
                  label={`${translate("agentTaskDueAtLabel")}:`}
                >
                  <DatePicker
                    showTime
                    allowClear={canEditDueDate}
                    disabled={!canEditDueDate}
                    placeholder={translate("agentTaskDueAtPlaceholder")}
                    className="custom-date-picker"
                    size="large"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="timeout"
                  label={`${translate("agentTaskTimeoutLabel")}:`}
                >
                  <InputNumber
                    placeholder={translate("agentTaskTimeoutPlaceholder")}
                    className="custom-input"
                    size="large"
                    min={1}
                    max={9999}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="priority"
              label={`${translate("agentTaskPriorityLabel")}:`}
            >
              <Select
                options={PRIORITY_OPTIONS}
                className="custom-select"
                size="large"
              />
            </Form.Item>
          </Form>
        </Col>

        {hasOutput && editingTask && (
          <Col span={13}>
            <RightPanel>
              <TaskResult task={editingTask} />
              <TaskHistory task={editingTask} />
            </RightPanel>
          </Col>
        )}
      </Row>
    </Modal>
  );
};

export const ModalAgentTask = connect((state: RootState) => ({
  listAgentProfile: state?.AgentProfile?.listAgentProfile,
}))(ModalAgentTaskBase);
