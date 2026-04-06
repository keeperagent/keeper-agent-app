import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { actSetIsRun } from "@/redux/workflowRunner";
import { sleep } from "@/service/util";
import { useStartWorkflow, useStopWorkflow } from "./workflowRunner";
import { useUpdateListCampaignProfile } from "./campaignProfile";

const useHandleWorkflowUsingTelegram = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { startWorkflow } = useStartWorkflow();
  const { stopWorkflow } = useStopWorkflow();
  const { updateListCampaignProfile, loading, isSuccess } =
    useUpdateListCampaignProfile();
  const isCompletedResetProfile = useRef(false);

  useEffect(() => {
    if (!loading && isSuccess) {
      isCompletedResetProfile.current = true;
    }
  }, [loading, isSuccess]);

  const onRunWorkflowUsingTelegram = async (args: any) => {
    const { workflow, campaignId, encryptKey, overrideListVariable } = args;
    const workflowId = workflow?.id;
    if (!workflowId) {
      return;
    }

    navigate("/dashboard/campaign?mode=VIEW_CAMPAIGN");
    await sleep(200);
    navigate(
      `/dashboard/campaign?campaignId=${campaignId}&workflowId=${workflowId}&mode=VIEW_WORKFLOW`,
    );

    await sleep(200);
    stopWorkflow(workflowId, campaignId);
    await sleep(200);

    isCompletedResetProfile.current = false;
    updateListCampaignProfile({
      listID: [],
      resetAll: true,
      profile: { isRunning: false, round: 0 },
      campaignId,
    });

    await sleep(200);
    while (!isCompletedResetProfile.current) {
      await sleep(500);
      console.log("wait for reset campaign profile");
    }
    startWorkflow(workflowId, campaignId, encryptKey, overrideListVariable);
  };

  const onStopRunWorkflowUsingTelegram = () => {
    dispatch(actSetIsRun(false));
  };

  return {
    onRunWorkflowUsingTelegram,
    onStopRunWorkflowUsingTelegram,
  };
};

export { useHandleWorkflowUsingTelegram };
