import { useEffect, useState, Fragment } from "react";
import _ from "lodash";
import { Modal, Form, Input } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { actSaveSelectedCampaign } from "@/redux/campaign";
import { useUpdateCampaign, useTranslation } from "@/hook";
import { UploadButton } from "@/component/Button";
import AdditionalColumn from "./AdditionalColumn";
import { IColumnConfig } from "./AdditionalColumn";
import ModalImportCampaign from "../ModalImportCampaign";
import ModalExportCampaign from "../ModalExportCampaign";
import { Wrapper } from "./style";
import { NUMBER_OF_COLUMN } from "@/electron/constant";

const { TextArea } = Input;

const ModalConfig = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedCampaign } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [config, setConfig] = useState<IColumnConfig>({});

  const [form] = Form.useForm();
  const { updateCampaign, loading, isSuccess } = useUpdateCampaign();
  const [isModalImportConfigOpen, setModalImportConfigOpen] = useState(false);
  const [isModalExportConfigOpen, setModalExportConfigOpen] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      defaultOpenUrl: selectedCampaign?.defaultOpenUrl,
    });

    const columnKeys = Array.from({ length: NUMBER_OF_COLUMN }, (_, i) => {
      const num = i + 1;
      return [`col${num}Variable`, `col${num}Label`];
    }).flat();

    setConfig(_.pick(selectedCampaign, columnKeys));
  }, [isModalOpen, form, selectedCampaign]);

  useEffect(() => {
    if (!loading && isSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [loading, isSuccess]);

  const onCloseModal = () => {
    setModalOpen(false);
  };

  const onSubmitForm = async () => {
    try {
      const { defaultOpenUrl } = await form.validateFields(["defaultOpenUrl"]);

      const updatedData = {
        id: selectedCampaign?.id,
        defaultOpenUrl,
        ...config,
      };
      updateCampaign(updatedData);
      props?.actSaveSelectedCampaign({
        ...selectedCampaign,
        defaultOpenUrl,
        ...config,
      });
    } catch {}
  };

  const onOpenModalImportConfig = (_event: any) => {
    setModalImportConfigOpen(true);
  };

  const onOpenModalExportConfig = () => {
    setModalExportConfigOpen(true);
  };

  return (
    <Fragment>
      <Modal
        open={isModalOpen}
        onCancel={onCloseModal}
        title={translate("campaign.configSubColumn")}
        width="50rem"
        confirmLoading={isBtnLoading}
        onOk={onSubmitForm}
        okText={translate("button.update")}
        cancelText={translate("cancel")}
      >
        <Wrapper>
          <Form form={form} layout="vertical" style={{ marginTop: "2rem" }}>
            <Form.Item
              label={`${translate("campaign.defaultOpenUrl")}:`}
              name="defaultOpenUrl"
            >
              <TextArea
                className="custom-input"
                size="large"
                placeholder={translate("workflow.enterValidateLinkURL")}
              />
            </Form.Item>

            <Form.Item
              label={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <div>{translate("campaign.additionalColumn")}:</div>

                  <UploadButton
                    text="Import"
                    onClick={onOpenModalImportConfig}
                    isUploadButton={false}
                    style={{
                      transform: "scale(0.8)",
                      marginRight: "0.3rem",
                      marginLeft: "auto",
                    }}
                  />

                  <UploadButton
                    text="Export"
                    onClick={onOpenModalExportConfig}
                    isUploadButton={true}
                    style={{
                      transform: "scale(0.8)",
                      marginRight: "-0.5rem",
                    }}
                  />
                </div>
              }
            >
              <AdditionalColumn
                isModalOpen={isModalOpen}
                setConfig={setConfig}
                config={config}
              />
            </Form.Item>
          </Form>
        </Wrapper>
      </Modal>

      <ModalImportCampaign
        isModalOpen={isModalImportConfigOpen}
        setModalOpen={setModalImportConfigOpen}
      />
      <ModalExportCampaign
        isModalOpen={isModalExportConfigOpen}
        setModalOpen={setModalExportConfigOpen}
      />
    </Fragment>
  );
};

export default connect(
  (state: RootState) => ({
    selectedCampaign: state?.Campaign?.selectedCampaign,
  }),
  { actSaveSelectedCampaign },
)(ModalConfig);
