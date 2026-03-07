import { useState, useRef, useEffect } from "react";
import { Modal, Form, InputNumber } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation, useUpdatePreference } from "@/hook";
import { IPreference } from "@/electron/type";

type IProps = {
  isModalOpen: boolean;
  setModalOpen: (value: boolean) => void;
  preference: IPreference | null;
};

const ModalConfigLog = (props: IProps) => {
  const { isModalOpen, setModalOpen, preference } = props;
  const { translate } = useTranslation();
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const { updatePreference } = useUpdatePreference();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }

    form.setFieldsValue({
      maxLogAge: preference?.maxLogAge || 15,
    });
  }, [isModalOpen, preference, form]);

  const onSubmitForm = async () => {
    try {
      const { maxLogAge } = await form.validateFields(["maxLogAge"]);
      setBtnLoading(true);
      const updatedData = {
        ...preference,
        maxLogAge,
      };
      await updatePreference(updatedData);
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
      title={translate("schedule.configDeleteLog")}
      onCancel={onCloseModal}
      okText={translate("button.update")}
      cancelText={translate("cancel")}
      width="45rem"
      onOk={onSubmitForm}
      confirmLoading={isBtnLoading}
    >
      <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
        <Form.Item
          label={`${translate("schedule.maxLogDate")}:`}
          name="maxLogAge"
        >
          <InputNumber
            className="custom-input-number"
            size="large"
            // @ts-ignore
            ref={inputRef}
            min={1}
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    preference: state?.Preference?.preference,
  }),
  {}
)(ModalConfigLog);
