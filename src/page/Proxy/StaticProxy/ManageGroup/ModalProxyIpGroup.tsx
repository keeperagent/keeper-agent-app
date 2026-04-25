import { useState, useEffect, useRef } from "react";
import { Modal, Form, Input } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  actSaveSelectedStaticProxyGroup,
  actSaveCreateStaticProxyGroup,
  actSaveUpdateStaticProxyGroup,
} from "@/redux/staticProxyGroup";
import {
  useUpdateStaticProxyGroup,
  useCreateStaticProxyGroup,
  useTranslation,
} from "@/hook";

const { TextArea } = Input;

const ModalProxyIpGroup = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedStaticProxyGroup } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    updateStaticProxyGroup,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateStaticProxyGroup();
  const {
    createStaticProxyGroup,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateStaticProxyGroup();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
    form.setFieldsValue({
      name: selectedStaticProxyGroup?.name || "",
      note: selectedStaticProxyGroup?.note || "",
    });
  }, [isModalOpen, form, selectedStaticProxyGroup]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedStaticProxyGroup(null);
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

      if (selectedStaticProxyGroup) {
        updateStaticProxyGroup({
          name,
          note,
          id: selectedStaticProxyGroup?.id,
        });
      } else {
        createStaticProxyGroup({ name, note });
      }
    } catch {}
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        !selectedStaticProxyGroup
          ? translate("staticProxy.createGroup")
          : translate("staticProxy.updateGroup")
      }
      onCancel={onCloseModal}
      mask={{ closable: false }}
      okText={
        !selectedStaticProxyGroup
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
    selectedStaticProxyGroup: state?.StaticProxyGroup?.selectedStaticProxyGroup,
  }),
  {
    actSaveSelectedStaticProxyGroup,
    actSaveCreateStaticProxyGroup,
    actSaveUpdateStaticProxyGroup,
  },
)(ModalProxyIpGroup);
