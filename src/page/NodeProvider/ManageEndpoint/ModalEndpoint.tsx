import { useState, useEffect, useRef } from "react";
import { Modal, Form, Input, Alert } from "antd";
import { HoverLink } from "@/component";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { actSaveSelectedNodeEndpoint } from "@/redux/nodeEndpoint";
import {
  useUpdateNodeEndpoint,
  useCreateNodeEndpoint,
  useTranslation,
} from "@/hook";

const { TextArea } = Input;

const ModalNodeEndpoint = (props: any) => {
  const { translate } = useTranslation();
  const {
    isModalOpen,
    setModalOpen,
    selectedNodeEndpoint,
    selectedNodeEndpointGroup,
    setShouldRefetch,
  } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    updateNodeEndpoint,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateNodeEndpoint();
  const {
    createNodeEndpoint,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateNodeEndpoint();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
    form.setFieldsValue({
      endpoint: selectedNodeEndpoint?.endpoint || "",
    });
  }, [isModalOpen, form, selectedNodeEndpoint]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedNodeEndpoint(null);
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
      const { endpoint } = await form.validateFields(["endpoint"]);
      setBtnLoading(true);

      if (selectedNodeEndpoint) {
        updateNodeEndpoint({
          endpoint,
          id: selectedNodeEndpoint?.id,
          groupId: selectedNodeEndpointGroup?.id,
        });
        return;
      }

      const listEndpoint = endpoint?.split(",") || [];
      const listNodeEndpoint = listEndpoint?.map((endpoint: string) => ({
        endpoint,
        groupId: selectedNodeEndpointGroup?.id,
      }));
      createNodeEndpoint(listNodeEndpoint);
    } catch {}
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        !selectedNodeEndpoint
          ? translate("nodeProvider.createNodeEndpoint")
          : translate("nodeProvider.updateNodeEndpoint")
      }
      onCancel={onCloseModal}
      mask={{ closable: false }}
      okText={
        !selectedNodeEndpoint
          ? translate("button.createNew")
          : translate("button.update")
      }
      cancelText={translate("cancel")}
      width="50rem"
      onOk={onSubmitForm}
      confirmLoading={isBtnLoading}
    >
      <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
        <Alert
          title={
            <HoverLink
              prefixString={translate("nodeProvider.createNodeEndpointHelper")}
              postString=""
              textLink={translate("here")}
              link="https://chainlist.org/chain/1"
              isOpenNewTab={true}
            />
          }
          type="info"
          showIcon
          className="help"
          style={{ marginBottom: "1rem" }}
        />

        <Form.Item
          label="Node endpoint:"
          name="endpoint"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <TextArea
            placeholder={
              !selectedNodeEndpoint
                ? `${translate(
                    "nodeProvider.placeholderCreate",
                  )}: \nhttps://1rpc.io/eth, https://cloudflare-eth.com`
                : translate("nodeProvider.placeholderUpdate")
            }
            className="custom-input"
            size="large"
            rows={!selectedNodeEndpoint ? 5 : 3}
            // @ts-ignore
            ref={inputRef}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedNodeEndpoint: state?.NodeEndpoint?.selectedNodeEndpoint,
    selectedNodeEndpointGroup:
      state?.NodeEndpointGroup?.selectedNodeEndpointGroup,
  }),
  {
    actSaveSelectedNodeEndpoint,
  },
)(ModalNodeEndpoint);
