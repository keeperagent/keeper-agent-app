import { useState, useEffect, useRef } from "react";
import { Modal, Form, Input } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  actSaveSelectedWorkflowGroup,
  actSaveCreateWorkflowGroup,
  actSaveUpdateWorkflowGroup,
} from "@/redux/workflowGroup";
import {
  useUpdateWorkflowGroup,
  useCreateWorkflowGroup,
  useTranslation,
} from "@/hook";

const { TextArea } = Input;

const ModalWorkflowGroup = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedWorkflowGroup } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    updateWorkflowGroup,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateWorkflowGroup();
  const {
    createWorkflowGroup,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateWorkflowGroup();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
    form.setFieldsValue({
      name: selectedWorkflowGroup?.name || "",
      note: selectedWorkflowGroup?.note || "",
    });
  }, [isModalOpen, form, selectedWorkflowGroup]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedWorkflowGroup(null);
    }, 300);
  };

  useEffect(() => {
    if (!isUpdateLoading && isUpdateSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [isUpdateLoading, isUpdateSuccess]);

  useEffect(() => {
    if (!isCreateLoading && isCreateSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [isCreateLoading, isCreateSuccess]);

  const onSubmitForm = async () => {
    try {
      const { name, note } = await form.validateFields(["name", "note"]);
      setBtnLoading(true);

      if (selectedWorkflowGroup) {
        updateWorkflowGroup({ name, note, id: selectedWorkflowGroup?.id });
      } else {
        createWorkflowGroup({ name, note });
      }
    } catch {}
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        !selectedWorkflowGroup
          ? translate("workflow.createWorkflowGroup")
          : translate("workflow.editWorkflowGroup")
      }
      onCancel={onCloseModal}
      mask={{ closable: false }}
      okText={
        !selectedWorkflowGroup
          ? translate("button.createNew")
          : translate("button.update")
      }
      cancelText={translate("cancel")}
      width="50rem"
      onOk={onSubmitForm}
      confirmLoading={isBtnLoading}
    >
      <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
        <Form.Item
          label={`${translate("groupName")}:`}
          name="name"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <Input
            placeholder={translate("enterGroupName")}
            className="custom-input"
            size="large"
            // @ts-ignore
            ref={inputRef}
          />
        </Form.Item>

        <Form.Item label={`${translate("describe")}:`} name="note">
          <TextArea
            placeholder={translate("enterDescribe")}
            rows={3}
            className="custom-input"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedWorkflowGroup: state?.WorkflowGroup?.selectedWorkflowGroup,
  }),
  {
    actSaveSelectedWorkflowGroup,
    actSaveCreateWorkflowGroup,
    actSaveUpdateWorkflowGroup,
  },
)(ModalWorkflowGroup);
