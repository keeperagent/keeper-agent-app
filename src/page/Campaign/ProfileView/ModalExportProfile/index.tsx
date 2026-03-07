import { useEffect } from "react";
import { Modal, Form, Input } from "antd";
import isValidFilename from "valid-filename";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { UploadIcon } from "@/component/Icon";
import { useChooseFolder, useTranslation } from "@/hook";
import { useExportCampaignProfile } from "@/hook";
import { PasswordInput } from "@/component/Input";
import { ModalWrapper, IconWrapper } from "./style";

const cacheItemName = "exportCampaignProfileFolderPath";

const ModalExportProfile = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedCampaign } = props;

  const { exportCampaignProfile, loading, isSuccess } =
    useExportCampaignProfile();
  const { chooseFolder } = useChooseFolder();
  const [form] = Form.useForm();

  useEffect(() => {
    if (isModalOpen) {
      const cacheItem = localStorage.getItem(cacheItemName);
      if (cacheItem) {
        form.setFieldsValue({
          folderPath: cacheItem,
          fileName: "exported_campaign_profile",
          encryptKey: "",
        });
      }
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!loading && isSuccess) {
      onCloseModal();
    }
  }, [loading, isSuccess]);

  const onCloseModal = () => {
    setModalOpen(false);
  };

  const onSubmitForm = async () => {
    try {
      const { folderPath, fileName, encryptKey } = await form.validateFields([
        "folderPath",
        "fileName",
        "encryptKey",
      ]);

      exportCampaignProfile({
        folderPath,
        fileName,
        encryptKey,
        campaignId: selectedCampaign?.id,
      });
    } catch {}
    // }
  };

  const onChooseFolder = async () => {
    const folderPath = await chooseFolder();
    if (folderPath === null) {
      return;
    }

    form.setFieldValue("folderPath", folderPath);
    localStorage.setItem(cacheItemName, folderPath);
    try {
      await form.validateFields(["folderPath"]);
    } catch {}
  };

  return (
    <Modal
      open={isModalOpen}
      title={translate("campaign.exportProfile")}
      onCancel={onCloseModal}
      maskClosable={false}
      okText="Export"
      cancelText={translate("cancel")}
      width="50rem"
      confirmLoading={loading}
      onOk={onSubmitForm}
    >
      <ModalWrapper>
        <Form layout="vertical" form={form}>
          <Form.Item
            label={`${translate("wallet.selectFolderExport")}:`}
            name="folderPath"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
            ]}
          >
            <Input
              className="custom-input"
              placeholder={translate("wallet.selectFolderExportPlaceholder")}
              size="large"
              addonAfter={
                <IconWrapper onClick={onChooseFolder}>
                  <UploadIcon />
                </IconWrapper>
              }
            />
          </Form.Item>

          <Form.Item
            label={`${translate("wallet.exportFileName")}:`}
            name="fileName"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
              {
                validator(_, value) {
                  if (!value) {
                    return Promise.resolve();
                  }

                  if (isValidFilename(value)) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    Error(translate("wallet.validateNameFile"))
                  );
                },
              },
            ]}
          >
            <Input
              className="custom-input"
              placeholder={translate("wallet.exportFileNamePlaceholder")}
              size="large"
              addonAfter=".xlsx"
            />
          </Form.Item>

          <Form.Item
            label={`${translate("wallet.secretKey")}`}
            name="encryptKey"
          >
            <PasswordInput
              name="encryptKey"
              placeholder={`${translate("wallet.enterSecretKey")}`}
              extendClass="encryptKey-manual"
            />
          </Form.Item>
        </Form>
      </ModalWrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedCampaign: state?.Campaign?.selectedCampaign,
  }),
  {}
)(ModalExportProfile);
