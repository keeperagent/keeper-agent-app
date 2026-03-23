import { useEffect, useState } from "react";
import { Form, Input, Modal } from "antd";
import { useTranslation, useGetOneSchedule, useUpdateJob } from "@/hook";
import { IJob, ISchedule, LLMProvider } from "@/electron/type";
import { LlmProviderPicker } from "@/component";

type IProps = {
  open: boolean;
  job: IJob | null;
  schedule: ISchedule;
  onClose: () => void;
};

const EditJobModal = ({ open, job, schedule, onClose }: IProps) => {
  const [editProvider, setEditProvider] = useState<string>(LLMProvider.CLAUDE);
  const [form] = Form.useForm();
  const { translate } = useTranslation();
  const { updateJob, loading, isSuccess } = useUpdateJob();
  const { getOneSchedule } = useGetOneSchedule();

  useEffect(() => {
    if (open && job) {
      form.setFieldsValue({ prompt: job.prompt || "" });
      setEditProvider(job.llmProvider || LLMProvider.CLAUDE);
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
      llmProvider: editProvider,
      prompt: values.prompt,
    });
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

        <Form.Item label={`${translate("schedule.llmProvider")}:`}>
          <LlmProviderPicker value={editProvider} onChange={setEditProvider} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditJobModal;
