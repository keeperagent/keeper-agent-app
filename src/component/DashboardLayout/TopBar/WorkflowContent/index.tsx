import { useMemo, useEffect, useState } from "react";
import { connect } from "react-redux";
import { Tooltip, Form, Dropdown, notification } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import {
  UndoIcon,
  RedoIcon,
  QuestionIcon,
  RefreshIcon,
} from "@/component/Icon";
import { PlayButton, BookMarkButton } from "@/component/Button";
import { ICampaign, IWorkflow } from "@/electron/type";
import { IWorkflowData, IUser } from "@/types/interface";
import { PasswordInput } from "@/component/Input";
import {
  useUpdateWorkflow,
  useTranslation,
  useStartWorkflow,
  useStopWorkflow,
  useGetCacheSecretKey,
  useSetCacheSecretKey,
} from "@/hook";
import {
  actUndo,
  actRedo,
  IWorkflowRunnerState,
  actSetShowModalSetting,
  actSetIsSaved,
  actClearWhenStop,
  actSetCurrentRound,
} from "@/redux/workflowRunner";
import { actSaveSelectedWorkflow } from "@/redux/workflow";
import { actSetEncryptKey } from "@/redux/campaign";
import ModalResetCampaignProfile from "@/component/ModalResetCampaignProfile";
import {
  actSetModalCampaignOpen,
  actSetCurrentModalStep,
} from "@/redux/campaign";
import { trimText } from "@/service/util";
import { EMPTY_STRING, CAMPAIGN_VIEW_MODE } from "@/config/constant";
import { actSaveCampaignProfileStatus, IStatus } from "@/redux/campaignProfile";
import dayjs from "dayjs";
import { Wrapper, OptionWrapper } from "./style";

export const renderListWorkflowTooltip = (
  campaign: ICampaign | null,
  selectedWorkflow: IWorkflow | null,
  onViewWorkflow: (campaign: ICampaign | null, workflowId: number) => void,
  translate: any,
) => {
  const { listWorkflow = [] } = campaign || {};
  if (!campaign && selectedWorkflow) {
    listWorkflow.push(selectedWorkflow);
  }

  if (listWorkflow?.length === 1) {
    return (
      <div className="info">
        <div className="label">{`${translate("workflow.workflow")}:`}</div>
        <div className="value">
          {trimText(listWorkflow[0]?.name || EMPTY_STRING, 30)}
        </div>
      </div>
    );
  }

  const items = listWorkflow
    ?.filter((workflow: IWorkflow) => workflow?.id !== selectedWorkflow?.id)
    .map((workflow: IWorkflow, index: number) => ({
      key: workflow?.id!,
      label: (
        <OptionWrapper onClick={() => onViewWorkflow(campaign, workflow?.id!)}>
          <div className="name">
            {index + 1}. {workflow?.name}
          </div>
          <div className="description">{workflow?.note || EMPTY_STRING}</div>
        </OptionWrapper>
      ),
    }));

  return (
    <Dropdown menu={{ items }} placement="bottomLeft">
      <div className="info">
        <div className="label">{`${translate("workflow.workflow")}:`}</div>
        <div className="value">
          {trimText(selectedWorkflow?.name || EMPTY_STRING, 30)}
        </div>
      </div>
    </Dropdown>
  );
};

type IProps = {
  selectedCampaign: ICampaign | null;
  selectedWorkflow: IWorkflow | null;
  workflowState: IWorkflowRunnerState;
  actClearWhenStop: () => void;
  actSetShowModalSetting: (payload: boolean) => void;
  actSetModalCampaignOpen: (payload: boolean) => void;
  actSetCurrentModalStep: (payload: number) => void;
  actSetEncryptKey: (payload: string) => void;
  actSetIsSaved: (payload: boolean) => void;
  actUndo: () => void;
  actRedo: () => void;
  actSaveSelectedWorkflow: (payload: IWorkflow | null) => void;
  actSaveCampaignProfileStatus: (payload: IStatus) => void;
  actSetCurrentRound: (payload: number) => void;
  encryptKey: string;
  user: IUser | null;
};

const WorkflowContent = (props: IProps) => {
  const { translate } = useTranslation();
  const {
    selectedCampaign,
    selectedWorkflow,
    workflowState,
    encryptKey,
    user,
  } = props;
  const { isRunning, flowData = null } = workflowState;
  const {
    redoable = false,
    undoable = false,
    past = [],
    future = [],
  } = flowData || {};
  const { edges = [], nodes = [] } = flowData?.present || {};
  const { pathname } = useLocation();
  const { updateWorkflow } = useUpdateWorkflow();
  const { startWorkflow, loading: isStartWorkflowLoading } = useStartWorkflow();
  const { stopWorkflow, loading: isStopWorkflowLoading } = useStopWorkflow();
  const [isModalResetOpen, setModalResetOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const {
    getCacheSecretKey,
    secretKey,
    loading: isGetCacheSecretKeyLoading,
  } = useGetCacheSecretKey();
  const { setCacheSecretKey } = useSetCacheSecretKey();

  useEffect(() => {
    form?.setFieldsValue({
      encryptKey,
    });
  }, [form, encryptKey]);

  useEffect(() => {
    if (isGetCacheSecretKeyLoading) {
      return;
    }

    if (secretKey) {
      props?.actSetEncryptKey(secretKey);
    }
  }, [isGetCacheSecretKeyLoading, secretKey]);

  const isCampaignView = useMemo(() => {
    return pathname === "/dashboard/campaign";
  }, [pathname]);

  useEffect(() => {
    if (selectedCampaign?.id && isCampaignView) {
      getCacheSecretKey(selectedCampaign?.id);
    }
  }, [selectedCampaign?.id, selectedWorkflow?.id, isCampaignView]);

  const onSaveFlow = async () => {
    const workflowData: IWorkflowData = {
      nodes,
      edges,
    };

    const updatedData = {
      ...selectedWorkflow,
      data: JSON.stringify(workflowData),
    };
    await updateWorkflow(updatedData);
    props?.actSetIsSaved(true);
    props?.actSaveSelectedWorkflow(updatedData);
    props?.actClearWhenStop();
  };

  const onUndo = () => {
    if (undoable) {
      props?.actUndo();
    }
  };

  const onRedo = () => {
    if (redoable) {
      props?.actRedo();
    }
  };

  const openModalSetting = () => {
    if (isCampaignView) {
      props?.actSetModalCampaignOpen(true);
      props?.actSetCurrentModalStep(1);
    } else {
      props?.actSetShowModalSetting(true);
    }
  };

  const onViewProfile = () => {
    navigate(
      `${pathname}?campaignId=${selectedCampaign?.id}&mode=${CAMPAIGN_VIEW_MODE.VIEW_PROFILE}`,
    );
  };

  const onViewWorkflow = (campaign: ICampaign | null, workflowId: number) => {
    if (campaign) {
      navigate(
        `${pathname}?campaignId=${campaign?.id}&workflowId=${workflowId}&mode=${CAMPAIGN_VIEW_MODE.VIEW_WORKFLOW}`,
      );
    } else {
      navigate(
        `${pathname}?workflowId=${workflowId}&mode=${CAMPAIGN_VIEW_MODE.VIEW_WORKFLOW}`,
      );
    }
  };

  const onOpenModalResetCampaignProfile = () => {
    setModalResetOpen(true);
  };

  const onStartWorkflow = async () => {
    let isFreeTier =
      !user?.tierStatus ||
      !user?.tierStatus?.pricingTier ||
      user?.tierStatus?.pricingTier?.price === 0;
    const expiredAt = user?.tierStatus?.expiredAt || 0;
    const isExpired =
      expiredAt > 0 && dayjs().isAfter(dayjs(Number(expiredAt)));
    if (isExpired) {
      isFreeTier = false;
    }
    if (isFreeTier) {
      notification.warning({
        message: "Can not run workflow with free tier",
        duration: 15,
      });
      return;
    }

    startWorkflow(selectedWorkflow?.id!, selectedCampaign?.id!, encryptKey);

    // reset progress bar when run without campaign
    if (!selectedCampaign) {
      props?.actSetCurrentRound(0);
      props?.actSaveCampaignProfileStatus({
        totalProfile: 0,
        totalUnFinishedProfile: 0,
      });
    }
  };

  const onStopWorkflow = async () => {
    stopWorkflow(selectedWorkflow?.id!, selectedCampaign?.id!);
  };

  const onChangeEncryptKey = (value: string) => {
    props?.actSetEncryptKey(value);
    setCacheSecretKey(selectedCampaign?.id || 0, value);
  };

  return (
    <Wrapper>
      <PlayButton
        onStop={onStopWorkflow}
        onStart={onStartWorkflow}
        isRunning={isRunning}
        loading={isStopWorkflowLoading || isStartWorkflowLoading}
      />

      <BookMarkButton
        style={{ height: "2.9rem" }}
        onClick={onSaveFlow}
        text="Save"
      />

      <div className="tool">
        {isCampaignView && (
          <div className="info">
            <div className="label">{`${translate("sidebar.campaign")}:`}</div>
            <div className="value">
              {trimText(selectedCampaign?.name || EMPTY_STRING, 30)}
            </div>
          </div>
        )}

        {renderListWorkflowTooltip(
          selectedCampaign,
          selectedWorkflow,
          onViewWorkflow,
          translate,
        )}

        {isCampaignView && (
          <div
            className="info"
            onClick={onViewProfile}
            style={{ cursor: "pointer" }}
          >
            <div className="label">{`${translate("profile.profile")}:`}</div>
            <div className="value">
              {trimText(
                selectedCampaign?.profileGroup?.name || EMPTY_STRING,
                30,
              )}
            </div>
          </div>
        )}

        {isCampaignView && (
          <div
            className="refresh-icon"
            onClick={onOpenModalResetCampaignProfile}
          >
            <RefreshIcon />
          </div>
        )}

        <div
          className="info"
          onClick={openModalSetting}
          style={{ cursor: "pointer" }}
        >
          <div className="label">{`${translate(
            "profile.numberOfThread",
          )}:`}</div>
          <div className="value">
            {isCampaignView
              ? selectedCampaign?.numberOfThread
              : selectedWorkflow?.numberOfThread || 1}
          </div>
        </div>

        <div
          className="info"
          onClick={openModalSetting}
          style={{ cursor: "pointer" }}
        >
          <div className="label">{translate("workflow.loop")}:</div>
          <div className="value">
            {isCampaignView
              ? selectedCampaign?.numberOfRound
              : selectedWorkflow?.numberOfRound || 1}{" "}
            {translate("times")}
          </div>
        </div>

        <div className="undo-redo">
          <div className={undoable ? "item" : "item disable"} onClick={onUndo}>
            <div className="icon">
              <UndoIcon />
            </div>
            <div className="text">
              {translate("undo")} <div className="count">{past?.length}</div>
            </div>
          </div>
          <div className={redoable ? "item" : "item disable"} onClick={onRedo}>
            <div className="icon">
              <RedoIcon />
            </div>
            <div className="text">
              {translate("redo")} <div className="count">{future?.length}</div>
            </div>
          </div>
        </div>

        <div
          className="hint"
          style={{
            backgroundColor: workflowState?.selectedNodeID
              ? "var(--color-brown)"
              : "var(--background-brown)",
          }}
        />
        <div
          className="hint"
          style={{
            backgroundColor: workflowState?.selectedEdgeID
              ? "var(--color-pink)"
              : "var(--background-pink)",
          }}
        />

        {isCampaignView && (
          <Form form={form}>
            <div className="encryptKey">
              <PasswordInput
                placeholder={translate("wallet.secretKey")}
                width="15rem"
                onChange={onChangeEncryptKey}
                extendClass="encryptKey-campaign"
                name="encryptKey"
              />

              <Tooltip title={translate("workflow.encryptProfile")}>
                <div className="icon">
                  <QuestionIcon />
                </div>
              </Tooltip>
            </div>
          </Form>
        )}
      </div>

      <ModalResetCampaignProfile
        isModalOpen={isModalResetOpen}
        setModalOpen={setModalResetOpen}
        isResetAll={true}
      />
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    workflowState: state?.WorkflowRunner,
    selectedCampaign: state?.Campaign?.selectedCampaign,
    encryptKey: state?.Campaign?.encryptKey,
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
    user: state?.Auth?.user,
  }),
  {
    actUndo,
    actRedo,
    actSetShowModalSetting,
    actSetModalCampaignOpen,
    actSetCurrentModalStep,
    actSetEncryptKey,
    actSetIsSaved,
    actSaveSelectedWorkflow,
    actClearWhenStop,
    actSaveCampaignProfileStatus,
    actSetCurrentRound,
  },
)(WorkflowContent);
