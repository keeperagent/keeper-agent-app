import { useState, useEffect } from "react";
import { Modal, Form, Steps, Button, Row } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  actSaveSelectedCampaign,
  actSetModalCampaignOpen,
  actSetCurrentModalStep,
} from "@/redux/campaign";
import {
  useCreateCampaign,
  useUpdateCampaign,
  useTranslation,
  useGetCampaignProfileStatus,
} from "@/hook";
import { PROFILE_TYPE, SORT_ORDER } from "@/electron/constant";
import { ICampaign, IWorkflow } from "@/electron/type";
import ConfigForm from "./ConfigForm";
import InfoForm from "./InfoForm";
import LayoutForm from "./LayoutForm";
import { ModalWrapper } from "./style";

const defaultScreenSize = {
  width: 500,
  height: 800,
};

type IProps = {
  isModalOpen: boolean;
  selectedCampaign: ICampaign | null;
  selectedWorkflow: IWorkflow | null;
  currentModalStep: number;
  isFromWorkflowView: boolean;
  actSetModalCampaignOpen: (payload: boolean) => void;
  actSaveSelectedCampaign: (payload: ICampaign | null) => void;
  actSetCurrentModalStep: (payload: number) => void;
};

const ModalCampaign = (props: IProps) => {
  const { translate } = useTranslation();
  const {
    isModalOpen,
    selectedCampaign,
    currentModalStep,
    isFromWorkflowView,
    selectedWorkflow,
  } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [isUseProxy, setIsUseProxy] = useState(false);
  const [isUseRandomUserAgent, setIsUseRandomUserAgent] = useState(false);
  const [profileType, setProfileType] = useState(PROFILE_TYPE.ALL_PROFILE);
  const [isFullScreen, setFullScreen] = useState(true);

  const [form] = Form.useForm();
  const {
    updateCampaign,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
    updatedData,
  } = useUpdateCampaign();
  const {
    createCampaign,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateCampaign();
  const { getCampaignProfileStatus } = useGetCampaignProfileStatus();

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    form.setFieldsValue({
      name: selectedCampaign?.name || null,
      listWorkflowId: selectedCampaign?.listWorkflowId || [],
      profileGroupId: selectedCampaign?.profileGroupId || null,
      numberOfThread: selectedCampaign?.numberOfThread || 1,
      numberOfRound: selectedCampaign?.numberOfRound || 1,
      sleepBetweenRound: selectedCampaign?.sleepBetweenRound || 0,
      isSaveProfile:
        selectedCampaign?.isSaveProfile === undefined
          ? true
          : selectedCampaign?.isSaveProfile,
      isUseProxy: selectedCampaign?.isUseProxy,
      proxyGroupId: selectedCampaign?.proxyGroupId,
      userAgentCategory: selectedCampaign?.userAgentCategory,
      isUseRandomUserAgent: selectedCampaign?.isUseRandomUserAgent,
      windowWidth: selectedCampaign?.windowWidth || defaultScreenSize?.width,
      windowHeight: selectedCampaign?.windowHeight || defaultScreenSize?.height,
      listCampaignProfileId: selectedCampaign?.listCampaignProfileId || [],
      note: selectedCampaign?.note || "",
    });

    setIsUseProxy(Boolean(selectedCampaign?.isUseProxy));
    setFullScreen(
      selectedCampaign?.isFullScreen === undefined
        ? true
        : Boolean(selectedCampaign?.isFullScreen),
    );
    setProfileType(selectedCampaign?.profileType || PROFILE_TYPE.ALL_PROFILE);
    setIsUseRandomUserAgent(Boolean(selectedCampaign?.isUseRandomUserAgent));
  }, [isModalOpen, form, selectedCampaign]);

  useEffect(() => {
    props?.actSetCurrentModalStep(0);
  }, []);

  const onCloseModal = () => {
    props?.actSetModalCampaignOpen(false);
    setBtnLoading(false);

    if (!isFromWorkflowView) {
      setTimeout(() => {
        props?.actSaveSelectedCampaign(null);
      }, 300);

      setTimeout(() => {
        props?.actSetCurrentModalStep(0);
      }, 200);
    }
  };

  useEffect(() => {
    if (!isUpdateLoading && isUpdateSuccess) {
      setBtnLoading(false);
      onCloseModal();

      if (isFromWorkflowView && updatedData) {
        props?.actSaveSelectedCampaign(updatedData);
        getCampaignProfileStatus(
          updatedData?.id || 0,
          selectedWorkflow?.id || 0,
        );
      }
    }
  }, [
    isUpdateLoading,
    isUpdateSuccess,
    isFromWorkflowView,
    updatedData,
    selectedWorkflow,
  ]);

  useEffect(() => {
    if (!isCreateLoading && isCreateSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [isCreateLoading, isCreateSuccess]);

  const onSubmitForm = async () => {
    try {
      const {
        name,
        listWorkflowId,
        profileGroupId,
        note,
        isSaveProfile,
        numberOfThread,
        numberOfRound,
        sleepBetweenRound,
        isUseProxy,
        proxyGroupId,
        userAgentCategory,
        windowWidth,
        windowHeight,
        listCampaignProfileId,
      } = await form.validateFields([
        "name",
        "listWorkflowId",
        "profileGroupId",
        "note",
        "numberOfThread",
        "numberOfRound",
        "sleepBetweenRound",
        "isSaveProfile",
        "isUseProxy",
        "proxyGroupId",
        "userAgentCategory",
        "windowWidth",
        "windowHeight",
        "listCampaignProfileId",
      ]);
      setBtnLoading(true);

      const data: ICampaign = {
        name,
        listWorkflowId,
        profileGroupId,
        note,
        numberOfThread,
        numberOfRound,
        sleepBetweenRound,
        isSaveProfile,
        isUseProxy,
        proxyGroupId,
        isUseRandomUserAgent,
        userAgentCategory,
        windowWidth,
        windowHeight,
        isFullScreen,
        profileType,
        listCampaignProfileId,
        sortField: "round",
        sortOrder: SORT_ORDER.ASC,
      };

      if (selectedCampaign) {
        updateCampaign({
          ...data,
          id: selectedCampaign?.id,
        });
      } else {
        const DEFAULT_RELOAD_DURATION = 3;
        createCampaign({
          ...data,
          reloadDuration: DEFAULT_RELOAD_DURATION,
          defaultOpenUrl: "https://iphey.com",
        });
      }
    } catch {}
  };

  const goBackStep = () => {
    props?.actSetCurrentModalStep(currentModalStep - 1);
  };

  const goNextStep = async () => {
    try {
      await form.validateFields(["name", "note"]);
      props?.actSetCurrentModalStep(currentModalStep + 1);
    } catch {}
  };

  const onChangeStep = (step: number) => {
    props?.actSetCurrentModalStep(step);
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        !selectedCampaign
          ? translate("campaign.createCampaign")
          : translate("campaign.updateCampaign")
      }
      onCancel={onCloseModal}
      mask={{ closable: false }}
      width="50rem"
      style={{ top: "6rem" }}
      confirmLoading={isBtnLoading}
      footer={null}
    >
      <ModalWrapper>
        <Steps
          onChange={onChangeStep}
          current={currentModalStep}
          labelPlacement="vertical"
          items={[
            {
              title: translate("campaign.detail"),
            },
            {
              title: translate("campaign.config"),
            },
            {
              title: "Layout",
            },
          ]}
          size="small"
        />

        <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
          {currentModalStep === 0 && (
            <InfoForm
              isModalOpen={isModalOpen}
              setProfileType={setProfileType}
              profileType={profileType}
            />
          )}
          {currentModalStep === 1 && (
            <ConfigForm
              isModalOpen={isModalOpen}
              isUseProxy={isUseProxy}
              setIsUseProxy={setIsUseProxy}
              setIsUseRandomUserAgent={setIsUseRandomUserAgent}
              isUseRandomUserAgent={isUseRandomUserAgent}
            />
          )}
          {currentModalStep === 2 && (
            <LayoutForm
              setFullScreen={setFullScreen}
              isFullScreen={isFullScreen}
            />
          )}
        </Form>

        <Row justify="start">
          {((currentModalStep === 1 && !isFromWorkflowView) ||
            currentModalStep === 2) && (
            <Button onClick={goBackStep} style={{ marginRight: "1rem" }}>
              {translate("back")}
            </Button>
          )}

          {(currentModalStep === 0 ||
            currentModalStep === 1 ||
            currentModalStep === 2) && (
            <Button onClick={goNextStep}>{translate("next")}</Button>
          )}

          {(currentModalStep === 1 ||
            currentModalStep === 2 ||
            selectedCampaign) && (
            <Button
              type="primary"
              onClick={onSubmitForm}
              style={{ marginLeft: "auto" }}
              loading={isCreateLoading || isUpdateLoading}
            >
              {selectedCampaign
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
    selectedCampaign: state?.Campaign?.selectedCampaign,
    listProfileGroup: state?.ProfileGroup?.listProfileGroup,
    listWorkflow: state?.Workflow?.listWorkflow,
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
    currentModalStep: state?.Campaign?.currentModalStep,
    isModalOpen: state?.Campaign?.isModalOpen,
  }),
  {
    actSaveSelectedCampaign,
    actSetModalCampaignOpen,
    actSetCurrentModalStep,
  },
)(ModalCampaign);
