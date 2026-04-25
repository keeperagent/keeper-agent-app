import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Form, Input, message, Modal } from "antd";
import {
  actSetModalOpenAgentSkill,
  actSaveSelectedAgentSkill,
} from "@/redux/agentSkill";
import { RootState } from "@/redux/store";
import { useCreateAgentSkill, useUpdateAgentSkill } from "@/hook/agentSkill";
import { useTranslation } from "@/hook/useTranslation";
import { IAgentSkill } from "@/electron/type";
import { UploadFile } from "@/component";
import { IFile } from "@/types/interface";
import { HelperWrapper } from "./style";

const { TextArea } = Input;

const SKILL_FILE_EXT = ["zip", "md"];

const ModalAgentSkill = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, selectedAgentSkill } = props;
  const [listFile, setListFile] = useState<IFile[]>([]);
  const [form] = Form.useForm();

  const {
    createAgentSkill,
    isSuccess: createSuccess,
    loading: createLoading,
  } = useCreateAgentSkill();
  const {
    updateAgentSkill,
    isSuccess: updateSuccess,
    loading: updateLoading,
  } = useUpdateAgentSkill();

  useEffect(() => {
    if (isModalOpen) {
      setListFile([]);

      form.setFieldsValue({
        name: selectedAgentSkill?.name || "",
        description: selectedAgentSkill?.description || "",
      });
    }
  }, [isModalOpen, form, selectedAgentSkill]);

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      props?.actSetModalOpenAgentSkill(false);
      props?.actSaveSelectedAgentSkill(null);
      form.resetFields();
      setListFile([]);
    }
  }, [createSuccess, updateSuccess]);

  const onCloseModal = () => {
    props?.actSetModalOpenAgentSkill(false);
    props?.actSaveSelectedAgentSkill(null);
    setListFile([]);

    setTimeout(() => form.resetFields(), 300);
  };

  const onSubmitForm = async () => {
    try {
      const isCreate = !selectedAgentSkill?.id;
      const filePath = listFile[0]?.path;
      if (isCreate && !filePath) {
        message.error(translate("agent.uploadSkillError"));
        return;
      }
      const values = form.getFieldsValue(["name", "description"]);
      const payload: IAgentSkill = {
        name: values.name?.trim(),
        description: values.description?.trim(),
        isEnabled: selectedAgentSkill?.isEnabled || false,
      };
      if (filePath) {
        payload.filePath = filePath;
      }

      if (selectedAgentSkill?.id) {
        updateAgentSkill({
          ...payload,
          id: selectedAgentSkill.id,
        });
      } else {
        createAgentSkill(payload);
      }
    } catch {}
  };

  return (
    <Modal
      title={
        selectedAgentSkill
          ? translate("agent.editSkill")
          : translate("agent.createSkill")
      }
      open={isModalOpen}
      onCancel={onCloseModal}
      onOk={onSubmitForm}
      okText={
        selectedAgentSkill
          ? translate("button.update")
          : translate("button.createNew")
      }
      cancelText={translate("cancel")}
      width={600}
      mask={{ closable: false }}
      confirmLoading={createLoading || updateLoading}
    >
      <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
        <Form.Item label="" required>
          <HelperWrapper>{translate("agent.uploadSkillHelper")}</HelperWrapper>

          <UploadFile
            listFile={listFile}
            setListFile={setListFile}
            listExt={SKILL_FILE_EXT}
            single
            mapErrorWithFile={{}}
          />
        </Form.Item>

        <Form.Item
          label={`${translate("agent.skillName")}:`}
          name="name"
          style={{ marginTop: "3rem" }}
        >
          <Input
            className="custom-input"
            placeholder={translate("agent.skillNamePlaceholder")}
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("agent.description")}:`}
          name="description"
        >
          <TextArea
            className="custom-input"
            placeholder={translate("agent.skillDescriptionPlaceholder")}
            rows={9}
            size="large"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isModalOpen: state?.AgentSkill?.isModalOpen,
    selectedAgentSkill: state?.AgentSkill?.selectedAgentSkill,
  }),
  {
    actSetModalOpenAgentSkill,
    actSaveSelectedAgentSkill,
  },
)(ModalAgentSkill);
