import { useState, useRef, useEffect } from "react";
import { Modal, Input, Form } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation, useUpdateProfile } from "@/hook";
import { IProfile } from "@/electron/type";

type IProps = {
  isModalOpen: boolean;
  setModalOpen: (value: boolean) => void;
  selectedProfile: IProfile | null;
};

const { TextArea } = Input;

const ModalProfileName = (props: IProps) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedProfile } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const { updateProfile, loading, isSuccess } = useUpdateProfile();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }

    form.setFieldsValue({
      name: selectedProfile?.name,
      note: selectedProfile?.note,
    });
  }, [isModalOpen, selectedProfile, form]);

  useEffect(() => {
    if (!loading && isSuccess) {
      setBtnLoading(false);
      setModalOpen(false);
    }
  }, [loading, isSuccess]);

  const onSubmitForm = async () => {
    try {
      const { name, note } = await form.validateFields(["name", "note"]);
      updateProfile({
        ...selectedProfile,
        name,
        note,
      });
      setBtnLoading(true);
    } catch {}
  };

  const onCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <Modal
      open={isModalOpen}
      title={translate("campaign.editProfile")}
      onCancel={onCloseModal}
      okText={translate("button.update")}
      cancelText={translate("cancel")}
      width="45rem"
      onOk={onSubmitForm}
      confirmLoading={isBtnLoading}
    >
      <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
        <Form.Item label={translate("campaign.profileName")} name="name">
          <Input
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
    selectedProfile: state?.Profile?.selectedProfile,
  }),
  {}
)(ModalProfileName);
