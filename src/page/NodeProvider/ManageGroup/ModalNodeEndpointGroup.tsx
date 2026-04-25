import { useState, useEffect, useRef } from "react";
import { Modal, Form, Input, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { actSaveSelectedNodeEndpointGroup } from "@/redux/nodeEndpointGroup";
import {
  useUpdateNodeEndpointGroup,
  useCreateNodeEndpointGroup,
  useTranslation,
} from "@/hook";
import { CHAIN_TYPE } from "@/electron/constant";
import { getChainConfig } from "@/service/util";
import { ChainWrapper } from "./style";

const { Option } = Select;
const { TextArea } = Input;

const ModalNodeEndpointGroup = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedNodeEndpointGroup } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);
  const { locale } = useTranslation();

  const {
    updateNodeEndpointGroup,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateNodeEndpointGroup();
  const {
    createNodeEndpointGroup,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateNodeEndpointGroup();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
    form.setFieldsValue({
      name: selectedNodeEndpointGroup?.name || "",
      note: selectedNodeEndpointGroup?.note || "",
      chainType: selectedNodeEndpointGroup?.chainType || CHAIN_TYPE.EVM,
    });
  }, [isModalOpen, form, selectedNodeEndpointGroup]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedNodeEndpointGroup(null);
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
      const { name, chainType, note } = await form.validateFields([
        "name",
        "note",
        "chainType",
      ]);
      setBtnLoading(true);

      if (selectedNodeEndpointGroup) {
        updateNodeEndpointGroup({
          name,
          chainType,
          note,
          id: selectedNodeEndpointGroup?.id,
        });
        return;
      }

      createNodeEndpointGroup({ name, chainType, note });
    } catch { }
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        !selectedNodeEndpointGroup
          ? translate("button.createNew")
          : translate("button.update")
      }
      onCancel={onCloseModal}
      mask={{ closable: false }}
      okText={
        !selectedNodeEndpointGroup
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

        <Form.Item
          label={`${translate("wallet.blockchainType")}:`}
          name="chainType"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <Select
            placeholder={translate("wallet.egBlockchainType")}
            size="large"
            className="custom-select"
          >
            {getChainConfig(locale)?.map((config: any) => {
              return (
                <Option key={config?.key}>
                  <ChainWrapper>
                    <div className="icon">
                      <img src={config?.image} alt="" />
                    </div>
                    <span className="text">{config?.name}</span>
                  </ChainWrapper>
                </Option>
              );
            })}
          </Select>
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
    selectedNodeEndpointGroup:
      state?.NodeEndpointGroup?.selectedNodeEndpointGroup,
  }),
  {
    actSaveSelectedNodeEndpointGroup,
  }
)(ModalNodeEndpointGroup);
