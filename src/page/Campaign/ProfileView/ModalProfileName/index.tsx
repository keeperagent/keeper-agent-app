import { useState, useRef, useEffect } from "react";
import { Modal, Input, Form } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation, useUpdateCampaignProfile } from "@/hook";
import { ICampaignProfile } from "@/electron/type";

type IProps = {
  isModalOpen: boolean;
  setModalOpen: (value: boolean) => void;
  selectedCampaignProfile: ICampaignProfile | null;
  encryptKey: string;
};

const { TextArea } = Input;

const ModalProfileName = (props: IProps) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedCampaignProfile, encryptKey } =
    props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const { updateCampaignProfile } = useUpdateCampaignProfile();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }

    form.setFieldsValue({
      name: selectedCampaignProfile?.name,
      note: selectedCampaignProfile?.note,
    });
  }, [isModalOpen, selectedCampaignProfile, form]);

  const onSubmitForm = async () => {
    try {
      const { name, note } = await form.validateFields(["name", "note"]);
      setBtnLoading(true);
      const updatedData = {
        ...selectedCampaignProfile,
        name,
        note,
      };
      await updateCampaignProfile(updatedData, encryptKey);
      setBtnLoading(false);
      setModalOpen(false);
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
    selectedCampaignProfile: state?.CampaignProfile?.selectedCampaignProfile,
  }),
  {}
)(ModalProfileName);
