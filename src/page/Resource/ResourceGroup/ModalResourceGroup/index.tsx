import { useState, useEffect } from "react";
import { Modal, Form, Steps, Row, Button } from "antd";
import { connect } from "react-redux";
import _ from "lodash";
import { RootState } from "@/redux/store";
import {
  actSaveSelectedResourceGroup,
  actSaveCreateResourceGroup,
  actSaveUpdateResourceGroup,
} from "@/redux/resourceGroup";
import {
  useUpdateResourceGroup,
  useCreateResourceGroup,
  useTranslation,
} from "@/hook";
import { ModalWrapper } from "./style";
import InfoForm from "./InfoForm";
import ConfigForm from "./ConfigForm";
import { IColumnConfig } from "./ConfigForm";

const ModalResourceGroup = (props: any) => {
  const { translate } = useTranslation();
  const {
    isModalOpen,
    setModalOpen,
    selectedResourceGroup,
    setCurrentStep,
    currentStep,
  } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [config, setConfig] = useState<IColumnConfig>({});
  const [form] = Form.useForm();

  const {
    updateResourceGroup,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateResourceGroup();
  const {
    createResourceGroup,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateResourceGroup();

  useEffect(() => {
    form.setFieldsValue({
      name: selectedResourceGroup?.name || "",
      note: selectedResourceGroup?.note || "",
    });

    setConfig(_.omit(selectedResourceGroup, ["id", "name", "note"]));
  }, [isModalOpen, selectedResourceGroup]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);
    setTimeout(() => {
      props?.actSaveSelectedResourceGroup(null);
      setCurrentStep(0);
    }, 300);
  };

  useEffect(() => {
    if (!isUpdateLoading && isUpdateSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [isUpdateLoading, isUpdateSuccess]);

  useEffect(() => {
    if (!isCreateLoading && isCreateSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [isCreateLoading, isCreateSuccess]);

  const onSubmitForm = async () => {
    try {
      const { name, note } = await form.validateFields(["name", "note"]);
      setBtnLoading(true);

      if (selectedResourceGroup) {
        updateResourceGroup({
          name,
          note,
          id: selectedResourceGroup?.id,
          ...config,
        });
      } else {
        createResourceGroup({ name, note, ...config });
      }
    } catch {}
  };

  const goBackStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const goNextStep = async () => {
    try {
      await form.validateFields(["name", "note"]);
      setCurrentStep(currentStep + 1);
    } catch {}
  };

  const onChangeStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        !selectedResourceGroup
          ? translate("resource.createGroup")
          : translate("resource.editGroup")
      }
      onCancel={onCloseModal}
      mask={{ closable: false }}
      width="70rem"
      onOk={onSubmitForm}
      confirmLoading={isBtnLoading}
      footer={null}
    >
      <ModalWrapper>
        <Steps
          onChange={onChangeStep}
          current={currentStep}
          labelPlacement="vertical"
          items={[
            {
              title: translate("resource.groupInfo"),
            },
            {
              title: translate("resource.columnConfig"),
            },
          ]}
          size="small"
          style={{ padding: "0 5rem" }}
        />

        {currentStep === 0 && <InfoForm form={form} />}

        {currentStep === 1 && (
          <ConfigForm
            setConfig={setConfig}
            config={config}
            isModalOpen={isModalOpen}
          />
        )}

        <Row justify="start">
          {currentStep === 0 && (
            <Button onClick={goNextStep}>{translate("next")}</Button>
          )}

          {currentStep === 1 && (
            <Button onClick={goBackStep}>{translate("back")}</Button>
          )}

          {(currentStep === 1 || selectedResourceGroup) && (
            <Button
              type="primary"
              onClick={onSubmitForm}
              style={{ marginLeft: "auto" }}
            >
              {selectedResourceGroup
                ? translate("button.update")
                : translate("button.createNew")}
            </Button>
          )}
        </Row>
      </ModalWrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedResourceGroup: state?.ResourceGroup?.selectedResourceGroup,
  }),
  {
    actSaveSelectedResourceGroup,
    actSaveCreateResourceGroup,
    actSaveUpdateResourceGroup,
  },
)(ModalResourceGroup);
