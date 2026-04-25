import { useEffect, useState } from "react";
import { Modal } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { UploadFile } from "@/component";
import {
  useGetOneCampaign,
  useImportCampaignConfig,
  useTranslation,
} from "@/hook";
import { IFile } from "@/types/interface";
import { FILE_TYPE } from "@/config/constant";
import { ModalWrapper } from "./style";

const ModalImportCampaign = (props: any) => {
  const { isModalOpen, setModalOpen, selectedCampaign } = props;
  const [listFile, setListFile] = useState<IFile[]>([]);
  const { importCampaignConfig, loading, isSuccess } =
    useImportCampaignConfig();
  const { getOneCampaign } = useGetOneCampaign();
  const { translate } = useTranslation();

  useEffect(() => {
    if (!loading && isSuccess) {
      onCloseModal();
      if (selectedCampaign) {
        getOneCampaign(Number(selectedCampaign?.id?.toString()));
      }
    }
  }, [loading, isSuccess, selectedCampaign]);

  const onCloseModal = () => {
    setModalOpen(false);
    setListFile([]);
  };

  const onSubmitForm = async () => {
    importCampaignConfig(selectedCampaign?.id, listFile[0]?.path);
  };

  return (
    <Modal
      open={isModalOpen}
      title={translate("campaign.importConfig")}
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
    selectedCampaign: state?.Campaign?.selectedCampaign,
  }),
  {}
)(ModalImportCampaign);
