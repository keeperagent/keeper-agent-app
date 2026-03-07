import { useState, useEffect, useRef } from "react";
import { Modal, Form, Input } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { actSaveSelectedWallet } from "@/redux/wallet";
import { useUpdateWallet, useTranslation } from "@/hook";
import { IWallet } from "@/electron/type";

const { TextArea } = Input;

type IModalUpdateWalletProps = {
  isModalOpen: boolean;
  setModalOpen: (value: boolean) => void;
  selectedWallet: IWallet | null;
  actSaveSelectedWallet: (value: IWallet | null) => void;
  encryptKey: string;
};

const ModalUpdateWallet = (props: IModalUpdateWalletProps) => {
  const { isModalOpen, setModalOpen, selectedWallet, encryptKey } = props;
  const { translate } = useTranslation();
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    updateWallet,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateWallet();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }

    form.setFieldsValue({
      address: selectedWallet?.address || null,
      phrase: selectedWallet?.phrase || null,
      privateKey: selectedWallet?.privateKey || null,
    });
  }, [isModalOpen, form, selectedWallet]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedWallet(null);
    }, 300);
  };

  useEffect(() => {
    if (!isUpdateLoading && isUpdateSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [isUpdateLoading, isUpdateSuccess]);

  const onSubmitForm = async () => {
    try {
      const { address, phrase, privateKey } = await form.validateFields([
        "address",
        "phrase",
        "privateKey",
      ]);
      setBtnLoading(true);
      updateWallet(
        { address, phrase, id: selectedWallet?.id, privateKey },
        encryptKey
      );
    } catch {}
  };

  return (
    <Modal
      open={isModalOpen}
      title={translate("wallet.editWallet")}
      onCancel={onCloseModal}
      maskClosable={false}
      okText={translate("button.update")}
      cancelText={translate("cancel")}
      width="45rem"
      onOk={onSubmitForm}
      confirmLoading={isBtnLoading}
    >
      <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
        <Form.Item label={`${translate("address")}:`} name="address">
          <Input.TextArea
            placeholder={translate("wallet.inputAddressPlaceholder")}
            className="custom-input"
            size="large"
            // @ts-ignore
            ref={inputRef}
            rows={2}
          />
        </Form.Item>

        <Form.Item label={`${translate("wallet.phrase")}:`} name="phrase">
          <TextArea
            placeholder={translate("wallet.enterPhrasePlaceholder")}
            rows={3}
            className="custom-input"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("wallet.privateKey")}:`}
          name="privateKey"
        >
          <TextArea
            placeholder={translate("wallet.enterPrivateKey")}
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
    selectedWallet: state?.Wallet?.selectedWallet,
  }),
  {
    actSaveSelectedWallet,
  }
)(ModalUpdateWallet);
