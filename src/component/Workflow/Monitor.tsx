import { Fragment, useEffect } from "react";
import { notification } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  actSetIsRun,
  actClearWhenStop,
  actCleanThread,
  actSetIsSleeping,
  actSetCurrentRound,
  actSyncWorkflowData,
} from "@/redux/workflowRunner";
import { MESSAGE } from "@/electron/constant";
import { ICampaign, IWorkflow } from "@/electron/type";
import {
  useTranslation,
  useGetCampaignProfileStatus,
  useSyncWorkflowData,
} from "@/hook";
import { IStatus, actSaveCampaignProfileStatus } from "@/redux/campaignProfile";

type IProps = {
  actSaveCampaignProfileStatus: (payload: IStatus) => void;
  actCleanThread: (payload: { threadID: string }) => void;
  actSetIsRun: (payload: boolean) => void;
  actSetIsSleeping: (payload: boolean) => void;
  actSetCurrentRound: (payload: number) => void;
  actSyncWorkflowData: (payload: any) => void;
  selectedCampaign: ICampaign | null;
  selectedWorkflow: IWorkflow | null;
  isRunning: boolean;
  status: IStatus | null;
  actClearWhenStop: () => void;
};

let getStatusInterval: any = null;
let totalProfile = 0;
let translateFunc: any = null;

const Monitor = (props: IProps) => {
  const { selectedCampaign, selectedWorkflow, isRunning, status } = props;
  const { translate } = useTranslation();
  const { getCampaignProfileStatus } = useGetCampaignProfileStatus();
  const { syncWorkflowData } = useSyncWorkflowData();

  useEffect(() => {
    if (selectedCampaign?.id && selectedWorkflow?.id) {
      syncWorkflowData(selectedWorkflow?.id, selectedCampaign?.id);
    }
  }, [selectedCampaign?.id, selectedWorkflow?.id]);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      const { isRunWithCampaign } = payload;
      props?.actSetIsRun(false);
      props?.actClearWhenStop();
      notification.success({
        message: translateFunc("notification"),
        description: isRunWithCampaign
          ? translateFunc("workflow.campaignCompleted")
          : translateFunc("workflow.workflowCompleted"),
      });
      props?.actSaveCampaignProfileStatus({
        totalProfile,
        totalUnFinishedProfile: 0,
      });
    };
    window?.electron?.on(MESSAGE.SCRIPT_RUN_COMPLETED, handler);

    return () => {
      window?.electron?.removeListener(MESSAGE.SCRIPT_RUN_COMPLETED, handler);
    };
  }, []);

  useEffect(() => {
    translateFunc = translate;
  }, [translate]);

  useEffect(() => {
    totalProfile = status?.totalProfile || 0;
  }, [status]);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      const { threadID } = payload;
      props?.actCleanThread({ threadID });
    };
    window?.electron?.on(MESSAGE.WORKFLOW_THREAD_STOPPED, handler);
    return () => {
      window?.electron?.removeListener(
        MESSAGE.WORKFLOW_THREAD_STOPPED,
        handler,
      );
    };
  }, []);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      const {
        mapThread,
        mapNodeError,
        mapMinMaxDuration,
        mapNodeSlots,
        isRunning,
        currentRound,
        isSleeping,
      } = payload;
      props?.actSyncWorkflowData({
        mapThread,
        mapError: mapNodeError,
        mapMinMaxDuration,
        mapNodeSlots,
        isRunning,
        currentRound,
        isSleeping,
      });
    };
    window?.electron?.on(MESSAGE.WORKFLOW_BATCH_UPDATE, handler);

    return () => {
      window?.electron?.removeListener(MESSAGE.WORKFLOW_BATCH_UPDATE, handler);
    };
  }, []);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      const { isSleeping } = payload;
      props?.actSetIsSleeping(isSleeping);
    };
    window?.electron?.on(MESSAGE.WORKFLOW_SLEEPING_STATUS, handler);

    return () => {
      window?.electron?.removeListener(
        MESSAGE.WORKFLOW_SLEEPING_STATUS,
        handler,
      );
    };
  }, []);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      const { round } = payload;
      props?.actSetCurrentRound(round);
    };
    window?.electron?.on(MESSAGE.WORKFLOW_HAS_NEW_ROUND, handler);

    return () => {
      window?.electron?.removeListener(MESSAGE.WORKFLOW_HAS_NEW_ROUND, handler);
    };
  }, []);

  useEffect(() => {
    if (selectedCampaign || selectedWorkflow) {
      getCampaignProfileStatus(
        selectedCampaign?.id || 0,
        selectedWorkflow?.id || 0,
      );
    }
  }, [selectedCampaign, selectedWorkflow]);

  useEffect(() => {
    const isRunWithoutCampaign = selectedWorkflow && !selectedCampaign;
    const intervalTime = isRunWithoutCampaign ? 2 * 1000 : 5 * 1000;
    if (isRunning && (selectedCampaign || selectedWorkflow)) {
      if (getStatusInterval !== null) {
        clearInterval(getStatusInterval);
      }
      getStatusInterval = setInterval(() => {
        getCampaignProfileStatus(
          selectedCampaign?.id || 0,
          selectedWorkflow?.id || 0,
        );
      }, intervalTime);
    } else {
      clearInterval(getStatusInterval);
    }

    return () => {
      clearInterval(getStatusInterval);
    };
  }, [isRunning, selectedCampaign, selectedWorkflow]);

  return <Fragment />;
};

export default connect(
  (state: RootState) => ({
    selectedCampaign: state?.Campaign?.selectedCampaign,
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
    isRunning: state?.WorkflowRunner?.isRunning,
    status: state?.CampaignProfile?.status,
  }),
  {
    actSaveCampaignProfileStatus,
    actSetIsRun,
    actClearWhenStop,
    actCleanThread,
    actSetIsSleeping,
    actSetCurrentRound,
    actSyncWorkflowData,
  },
)(Monitor);
