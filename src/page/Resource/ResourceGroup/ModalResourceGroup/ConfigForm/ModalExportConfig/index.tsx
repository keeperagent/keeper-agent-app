import { useEffect } from "react";
import { Modal, Form, Input } from "antd";
import isValidFilename from "valid-filename";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { UploadIcon } from "@/component/Icon";
import {
  useChooseFolder,
  useExportResourceGroupConfig,
  useTranslation,
} from "@/hook";
import { ModalWrapper, IconWrapper } from "./style";

const cacheItemName = "exportResourceConfigFolderPath";

const ModalExportConfig = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedResourceGroup } = props;

  const { exportResourceGroupConfig, loading, isSuccess } =
    useExportResourceGroupConfig();
  const { chooseFolder } = useChooseFolder();
  const [form] = Form.useForm();

  useEffect(() => {
    if (isModalOpen) {
      const cacheItem = localStorage.getItem(cacheItemName);
      if (cacheItem) {
        form.setFieldsValue({
          folderPath: cacheItem,
          fileName: "exported_resource_config",
        });
      } else {
        form.setFieldsValue({
          fileName: "exported_resource_config",
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
      const { folderPath, fileName } = await form.validateFields([
        "folderPath",
        "fileName",
      ]);
      exportResourceGroupConfig({
        folderPath,
        resourceGroupId: selectedResourceGroup?.id!,
        fileName,
      });
    } catch {}
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
      title={translate("resource.exportConfig")}
      onCancel={onCloseModal}
      maskClosable={true}
      okText="Export"
      cancelText={translate("cancel")}
      width="50rem"
      confirmLoading={loading}
      onOk={onSubmitForm}
    >
      <ModalWrapper>
        <Form layout="vertical" form={form}>
          <Form.Item
            label={`${translate("workflow.selectFolderExport")}:`}
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
              placeholder={translate("workflow.selectFolderExportPlaceholder")}
              size="large"
              addonAfter={
                <IconWrapper onClick={onChooseFolder}>
                  <UploadIcon />
                </IconWrapper>
              }
            />
          </Form.Item>

          <Form.Item
            label={`${translate("workflow.exportFileName")}:`}
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
                    Error(translate("workflow.validateNameFile"))
                  );
                },
              },
            ]}
          >
            <Input
              className="custom-input"
              placeholder={translate("workflow.exportFileNamePlaceholder")}
              size="large"
              addonAfter=".txt"
            />
          </Form.Item>
        </Form>
      </ModalWrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedResourceGroup: state?.ResourceGroup?.selectedResourceGroup,
  }),
  {}
)(ModalExportConfig);
