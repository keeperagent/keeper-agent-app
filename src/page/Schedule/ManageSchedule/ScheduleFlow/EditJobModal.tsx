import { useEffect, useState } from "react";
import { Form, Input, Modal, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation, useGetOneSchedule, useUpdateJob } from "@/hook";
import { useGetListAgentProfile } from "@/hook/agentProfile";
import { IAgentProfile, IJob, ISchedule, LLMProvider } from "@/electron/type";
import { LlmProviderPicker } from "@/component";
import HandoffToNextToggle from "@/page/Schedule/ManageSchedule/HandoffToNextToggle";

type IProps = {
  open: boolean;
  job: IJob | null;
  schedule: ISchedule;
  onClose: () => void;
  listAgentProfile: IAgentProfile[];
  isLastJob: boolean;
};

const EditJobModal = ({
  open,
  job,
  schedule,
  onClose,
  listAgentProfile,
  isLastJob,
}: IProps) => {
  const [editProvider, setEditProvider] = useState<string>(LLMProvider.CLAUDE);
  const [editAgentProfileId, setEditAgentProfileId] = useState<number | null>(
    null,
  );
  const [editHandoffToNext, setEditHandoffToNext] = useState<boolean>(false);
  const [form] = Form.useForm();
  const { translate } = useTranslation();
  const { updateJob, loading, isSuccess } = useUpdateJob();
  const { getOneSchedule } = useGetOneSchedule();
  const { getListAgentProfile } = useGetListAgentProfile();

  useEffect(() => {
    getListAgentProfile({ page: 1, pageSize: 999 });
  }, []);

  useEffect(() => {
    if (open && job) {
      form.setFieldsValue({
        prompt: job.prompt || "",
      });
      setEditProvider(job.llmProvider || LLMProvider.CLAUDE);
      setEditAgentProfileId(job.agentProfileId || null);
      setEditHandoffToNext(Boolean(job.handoffToNext));
    }
  }, [open, job]);

  useEffect(() => {
    if (!loading && isSuccess) {
      onClose();
      getOneSchedule(schedule.id!);
    }
  }, [loading, isSuccess]);

  const onSave = async () => {
    const values = await form.validateFields();
    updateJob({
      id: job!.id!,
      llmProvider: editAgentProfileId ? undefined : editProvider,
      prompt: values.prompt,
      agentProfileId: editAgentProfileId,
      handoffToNext: !isLastJob && editHandoffToNext,
    });
  };

  const onChangeAgentProfile = (value: number | undefined) => {
    setEditAgentProfileId(value || null);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onSave}
      confirmLoading={loading}
      title={translate("edit")}
      width={480}
      okText={translate("button.save")}
      cancelText={translate("cancel")}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={`${translate("schedule.agentPrompt")}:`}
          name="prompt"
          rules={[{ required: true, message: translate("form.requiredField") }]}
        >
          <Input.TextArea
            rows={5}
            placeholder={translate("schedule.agentPrompt")}
          />
        </Form.Item>

        <Form.Item label={`${translate("schedule.agentProfile")}:`}>
          <Select
            size="large"
            className="custom-select"
            allowClear
            placeholder={translate("schedule.agentProfileDefault")}
            value={editAgentProfileId || undefined}
            onChange={onChangeAgentProfile}
            options={listAgentProfile?.map((agentProfile) => ({
              label: agentProfile.name,
              value: agentProfile.id,
            }))}
          />
        </Form.Item>

        {!editAgentProfileId && (
          <Form.Item label={`${translate("schedule.llmProvider")}:`}>
            <LlmProviderPicker
              value={editProvider}
              onChange={setEditProvider}
            />
          </Form.Item>
        )}

        {!isLastJob && (
          <HandoffToNextToggle
            checked={editHandoffToNext}
            onChange={setEditHandoffToNext}
          />
        )}
      </Form>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    listAgentProfile: state?.AgentProfile?.listAgentProfile || [],
  }),
  {},
)(EditJobModal);
