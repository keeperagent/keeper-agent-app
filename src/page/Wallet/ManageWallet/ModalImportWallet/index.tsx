import { useEffect, useState } from "react";
import { Modal, Form, Select, Alert } from "antd";
import { connect } from "react-redux";
import _ from "lodash";
import { RootState } from "@/redux/store";
import { UploadFile, HoverLink } from "@/component";
import { useGetListWalletGroup, useImportWallet, useTranslation } from "@/hook";
import { actSetShouldShowUploadWalletHelpAlert } from "@/redux/preference";
import { actSaveSelectedWalletGroup } from "@/redux/walletGroup";
import { IFile } from "@/types/interface";
import { PasswordInput } from "@/component/Input";
import { TagOption } from "@/component";
import { IWalletGroup } from "@/electron/type";
import { EMPTY_STRING, FILE_TYPE } from "@/config/constant";
import { ModalWrapper, OptionWrapper } from "./style";

const { Option } = Select;

let searchWalletGroupTimeOut: any = null;
const ENCRYPT_MODE = {
  NO_ENSCRYPT: "NO_ENSCRYPT",
  ENCRYPT: "ENCRYPT",
};

const ModalImportWallet = (props: any) => {
  const { translate } = useTranslation();
  const {
    isModalOpen,
    setModalOpen,
    listWalletGroup,
    setShouldRefetch,
    selectedWalletGroup,
    showUploadWalletHelpAlert,
  } = props;
  const [listFile, setListFile] = useState<IFile[]>([]);
  const [form] = Form.useForm();
  const [mode, setMode] = useState(ENCRYPT_MODE.NO_ENSCRYPT);
  const { getListWalletGroup } = useGetListWalletGroup();
  const { importWallet, loading, isSuccess } = useImportWallet();

  useEffect(() => {
    form.setFieldsValue({
      groupId: selectedWalletGroup?.id,
      encryptKey: null,
    });
  }, [isModalOpen]);

  useEffect(() => {
    getListWalletGroup({
      page: 1,
      pageSize: 1000,
    });
  }, []);

  const onCloseModal = () => {
    setModalOpen(false);
    setListFile([]);

    form.setFieldsValue({
      groupId: null,
    });
  };

  const onSubmitForm = async () => {
    try {
      const { groupId, encryptKey } = await form.validateFields([
        "groupId",
        "encryptKey",
      ]);

      importWallet({
        groupId,
        listFilePath: listFile.map((file: IFile) => file?.path),
        encryptKey,
      });
    } catch {}
  };

  useEffect(() => {
    if (!loading && isSuccess) {
      setShouldRefetch(true);

      const { groupId } = form.getFieldsValue(["groupId"]);
      props?.actSaveSelectedWalletGroup(
        _.find(listWalletGroup, { id: groupId }) || null,
      );
      onCloseModal();
    }
  }, [loading, isSuccess]);

  const onSearchWalletGroup = (text: string) => {
    if (searchWalletGroupTimeOut) {
      clearTimeout(searchWalletGroupTimeOut);
    }
    searchWalletGroupTimeOut = setTimeout(() => {
      getListWalletGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const onCloseAlert = () => {
    props?.actSetShouldShowUploadWalletHelpAlert(false);
  };

  return (
    <Modal
      open={isModalOpen}
      title={translate("wallet.importWallet")}
      onCancel={onCloseModal}
      maskClosable={false}
      okText={translate("button.import")}
      cancelText={translate("cancel")}
      width="45rem"
      confirmLoading={loading}
      onOk={onSubmitForm}
    >
      <ModalWrapper>
        {showUploadWalletHelpAlert && (
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

        <Form layout="vertical" form={form} style={{ marginTop: "1rem" }}>
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
              placeholder={translate("wallet.importToWalletGroup")}
              size="large"
              className="custom-select"
              showSearch
              onSearch={onSearchWalletGroup}
              filterOption={false}
              optionLabelProp="label"
            >
              {listWalletGroup?.map((group: IWalletGroup) => (
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
              label={`${translate("wallet.encryptKey")}`}
              name="encryptKey"
            >
              <PasswordInput
                name="encryptKey"
                placeholder={`${translate("wallet.enterEncryptKey")}`}
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
    listWalletGroup: state?.WalletGroup?.listWalletGroup,
    selectedWalletGroup: state?.WalletGroup?.selectedWalletGroup,
    showUploadWalletHelpAlert: state?.Preference?.showUploadWalletHelpAlert,
  }),
  { actSaveSelectedWalletGroup, actSetShouldShowUploadWalletHelpAlert },
)(ModalImportWallet);
