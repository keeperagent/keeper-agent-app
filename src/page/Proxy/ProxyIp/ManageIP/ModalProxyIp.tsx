import { useState, useEffect, useRef, Fragment } from "react";
import { Modal, Form, Input, Select, InputNumber } from "antd";
import { connect } from "react-redux";
import { isIP } from "is-ip";
import { RootState } from "@/redux/store";
import {
  actSaveSelectedProxyIp,
  actSaveCreateProxyIp,
  actSaveUpdateProxyIp,
} from "@/redux/proxyIp";
import { useUpdateProxyIp, useCreateProxyIp, useTranslation } from "@/hook";
import { IProxyIp } from "@/electron/type";
import { LIST_NETWORK_PROTOCOL } from "@/electron/constant";
import { getListIPAndPort, IProtocol } from "./common";

const { TextArea } = Input;

const ModalProxyIp = (props: any) => {
  const { translate } = useTranslation();
  const {
    isModalOpen,
    setModalOpen,
    selectedProxyIp,
    selectedProxyIpGroup,
    setShouldRefetch,
  } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    updateProxyIp,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateProxyIp();
  const {
    createProxyIp,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateProxyIp();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
    form.setFieldsValue({
      ip: selectedProxyIp?.ip || "",
      port: selectedProxyIp?.port || "",
      protocol: selectedProxyIp?.protocol || null,
      listIPPort: "",
    });
  }, [isModalOpen, form, selectedProxyIp]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedProxyIp(null);
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
      setShouldRefetch(true);
    }
  }, [isCreateLoading, isCreateSuccess]);

  const onSubmitForm = async () => {
    try {
      const { protocol, listIPPort, port, ip } = await form.validateFields([
        "protocol",
        "listIPPort",
        "port",
        "ip",
      ]);
      setBtnLoading(true);

      if (selectedProxyIp) {
        updateProxyIp({
          protocol,
          port,
          ip,
          id: selectedProxyIp?.id,
        });
        return;
      }

      let listIP = getListIPAndPort(listIPPort);
      listIP = listIP?.map((item: IProxyIp) => ({
        ...item,
        protocol,
        groupId: selectedProxyIpGroup?.id,
      }));
      createProxyIp(listIP);
    } catch {}
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        !selectedProxyIp
          ? translate("proxyIp.create")
          : translate("proxyIp.update")
      }
      onCancel={onCloseModal}
      maskClosable={false}
      okText={
        !selectedProxyIp
          ? translate("button.createNew")
          : translate("button.update")
      }
      cancelText={translate("cancel")}
      width="47rem"
      onOk={onSubmitForm}
      confirmLoading={isBtnLoading}
    >
      <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
        <Form.Item
          label={translate("proxy.protocol")}
          name="protocol"
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
            options={LIST_NETWORK_PROTOCOL?.map((protocol: IProtocol) => ({
              value: protocol?.value,
              label: protocol?.prefix,
            }))}
            placeholder={translate("proxy.chooseProtocol")}
            allowClear
          />
        </Form.Item>

        {selectedProxyIp ? (
          <Fragment>
            <Form.Item
              label="IP:"
              name="ip"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Input
                placeholder={translate("proxy.enterIP")}
                className="custom-input"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Port:"
              name="port"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <InputNumber
                placeholder={translate("proxy.enterPort")}
                className="custom-input-number"
                size="large"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Fragment>
        ) : (
          <Form.Item
            label={translate("proxy.listIPAndPort")}
            name="listIPPort"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
              {
                validator(_, value: string) {
                  if (!value) {
                    return Promise.resolve();
                  }

                  const listIP = getListIPAndPort(value);
                  for (let i = 0; i < listIP?.length; i++) {
                    const item = listIP[i];

                    if (!isIP(item?.ip || "")) {
                      return Promise.reject(
                        Error(translate("proxy.invalid.IP"))
                      );
                    }

                    if (isNaN(Number(item?.port))) {
                      return Promise.reject(
                        Error(translate("proxy.invalid.Port"))
                      );
                    }
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <TextArea
              placeholder={translate("proxy.enter.example")}
              className="custom-input"
              size="large"
              // @ts-ignore
              ref={inputRef}
              rows={5}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedProxyIp: state?.ProxyIp?.selectedProxyIp,
    selectedProxyIpGroup: state?.ProxyIpGroup?.selectedProxyIpGroup,
  }),
  {
    actSaveSelectedProxyIp,
    actSaveCreateProxyIp,
    actSaveUpdateProxyIp,
  }
)(ModalProxyIp);
