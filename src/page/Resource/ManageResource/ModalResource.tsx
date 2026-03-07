import { useState, useEffect, useMemo, useRef } from "react";
import { Modal, Form, Input, Select } from "antd";
import { connect } from "react-redux";
import _ from "lodash";
import { RootState } from "@/redux/store";
import { TagOption } from "@/component";
import { actSaveSelectedResource } from "@/redux/resource";
import { PasswordInput } from "@/component/Input";
import { actSaveSelectedResourceGroup } from "@/redux/resourceGroup";
import {
  useUpdateResource,
  useCreateResource,
  useGetListResourceGroup,
  useTranslation,
} from "@/hook";
import { IResource, IResourceGroup, ColumnConfig } from "@/electron/type";
import { getResourceColumn } from "@/service/tableView";
import { ModalWrapper, OptionWrapper } from "./style";
import { EMPTY_STRING } from "@/config/constant";

const { Option } = Select;
let searchGroupTimeOut: any = null;
const ENCRYPT_MODE = {
  NO_ENSCRYPT: "NO_ENSCRYPT",
  ENCRYPT: "ENCRYPT",
};

type IModalResourceProps = {
  isModalOpen: boolean;
  setModalOpen: (value: boolean) => void;
  selectedResource: IResource | null;
  actSaveSelectedResource: (value: IResource | null) => void;
  selectedResourceGroup: IResourceGroup | null;
  listResourceGroup: IResourceGroup[];
  actSaveSelectedResourceGroup: (value: IResourceGroup | null) => void;
};

const ModalResource = (props: IModalResourceProps) => {
  const { translate } = useTranslation();
  const {
    isModalOpen,
    setModalOpen,
    selectedResource,
    selectedResourceGroup,
    listResourceGroup,
  } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState(ENCRYPT_MODE.NO_ENSCRYPT);
  const { getListResourceGroup } = useGetListResourceGroup();

  useEffect(() => {
    getListResourceGroup({
      page: 1,
      pageSize: 10000,
    });

    return () => {
      searchGroupTimeOut = null;
    };
  }, []);

  const listColumn = useMemo(() => {
    return getResourceColumn(selectedResourceGroup || {});
  }, [selectedResourceGroup]);

  const listFieldName = useMemo(() => {
    return listColumn?.map((column: ColumnConfig) => column?.dataIndex!);
  }, [listColumn]);

  const {
    updateResource,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateResource();
  const {
    createResource,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateResource();

  useEffect(() => {
    if (isModalOpen && !searchGroupTimeOut) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }

    if (selectedResource) {
      form.setFieldsValue(_.pick(selectedResource, listFieldName));
    } else {
      form.resetFields([...listFieldName]);
    }

    form.setFieldsValue({
      groupId: selectedResourceGroup?.id,
      encryptKey: null,
    });
  }, [
    isModalOpen,
    form,
    selectedResource,
    listFieldName,
    selectedResourceGroup,
  ]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedResource(null);
    }, 300);
  };

  useEffect(() => {
    if (!isUpdateLoading && isUpdateSuccess) {
      setBtnLoading(false);
      onCloseModal();

      const { groupId } = form.getFieldsValue(["groupId"]);
      props?.actSaveSelectedResourceGroup(
        _.find(listResourceGroup, { id: groupId }) || null,
      );
    }
  }, [isUpdateLoading, isUpdateSuccess]);

  useEffect(() => {
    if (!isCreateLoading && isCreateSuccess) {
      setBtnLoading(false);
      onCloseModal();

      const { groupId } = form.getFieldsValue(["groupId"]);
      props?.actSaveSelectedResourceGroup(
        _.find(listResourceGroup, { id: groupId }) || null,
      );
    }
  }, [isCreateLoading, isCreateSuccess]);

  const onSubmitForm = async () => {
    try {
      const { encryptKey, ...rest } = await form.validateFields([
        ...listFieldName,
        "groupId",
        "encryptKey",
      ]);
      setBtnLoading(true);

      if (selectedResource) {
        updateResource({ id: selectedResource?.id, ...rest }, encryptKey);
      } else {
        createResource(rest, encryptKey);
      }
    } catch {}
  };

  const onSearchResourceGroup = (text: string) => {
    if (searchGroupTimeOut) {
      clearTimeout(searchGroupTimeOut);
    }
    searchGroupTimeOut = setTimeout(() => {
      getListResourceGroup({ page: 1, pageSize: 10000, searchText: text });
    }, 200);
  };

  const onChangeSelectedResourceGroup = (value: number) => {
    props?.actSaveSelectedResourceGroup(
      _.find(listResourceGroup, { id: value }) || null,
    );
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        selectedResource
          ? translate("button.edit")
          : translate("button.createNew")
      }
      onCancel={onCloseModal}
      maskClosable={false}
      okText={
        selectedResource
          ? translate("button.update")
          : translate("button.create")
      }
      cancelText={translate("cancel")}
      width="45rem"
      onOk={onSubmitForm}
      confirmLoading={isBtnLoading}
    >
      <ModalWrapper>
        <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
          {!selectedResource && (
            <Form.Item
              label={`${translate("resource.resourceGroup")}:`}
              name="groupId"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                placeholder={translate("select.group")}
                size="large"
                className="custom-select"
                showSearch
                onSearch={onSearchResourceGroup}
                filterOption={false}
                optionLabelProp="label"
                onChange={onChangeSelectedResourceGroup}
              >
                {listResourceGroup?.map((group: IResourceGroup) => (
                  <Option key={group?.id} value={group?.id} label={group?.name}>
                    <OptionWrapper>
                      <div className="name">{group?.name}</div>
                      <div className="description">
                        {group?.note || EMPTY_STRING}
                      </div>
                    </OptionWrapper>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {listColumn?.map((column: ColumnConfig, index: number) => (
            <Form.Item
              label={`${column?.title}:`}
              name={column?.dataIndex!}
              key={index}
            >
              <Input
                placeholder={`${translate("resource.enter")} ${column.title}`}
                className="custom-input"
                size="large"
                // @ts-ignore
                ref={index === 0 ? inputRef : null}
              />
            </Form.Item>
          ))}

          <div className="encript">
            <TagOption
              content={translate("wallet.noEncryption")}
              checked={mode === ENCRYPT_MODE.NO_ENSCRYPT}
              onClick={() => setMode(ENCRYPT_MODE.NO_ENSCRYPT)}
            />

            <TagOption
              content={translate("wallet.encryption")}
              checked={mode === ENCRYPT_MODE.ENCRYPT}
              onClick={() => setMode(ENCRYPT_MODE.ENCRYPT)}
            />
          </div>

          {mode === ENCRYPT_MODE.ENCRYPT && (
            <Form.Item
              label={`${translate("wallet.secretKey")}`}
              name="encryptKey"
            >
              <PasswordInput
                name="encryptKey"
                placeholder={`${translate("wallet.enterSecretKey")}`}
                extendClass="encryptKey"
              />
            </Form.Item>
          )}
        </Form>
      </ModalWrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedResource: state?.Resource?.selectedResource,
    selectedResourceGroup: state?.ResourceGroup?.selectedResourceGroup,
    listResourceGroup: state?.ResourceGroup?.listResourceGroup,
  }),
  {
    actSaveSelectedResource,
    actSaveSelectedResourceGroup,
  },
)(ModalResource);
