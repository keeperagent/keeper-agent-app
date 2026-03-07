import { useState, useEffect, useRef } from "react";
import { Modal, Form, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  actSaveSelectedProxy,
  actSaveCreateProxy,
  actSaveUpdateProxy,
  actSetSelectedService,
} from "@/redux/proxy";
import { PasswordInput } from "@/component/Input";
import { useCreateProxy, useUpdateProxy, useTranslation } from "@/hook";
import { LIST_PROXY_SERVICE } from "@/config/constant";
import { PROXY_SERVICE_ICON } from ".";

const ModalProxy = (props: any) => {
  const { selectedService } = props;
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedProxy, setShouldRefetch } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    updateProxy,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateProxy();
  const {
    createProxy,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateProxy();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  useEffect(() => {
    form.setFieldsValue({
      apiKey: selectedProxy?.apiKey || "",
      description: selectedProxy?.description || "",
      serviceType: selectedProxy?.type || selectedService,
    });
  }, [isModalOpen, form, selectedProxy]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedProxy(null);
    }, 300);
  };

  useEffect(() => {
    if (!isUpdateLoading && isUpdateSuccess) {
      setBtnLoading(false);
      onCloseModal();
      setShouldRefetch(true);
    }
  }, [isUpdateLoading, isUpdateSuccess]);

  useEffect(() => {
    if (!isCreateLoading && isCreateSuccess) {
      setBtnLoading(false);
      onCloseModal();
      setShouldRefetch(true);
    }
  }, [isCreateLoading, isCreateSuccess]);

  const onSubmitForm = async () => {
    try {
      const { apiKey, serviceType } = await form.validateFields([
        "apiKey",
        "serviceType",
      ]);
      setBtnLoading(true);

      if (selectedProxy) {
        updateProxy({
          apiKey,
          id: selectedProxy?.id,
          type: serviceType,
        });
      } else {
        createProxy({ apiKey, type: serviceType });
      }

      props?.actSetSelectedService(serviceType);
    } catch {}
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        !selectedProxy
          ? translate("proxy.createProxy")
          : translate("proxy.updateProxy")
      }
      onCancel={onCloseModal}
      maskClosable={false}
      okText={
        !selectedProxy
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
          label={`${translate("service")}:`}
          name="serviceType"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <Select
            size="large"
            className="custom-select"
            options={LIST_PROXY_SERVICE?.map((service) => ({
              value: service?.type,
              label: (
                <span style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={PROXY_SERVICE_ICON[service?.type]}
                    alt={service?.name}
                    style={{
                      width: "1.5rem",
                      height: "1.5rem",
                      marginRight: "1rem",
                      borderRadius: "50%",
                    }}
                  />
                  {service?.name}
                </span>
              ),
            }))}
            disabled={Boolean(selectedProxy)}
          />
        </Form.Item>

        <Form.Item
          label="Key:"
          name="apiKey"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <PasswordInput
            name="apiKey"
            placeholder={translate("proxy.enterApiKey")}
            extendClass="apiKey"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedProxy: state?.Proxy?.selectedProxy,
    selectedService: state?.Proxy?.selectedService,
  }),
  {
    actSaveSelectedProxy,
    actSaveCreateProxy,
    actSaveUpdateProxy,
    actSetSelectedService,
  },
)(ModalProxy);
