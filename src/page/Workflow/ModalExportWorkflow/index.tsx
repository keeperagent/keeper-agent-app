import { useEffect } from "react";
import { Modal, Form, Input, message } from "antd";
import isValidFilename from "valid-filename";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { UploadIcon } from "@/component/Icon";
import { useChooseFolder, useExportWorkflow, useTranslation } from "@/hook";
import { ModalWrapper, IconWrapper } from "./style";

const cacheItemName = "exportWorkflowFolderPath";

const ModalExportWorkflow = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedRowKeys } = props;

  const { exportWorkflow, loading, isSuccess } = useExportWorkflow();
  const { chooseFolder } = useChooseFolder();
  const [form] = Form.useForm();

  useEffect(() => {
    if (isModalOpen) {
      const cacheItem = localStorage.getItem(cacheItemName);
      if (cacheItem) {
        form.setFieldsValue({
          folderPath: cacheItem,
          fileName: "exported_script",
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
    if (selectedRowKeys.length === 0) {
      message.warning(translate("workflow.selectWorkflow.toExport"));
      setModalOpen(false);
    } else {
      try {
        const { folderPath, fileName } = await form.validateFields([
          "folderPath",
          "fileName",
        ]);
        exportWorkflow({ folderPath, listWorkflowId: selectedRowKeys, fileName });
      } catch {}
    }
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
      title={translate("workflow.exportWorkflow")}
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

export default connect((_state: RootState) => ({}), {})(ModalExportWorkflow);
