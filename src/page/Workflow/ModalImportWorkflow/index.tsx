import { useEffect, useState } from "react";
import { Modal, Alert } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { UploadFile } from "@/component";
import { useImportWorkflow, useTranslation } from "@/hook";
import { actSetShouldShowUploadWorkflowHelpAlert } from "@/redux/preference";
import { IFile } from "@/types/interface";
import { FILE_TYPE } from "@/config/constant";
import { ModalWrapper } from "./style";

const ModalImportWorkflow = (props: any) => {
  const {
    isModalOpen,
    setModalOpen,
    setShouldRefetch,
    showUploadWorkflowHelpAlert,
  } = props;
  const [listFile, setListFile] = useState<IFile[]>([]);
  const { importWorkflow, loading, isSuccess } = useImportWorkflow();
  const { translate } = useTranslation();

  useEffect(() => {}, [isModalOpen]);

  useEffect(() => {
    if (!loading && isSuccess) {
      onCloseModal();
      setShouldRefetch(true);
    }
  }, [loading, isSuccess]);

  const onCloseModal = () => {
    setModalOpen(false);
    setListFile([]);
  };

  const onSubmitForm = async () => {
    importWorkflow(listFile.map((file: IFile) => file?.path));
  };

  const onCloseAlert = () => {
    props?.actSetShouldShowUploadWorkflowHelpAlert(false);
  };

  return (
    <Modal
      open={isModalOpen}
      title={translate("workflow.importWorkflow")}
      onCancel={onCloseModal}
      maskClosable={false}
      okText={translate("button.import")}
      cancelText={translate("cancel")}
      width="45rem"
      confirmLoading={loading}
      onOk={onSubmitForm}
    >
      <ModalWrapper>
        {showUploadWorkflowHelpAlert && (
          <Alert
            title={translate("alert.canImportMultipleFile")}
            type="warning"
            showIcon
            style={{ marginBottom: "var(--margin-bottom)" }}
            closable
            onClose={onCloseAlert}
          />
        )}

        <UploadFile
          listFile={listFile}
          setListFile={setListFile}
          listExt={[FILE_TYPE.TXT]}
          mapErrorWithFile={{}}
        />
      </ModalWrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    showUploadWorkflowHelpAlert: state?.Preference?.showUploadWorkflowHelpAlert,
  }),
  { actSetShouldShowUploadWorkflowHelpAlert },
)(ModalImportWorkflow);
