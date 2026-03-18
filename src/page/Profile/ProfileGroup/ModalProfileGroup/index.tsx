import { useState, useEffect } from "react";
import { Modal, Form, Steps, Row, Button } from "antd";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import {
  actSaveSelectedProfileGroup,
  actSaveCreateProfileGroup,
  actSaveUpdateProfileGroup,
} from "@/redux/profileGroup";
import {
  useUpdateProfileGroup,
  useCreateProfileGroup,
  useTranslation,
} from "@/hook";
import { IProfileGroup } from "@/electron/type";
import InfoForm from "./InfoForm";
import ConfigForm from "./ConfigForm";
import { ModalWrapper } from "./style";
import { VIEW_MODE } from "../../index";

type IModalProps = {
  isModalOpen: boolean;
  setModalOpen: (value: boolean) => void;
  selectedProfileGroup: IProfileGroup | null;
  actSaveSelectedProfileGroup: (value: IProfileGroup | null) => void;
  setCurrentStep: (value: number) => void;
  currentStep: number;
};

const ModalProfileGroup = (props: IModalProps) => {
  const { translate } = useTranslation();
  const {
    isModalOpen,
    setModalOpen,
    selectedProfileGroup,
    setCurrentStep,
    currentStep,
  } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [walletGroupId, setWalletGroupId] = useState<number | null>(null);
  const [listResourceGroupId, setListResourceGroupId] = useState<number[]>([]);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const {
    updateProfileGroup,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateProfileGroup();
  const {
    createProfileGroup,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
    createdData,
  } = useCreateProfileGroup();

  useEffect(() => {
    form.setFieldsValue({
      name: selectedProfileGroup?.name || "",
      note: selectedProfileGroup?.note || "",
    });

    setWalletGroupId(selectedProfileGroup?.walletGroupId || null);
    setListResourceGroupId(selectedProfileGroup?.listResourceGroupId || []);
  }, [isModalOpen, form, selectedProfileGroup]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedProfileGroup(null);
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

      if (createdData) {
        navigate(
          `/dashboard/profile?group=${createdData?.id}&mode=${VIEW_MODE.PROFILE}&openModal=true`,
        );
      }
    }
  }, [isCreateLoading, isCreateSuccess, createdData]);

  const onSubmitForm = async () => {
    try {
      const { name, note } = await form.validateFields(["name", "note"]);
      setBtnLoading(true);

      let profileGroup: IProfileGroup = {
        name,
        note,
        listResourceGroupId,
      };
      if (walletGroupId) {
        profileGroup = { ...profileGroup, walletGroupId };
      }

      if (selectedProfileGroup) {
        updateProfileGroup({ ...profileGroup, id: selectedProfileGroup?.id });
      } else {
        createProfileGroup(profileGroup);
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
        !selectedProfileGroup
          ? translate("profile.createProfileGroup")
          : translate("profile.editProfileGroup")
      }
      onCancel={onCloseModal}
      maskClosable={false}
      okText={
        !selectedProfileGroup
          ? translate("button.createNew")
          : translate("button.update")
      }
      cancelText={translate("cancel")}
      width="60rem"
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
              title: translate("info"),
            },
            {
              title: translate("config"),
            },
          ]}
          size="small"
          style={{ padding: "0 5rem" }}
        />

        {currentStep === 0 && (
          <InfoForm form={form} isModalOpen={isModalOpen} />
        )}
        {currentStep === 1 && (
          <ConfigForm
            setWalletGroupId={setWalletGroupId}
            walletGroupId={walletGroupId}
            listResourceGroupId={listResourceGroupId}
            setListResourceGroupId={setListResourceGroupId}
          />
        )}

        <Row justify="start">
          {currentStep === 1 && (
            <Button onClick={goBackStep} style={{ marginRight: "1rem" }}>
              {translate("back")}
            </Button>
          )}

          {currentStep === 0 && (
            <Button onClick={goNextStep}> {translate("next")}</Button>
          )}

          {(currentStep === 1 || selectedProfileGroup) && (
            <Button
              type="primary"
              onClick={onSubmitForm}
              style={{ marginLeft: "auto" }}
            >
              {selectedProfileGroup
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
    selectedProfileGroup: state?.ProfileGroup?.selectedProfileGroup,
  }),
  {
    actSaveSelectedProfileGroup,
    actSaveCreateProfileGroup,
    actSaveUpdateProfileGroup,
  },
)(ModalProfileGroup);
