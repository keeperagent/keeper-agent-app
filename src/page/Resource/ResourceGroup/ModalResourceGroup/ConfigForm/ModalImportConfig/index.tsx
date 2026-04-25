import { useEffect, useState } from "react";
import { Modal } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { UploadFile } from "@/component";
import {
  useGetOneResourceGroup,
  useImportResourceGroupConfig,
  useTranslation,
} from "@/hook";
import { IFile } from "@/types/interface";
import { FILE_TYPE } from "@/config/constant";
import { ModalWrapper } from "./style";

const ModalImportConfig = (props: any) => {
  const { isModalOpen, setModalOpen, selectedResourceGroup } = props;
  const [listFile, setListFile] = useState<IFile[]>([]);
  const { importResourceGroupConfig, loading, isSuccess } =
    useImportResourceGroupConfig();
  const { getOneResourceGroup } = useGetOneResourceGroup();
  const { translate } = useTranslation();

  useEffect(() => {
    if (!loading && isSuccess) {
      onCloseModal();
      if (selectedResourceGroup) {
        getOneResourceGroup(Number(selectedResourceGroup?.id?.toString()));
      }
    }
  }, [loading, isSuccess, selectedResourceGroup]);

  const onCloseModal = () => {
    setModalOpen(false);
    setListFile([]);
  };

  const onSubmitForm = async () => {
    importResourceGroupConfig(selectedResourceGroup?.id, listFile[0]?.path);
  };

  return (
    <Modal
      open={isModalOpen}
      title={translate("resource.importConfig")}
      onCancel={onCloseModal}
      mask={{ closable: true }}
      okText={translate("button.import")}
      cancelText={translate("cancel")}
      width="45rem"
      confirmLoading={loading}
      onOk={onSubmitForm}
    >
      <ModalWrapper>
        <UploadFile
          listFile={listFile}
          setListFile={setListFile}
          listExt={[FILE_TYPE.TXT]}
          mapErrorWithFile={{}}
          single={true}
        />
      </ModalWrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedResourceGroup: state?.ResourceGroup?.selectedResourceGroup,
  }),
  {}
)(ModalImportConfig);
