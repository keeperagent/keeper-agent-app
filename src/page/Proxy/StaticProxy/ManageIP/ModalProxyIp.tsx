import { useState, useEffect, useRef, Fragment } from "react";
import { Modal, Form, Input, Select, InputNumber } from "antd";
import { connect } from "react-redux";
import { isIP } from "is-ip";
import { RootState } from "@/redux/store";
import {
  actSaveSelectedStaticProxy,
  actSaveCreateStaticProxy,
  actSaveUpdateStaticProxy,
} from "@/redux/staticProxy";
import {
  useUpdateStaticProxy,
  useCreateStaticProxy,
  useTranslation,
} from "@/hook";
import { IStaticProxy } from "@/electron/type";
import { LIST_NETWORK_PROTOCOL } from "@/electron/constant";
import { getListIPAndPort, IProtocol } from "./common";

const { TextArea } = Input;

const ModalProxyIp = (props: any) => {
  const { translate } = useTranslation();
  const {
    isModalOpen,
    setModalOpen,
    selectedStaticProxy,
    selectedStaticProxyGroup,
    setShouldRefetch,
  } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    updateStaticProxy,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateStaticProxy();
  const {
    createStaticProxy,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateStaticProxy();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
    form.setFieldsValue({
      ip: selectedStaticProxy?.ip || "",
      port: selectedStaticProxy?.port || "",
      protocol: selectedStaticProxy?.protocol || null,
      username: selectedStaticProxy?.username || "",
      password: selectedStaticProxy?.password || "",
      listIPPort: "",
    });
  }, [isModalOpen, form, selectedStaticProxy]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedStaticProxy(null);
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
      const { protocol, listIPPort, port, ip, username, password } =
        await form.validateFields([
          "protocol",
          "listIPPort",
          "port",
          "ip",
          "username",
          "password",
        ]);
      setBtnLoading(true);

      if (selectedStaticProxy) {
        updateStaticProxy({
          protocol,
          port,
          ip,
          username: username || null,
          password: password || null,
          id: selectedStaticProxy?.id,
        });
        return;
      }

      let listIP = getListIPAndPort(listIPPort);
      listIP = listIP?.map((item: IStaticProxy) => ({
        ...item,
        protocol,
        groupId: selectedStaticProxyGroup?.id,
      }));
      createStaticProxy(listIP);
    } catch {}
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        !selectedStaticProxy
          ? translate("staticProxy.create")
          : translate("staticProxy.update")
      }
      onCancel={onCloseModal}
      mask={{ closable: false }}
      okText={
        !selectedStaticProxy
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

        {selectedStaticProxy ? (
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
                className="custom-input"
                size="large"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item label={translate("proxy.username")} name="username">
              <Input
                placeholder={translate("proxy.usernamePlaceholder")}
                className="custom-input"
                size="large"
              />
            </Form.Item>

            <Form.Item label={translate("proxy.password")} name="password">
              <Input.Password
                placeholder={translate("proxy.passwordPlaceholder")}
                className="custom-input"
                size="large"
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
                        Error(translate("proxy.invalid.ip")),
                      );
                    }

                    if (isNaN(Number(item?.port))) {
                      return Promise.reject(
                        Error(translate("proxy.invalid.port")),
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
    selectedStaticProxy: state?.StaticProxy?.selectedStaticProxy,
    selectedStaticProxyGroup: state?.StaticProxyGroup?.selectedStaticProxyGroup,
  }),
  {
    actSaveSelectedStaticProxy,
    actSaveCreateStaticProxy,
    actSaveUpdateStaticProxy,
  },
)(ModalProxyIp);
