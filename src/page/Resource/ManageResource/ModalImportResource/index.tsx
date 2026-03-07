import { useEffect, useState } from "react";
import { Modal, Form, Select, Alert } from "antd";
import { connect } from "react-redux";
import _ from "lodash";
import { RootState } from "@/redux/store";
import { UploadFile, TagOption, HoverLink } from "@/component";
import { PasswordInput } from "@/component/Input";
import {
  useGetListResourceGroup,
  useImportResource,
  useTranslation,
} from "@/hook";
import { actSaveSelectedResourceGroup } from "@/redux/resourceGroup";
import { actSetShouldShowUploadResourceHelpAlert } from "@/redux/preference";
import { IFile } from "@/types/interface";
import { IResourceGroup } from "@/electron/type";
import { EMPTY_STRING, FILE_TYPE } from "@/config/constant";
import { ModalWrapper, OptionWrapper } from "./style";

const { Option } = Select;

let searchResourceGroupTimeOut: any = null;
const ENCRYPT_MODE = {
  NO_ENSCRYPT: "NO_ENSCRYPT",
  ENCRYPT: "ENCRYPT",
};

const ModalImportResource = (props: any) => {
  const { translate } = useTranslation();
  const {
    isModalOpen,
    setModalOpen,
    listResourceGroup,
    setShouldRefetch,
    selectedResourceGroup,
    showUploadResourceHelpAlert,
  } = props;
  const [listFile, setListFile] = useState<IFile[]>([]);
  const [form] = Form.useForm();
  const { getListResourceGroup } = useGetListResourceGroup();
  const [mode, setMode] = useState(ENCRYPT_MODE.NO_ENSCRYPT);
  const { importResource, loading, isSuccess } = useImportResource();

  useEffect(() => {
    if (selectedResourceGroup?.id) {
      form.setFieldsValue({
        groupId: selectedResourceGroup?.id,
      });
    }
  }, [isModalOpen, selectedResourceGroup]);

  useEffect(() => {
    getListResourceGroup({
      page: 1,
      pageSize: 10000,
    });
  }, []);

  const onCloseModal = () => {
    setModalOpen(false);
    setListFile([]);

    form.setFieldsValue({
      groupId: null,
      encryptKey: null,
    });
  };

  const onSubmitForm = async () => {
    try {
      const { groupId, encryptKey } = await form.validateFields([
        "groupId",
        "encryptKey",
      ]);

      importResource({
        groupId,
        listFilePath: listFile.map((file: IFile) => file?.path),
        encryptKey,
      });
    } catch {}
  };

  useEffect(() => {
    if (!loading && isSuccess) {
      onCloseModal();
      setShouldRefetch(true);

      const { groupId } = form.getFieldsValue(["groupId"]);
      if (groupId) {
        props?.actSaveSelectedResourceGroup(
          _.find(listResourceGroup, { id: groupId }) || null,
        );
      }
    }
  }, [loading, isSuccess]);

  const onSearchResourceGroup = (text: string) => {
    if (searchResourceGroupTimeOut) {
      clearTimeout(searchResourceGroupTimeOut);
    }
    searchResourceGroupTimeOut = setTimeout(() => {
      getListResourceGroup({ page: 1, pageSize: 10000, searchText: text });
    }, 200);
  };

  const onCloseAlert = () => {
    props?.actSetShouldShowUploadResourceHelpAlert(false);
  };

  return (
    <Modal
      open={isModalOpen}
      title={translate("resource.importResource")}
      onCancel={onCloseModal}
      maskClosable={false}
      okText={translate("button.import")}
      cancelText={translate("cancel")}
      width="45rem"
      style={{ top: "6rem" }}
      confirmLoading={loading}
      onOk={onSubmitForm}
    >
      <ModalWrapper>
        <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
          <Form.Item
            label={`${translate("groupName")}:`}
            name="groupId"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
            ]}
          >
            <Select
              placeholder={translate("resource.selectResourceGroup")}
              size="large"
              className="custom-select"
              showSearch
              onSearch={onSearchResourceGroup}
              filterOption={false}
              optionLabelProp="label"
            >
              {listResourceGroup?.map((group: IResourceGroup) => (
                <Option key={group?.id} value={group?.id} label={group?.name}>
                  <OptionWrapper>
                    <div className="name">{group?.name || EMPTY_STRING}</div>
                    <div className="description">
                      {group?.note || EMPTY_STRING}
                    </div>
                  </OptionWrapper>
                </Option>
              ))}
            </Select>
          </Form.Item>

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

        {showUploadResourceHelpAlert && (
          <Alert
            title={
              <span>
                {translate("alert.canImportMultipleFile")}.{" "}
                <span>{translate("alert.downloadSampleFile")}</span>{" "}
                <HoverLink
                  prefixString=""
                  postString=""
                  textLink="here"
                  link="https://keeper-agent-app-public.s3.us-east-1.amazonaws.com/sample_wallet.xlsx"
                  isOpenNewTab={true}
                />
              </span>
            }
            type="warning"
            showIcon
            style={{
              marginBottom: "var(--margin-bottom)",
            }}
            closable
            onClose={onCloseAlert}
          />
        )}

        <UploadFile
          listFile={listFile}
          setListFile={setListFile}
          listExt={[FILE_TYPE.XLSX]}
          mapErrorWithFile={{}}
        />
      </ModalWrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    listResourceGroup: state?.ResourceGroup?.listResourceGroup,
    selectedResourceGroup: state?.ResourceGroup?.selectedResourceGroup,
    showUploadResourceHelpAlert: state?.Preference?.showUploadResourceHelpAlert,
  }),
  { actSaveSelectedResourceGroup, actSetShouldShowUploadResourceHelpAlert },
)(ModalImportResource);
