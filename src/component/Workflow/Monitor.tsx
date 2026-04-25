import { Fragment, useEffect, useRef } from "react";
import { App } from "antd";
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

let totalProfile = 0;
let translateFunc: any = null;

const Monitor = (props: IProps) => {
  const { notification } = App.useApp();
  const { selectedCampaign, selectedWorkflow, isRunning, status } = props;
  const { translate } = useTranslation();
  const { getCampaignProfileStatus } = useGetCampaignProfileStatus();
  const { syncWorkflowData } = useSyncWorkflowData();
  const getStatusIntervalRef = useRef<any>(null);

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
        title: translateFunc("notification"),
        description: isRunWithCampaign
          ? translateFunc("workflow.campaignCompleted")
          : translateFunc("workflow.workflowCompleted"),
      });
      props?.actSaveCampaignProfileStatus({
        totalProfile,
        totalUnFinishedProfile: 0,
      });
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.SCRIPT_RUN_COMPLETED,
      handler,
    );
    return () => {
      unsubscribe?.();
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
    const unsubscribe = window?.electron?.on(
      MESSAGE.WORKFLOW_THREAD_STOPPED,
      handler,
    );
    return () => {
      unsubscribe?.();
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
    const unsubscribe = window?.electron?.on(
      MESSAGE.WORKFLOW_BATCH_UPDATE,
      handler,
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      const { isSleeping } = payload;
      props?.actSetIsSleeping(isSleeping);
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.WORKFLOW_SLEEPING_STATUS,
      handler,
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      const { round } = payload;
      props?.actSetCurrentRound(round);
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.WORKFLOW_HAS_NEW_ROUND,
      handler,
    );
    return () => {
      unsubscribe?.();
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
      clearInterval(getStatusIntervalRef.current);
      getStatusIntervalRef.current = setInterval(() => {
        getCampaignProfileStatus(
          selectedCampaign?.id || 0,
          selectedWorkflow?.id || 0,
        );
      }, intervalTime);
    } else {
      clearInterval(getStatusIntervalRef.current);
    }

    return () => {
      clearInterval(getStatusIntervalRef.current);
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
