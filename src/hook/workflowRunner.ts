import { useEffect, useState } from "react";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { uid } from "uid";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import {
  ICheckMarketcapNodeConfig,
  ICheckTokenPriceNodeConfig,
  IEVMSnipeContractNodeConfig,
  IWorkflowVariable,
} from "@/electron/type";
import {
  actClearWhenStop,
  actSetIsRun,
  actSetListRunningWorkflow,
  actSetMarketcapCheckingData,
  actSetPriceCheckingData,
  actSetSampleContractSniperResults,
  actSyncWorkflowData,
} from "@/redux/workflowRunner";
import { responseManager } from "@/service/responseManager";
import { actSetMapOpenProfileId } from "@/redux/campaignProfile";
import { useTranslation } from "./useTranslation";

const useStopThread = () => {
  useEffect(() => {
    const handler = (event: any, payload: any) => {
      const { requestId, isDone } = payload;
      if (isDone) {
        responseManager.saveResponse(
          responseManager.getKey(MESSAGE.TERMINATE_THREAD_RES, requestId),
          isDone,
        );
      }
    };
    window?.electron?.on(MESSAGE.TERMINATE_THREAD_RES, handler);

    return () => {
      window?.electron?.removeListener(MESSAGE.TERMINATE_THREAD_RES, handler);
    };
  }, []);

  const stopThread = async (
    workflowId: number,
    campaignId: number,
    threadID?: string,
  ) => {
    console.warn(
      `Stop campaign:${campaignId}, workflow: "${workflowId}, threadID: ${threadID}`,
    );
    const uniqRequestId = uid(10);
    window?.electron?.send(MESSAGE.TERMINATE_THREAD, {
      threadID,
      workflowId,
      campaignId,
      requestId: uniqRequestId,
    });

    await responseManager.getResponse(
      responseManager.getKey(MESSAGE.TERMINATE_THREAD_RES, uniqRequestId),
    );
  };

  return { stopThread };
};

const useGetSampleContractSniperResult = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      setLoading(false);
      setIsSuccess(true);
      dispatch(
        actSetSampleContractSniperResults({
          data: payload?.data || [],
          totalData: payload?.totalData,
        }),
      );
    };
    window?.electron?.on(
      MESSAGE.GET_SAMPLE_CONTRACT_SNIPER_RESULT_RES,
      handler,
    );

    return () => {
      window?.electron?.removeListener(
        MESSAGE.GET_SAMPLE_CONTRACT_SNIPER_RESULT_RES,
        handler,
      );
    };
  }, []);

  const getSampleContractSniperResult = ({
    config,
    sampleSize,
    campaignId,
    workflowId,
  }: {
    config: IEVMSnipeContractNodeConfig;
    sampleSize: number;
    campaignId: number;
    workflowId: number;
  }) => {
    setIsSuccess(false);
    setLoading(true);
    window?.electron?.send(MESSAGE.GET_SAMPLE_CONTRACT_SNIPER_RESULT, {
      config,
      sampleSize,
      campaignId,
      workflowId,
    });
  };

  return { loading, isSuccess, getSampleContractSniperResult };
};

const useGetPriceCheckingData = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      setLoading(false);
      setIsSuccess(true);
      dispatch(actSetPriceCheckingData({ data: payload?.data || [] }));
    };
    window?.electron?.on(MESSAGE.GET_PRICE_CHECKING_DATA_RES, handler);

    return () => {
      window?.electron?.removeListener(
        MESSAGE.GET_PRICE_CHECKING_DATA_RES,
        handler,
      );
    };
  }, []);

  const getPriceCheckingData = ({
    config,
  }: {
    config: ICheckTokenPriceNodeConfig;
  }) => {
    setIsSuccess(false);
    setLoading(true);
    window?.electron?.send(MESSAGE.GET_PRICE_CHECKING_DATA, {
      config,
    });
  };

  return { loading, isSuccess, getPriceCheckingData };
};

const useGetMarketcapCheckingData = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      setLoading(false);
      setIsSuccess(true);
      dispatch(actSetMarketcapCheckingData({ data: payload?.data || [] }));
    };
    window?.electron?.on(MESSAGE.GET_MARKETCAP_CHECKING_DATA_RES, handler);

    return () => {
      window?.electron?.removeListener(
        MESSAGE.GET_MARKETCAP_CHECKING_DATA_RES,
        handler,
      );
    };
  }, []);

  const getMarketcapCheckingData = ({
    config,
  }: {
    config: ICheckMarketcapNodeConfig;
  }) => {
    setIsSuccess(false);
    setLoading(true);
    window?.electron?.send(MESSAGE.GET_MARKETCAP_CHECKING_DATA, {
      config,
    });
  };

  return { loading, isSuccess, getMarketcapCheckingData };
};

const useStartWorkflow = () => {
  const { translate } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      const { code } = payload;
      if (code === RESPONSE_CODE.OBJECT_EXISTED) {
        message.error(translate("workflow.anotherWorkflowUsingBrowser"));
        dispatch(actSetIsRun(false));
      } else if (code === RESPONSE_CODE.DUPLICATE_ERROR) {
        message.warning(translate("workflow.workflowIsRunning"));
        dispatch(actSetIsRun(true));
      } else {
        dispatch(actSetIsRun(true));
      }
      setLoading(false);
    };
    window?.electron?.on(MESSAGE.START_WORKFLOW_RES, handler);

    return () => {
      window?.electron?.removeListener(MESSAGE.START_WORKFLOW_RES, handler);
    };
  }, []);

  const startWorkflow = (
    workflowId: number,
    campaignId: number,
    encryptKey: string,
    overrideListVariable?: IWorkflowVariable[],
  ) => {
    setLoading(true);
    window?.electron?.send(MESSAGE.START_WORKFLOW, {
      workflowId,
      campaignId,
      encryptKey,
      overrideListVariable,
    });
  };

  return { startWorkflow, loading };
};

const useStopWorkflow = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const handler = (_event: any, _payload: any) => {
      setLoading(false);
      dispatch(actSetIsRun(false));
      dispatch(actClearWhenStop());
    };
    window?.electron?.on(MESSAGE.STOP_WORKFLOW_RES, handler);

    return () => {
      window?.electron?.removeListener(MESSAGE.STOP_WORKFLOW_RES, handler);
    };
  }, []);

  const stopWorkflow = (workflowId: number, campaignId: number) => {
    setLoading(true);
    window?.electron?.send(MESSAGE.STOP_WORKFLOW, { workflowId, campaignId });
  };

  return { loading, stopWorkflow };
};

const useSyncWorkflowData = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      const { data } = payload;
      const {
        mapThread,
        mapNodeError,
        isRunning,
        mapMinMaxDuration,
        currentRound,
        isSleeping,
        mapOpenProfileId,
      } = data;

      dispatch(
        actSyncWorkflowData({
          mapError: mapNodeError,
          isRunning: isRunning,
          mapThread,
          isSleeping,
          currentRound,
          mapMinMaxDuration,
        } as any),
      );
      dispatch(actSetMapOpenProfileId(mapOpenProfileId));

      setLoading(false);
      setIsSuccess(true);
    };
    window?.electron?.on(MESSAGE.WORKFLOW_SYNC_DATA_TO_UI_RES, handler);

    return () => {
      window?.electron?.removeListener(
        MESSAGE.WORKFLOW_SYNC_DATA_TO_UI_RES,
        handler,
      );
    };
  }, []);

  const syncWorkflowData = (workflowId: number, campaignId: number) => {
    setLoading(true);
    setIsSuccess(false);
    window?.electron?.send(MESSAGE.WORKFLOW_SYNC_DATA_TO_UI, {
      workflowId,
      campaignId,
    });
  };

  return { loading, isSuccess, syncWorkflowData };
};

const useGetListRunningWorkflow = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      const { data } = payload;
      dispatch(actSetListRunningWorkflow(data));
      setLoading(false);
      setIsSuccess(true);
    };
    window?.electron?.on(MESSAGE.GET_LIST_RUNNING_WORKFLOW_RES, handler);

    return () => {
      window?.electron?.removeListener(
        MESSAGE.GET_LIST_RUNNING_WORKFLOW_RES,
        handler,
      );
    };
  }, []);

  const getListRunningWorkflow = () => {
    setLoading(true);
    setIsSuccess(false);
    window?.electron?.send(MESSAGE.GET_LIST_RUNNING_WORKFLOW, {});
  };

  return { loading, isSuccess, getListRunningWorkflow };
};

const useStopAllWorkflow = () => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const handler = (_event: any, _payload: any) => {
      setLoading(false);
      setIsSuccess(true);
    };
    window?.electron?.on(MESSAGE.STOP_ALL_WORKFLOW_RES, handler);

    return () => {
      window?.electron?.removeListener(MESSAGE.STOP_ALL_WORKFLOW_RES, handler);
    };
  }, []);

  const stopAllWorkflow = () => {
    setLoading(true);
    setIsSuccess(false);
    window?.electron?.send(MESSAGE.STOP_ALL_WORKFLOW, {});
  };

  return { loading, isSuccess, stopAllWorkflow };
};

const useRunJavaScriptCode = () => {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (event: any, payload: any) => {
      const { data } = payload;
      setResult(data);
      setLoading(false);
    };
    window?.electron?.on(MESSAGE.RUN_JAVASCRIPT_CODE_RES, handler);

    return () => {
      window?.electron?.removeListener(
        MESSAGE.RUN_JAVASCRIPT_CODE_RES,
        handler,
      );
    };
  }, []);

  const runJavaScriptCode = (
    code: string,
    listVariable: IWorkflowVariable[],
  ) => {
    setLoading(true);
    window?.electron?.send(MESSAGE.RUN_JAVASCRIPT_CODE, {
      code,
      listVariable,
    });
  };

  return { runJavaScriptCode, loading, result };
};

export {
  useStopThread,
  useGetSampleContractSniperResult,
  useStartWorkflow,
  useStopWorkflow,
  useSyncWorkflowData,
  useGetListRunningWorkflow,
  useStopAllWorkflow,
  useRunJavaScriptCode,
  useGetPriceCheckingData,
  useGetMarketcapCheckingData,
};
