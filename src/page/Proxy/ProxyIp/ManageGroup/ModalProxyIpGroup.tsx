import { useState, useEffect, useRef } from "react";
import { Modal, Form, Input } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  actSaveSelectedProxyIpGroup,
  actSaveCreateProxyIpGroup,
  actSaveUpdateProxyIpGroup,
} from "@/redux/proxyIpGroup";
import {
  useUpdateProxyIpGroup,
  useCreateProxyIpGroup,
  useTranslation,
} from "@/hook";

const { TextArea } = Input;

const ModalProxyIpGroup = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedProxyIpGroup } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    updateProxyIpGroup,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateProxyIpGroup();
  const {
    createProxyIpGroup,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateProxyIpGroup();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
    form.setFieldsValue({
      name: selectedProxyIpGroup?.name || "",
      note: selectedProxyIpGroup?.note || "",
    });
  }, [isModalOpen, form, selectedProxyIpGroup]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedProxyIpGroup(null);
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

      if (selectedProxyIpGroup) {
        updateProxyIpGroup({
          name,
          note,
          id: selectedProxyIpGroup?.id,
        });
      } else {
        createProxyIpGroup({ name, note });
      }
    } catch {}
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        !selectedProxyIpGroup
          ? translate("proxyIp.createGroup")
          : translate("proxyIp.updateGroup")
      }
      onCancel={onCloseModal}
      maskClosable={false}
      okText={
        !selectedProxyIpGroup
          ? translate("button.createNew")
          : translate("button.update")
      }
      cancelText={translate("cancel")}
      width="45rem"
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
    selectedProxyIpGroup: state?.ProxyIpGroup?.selectedProxyIpGroup,
  }),
  {
    actSaveSelectedProxyIpGroup,
    actSaveCreateProxyIpGroup,
    actSaveUpdateProxyIpGroup,
  }
)(ModalProxyIpGroup);
