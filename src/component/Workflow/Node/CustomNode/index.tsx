import { memo, useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { Tooltip } from "antd";
import { Handle, Position, useStore, useNodeId } from "@xyflow/react";
import { RootState } from "@/redux/store";
import { SCRIPT_NAME_EN } from "@/config/constant";
import { WORKFLOW_TYPE, NODE_STATUS, EXTENSION } from "@/electron/constant";
import {
  RedoIcon,
  EmergencyIcon,
  WarningIcon,
  PlayIcon,
  StopIcon,
} from "@/component/Icon";
import {
  actSaveSelectedNode,
  actSetModalOpen,
  actSetSelectedWorkflowType,
  actSaveSelectedEdge,
} from "@/redux/workflowRunner";
import { formatTime, trimText } from "@/service/util";
import { INodeData } from "@/types/interface";
import { ILoopNodeConfig, ISkipSetting } from "@/electron/type";
import { useTranslation } from "@/hook";
import {
  NODE_ACTION,
  MESSAGE_CONDITION_RETURN_FALSE,
  MESSAGE_TURN_OFF_PROFILE,
} from "@/electron/simulator/constant";
import { mapNodeIcon } from "../../Panel/config";
import { CustomNodeWrapper, TooltipWrapper } from "./style";

const WORKFLOW_TYPE_METAMASK = [
  WORKFLOW_TYPE.IMPORT_METAMASK_WALLET,
  WORKFLOW_TYPE.UNLOCK_METAMASK_WALLET,
  WORKFLOW_TYPE.CONNECT_METAMASK_WALLET,
  WORKFLOW_TYPE.APPROVE_METAMASK_WALLET,
  WORKFLOW_TYPE.CONFIRM_METAMASK_WALLET,
  WORKFLOW_TYPE.CANCEL_METAMASK_WALLET,
];

const WORKFLOW_TYPE_PHANTOM_WALLET = [
  WORKFLOW_TYPE.IMPORT_METAMASK_WALLET,
  WORKFLOW_TYPE.UNLOCK_MARTIAN_WALLET,
  WORKFLOW_TYPE.CONNECT_PHANTOM_WALLET,
  WORKFLOW_TYPE.CLICK_CONFIRM_PHANTOM_WALLET,
];

const WORKFLOW_TYPE_MARTIAN_WALLET = [
  WORKFLOW_TYPE.IMPORT_MARTIAN_WALLET,
  WORKFLOW_TYPE.UNLOCK_MARTIAN_WALLET,
];

const WORKFLOW_TYPE_RABBY_WALLET = [
  WORKFLOW_TYPE.IMPORT_RABBY_WALLET,
  WORKFLOW_TYPE.UNLOCK_RABBY_WALLET,
  WORKFLOW_TYPE.CONNECT_RABBY_WALLET,
  WORKFLOW_TYPE.CANCEL_RABBY_WALLET,
  WORKFLOW_TYPE.SIGN_RABBY_WALLET,
  WORKFLOW_TYPE.ADD_NETWORK_RABBY_WALLET,
];

const WORKFLOW_TYPE_OPEN_AI = [
  WORKFLOW_TYPE.GENERATE_IMAGE,
  WORKFLOW_TYPE.ASK_AGENT,
];

let previousSelected: any = null;

const CustomNode = (props: any) => {
  const { translate } = useTranslation();
  const {
    numberOfFlowProfile,
    nodeMinMaxDuration,
    data = {},
    selected,
    nodeError,
    mapExtensionID,
    preference,
    selectedNodeID,
  } = props;
  const nodeData: INodeData = data;
  const { config, version } = nodeData;
  const { status, onError, onSuccess } = config || {};
  const skipSetting = config?.skipSetting as ISkipSetting;
  const nodeID = useNodeId() || "";
  const connectionNodeId = useStore((state: any) => state.connection?.nodeId);
  const isTarget = connectionNodeId === nodeID;
  const [warning, setWarning] = useState("");

  const { locale } = useTranslation();

  useEffect(() => {
    return () => {
      previousSelected = false;
    };
  }, []);

  const SCRIPT_NAME = useMemo(() => {
    return SCRIPT_NAME_EN;
  }, [locale]);

  const onSuccessColor = useMemo(() => {
    switch (onSuccess) {
      case NODE_ACTION.CONTINUE_RUN:
        return "var(--background-success)";
      case NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE:
        return "var(--background-error)";
      default:
        return "";
    }
  }, [onSuccess]);

  const onSuccessText = useMemo(() => {
    switch (onSuccess) {
      case NODE_ACTION.CONTINUE_RUN:
        return translate("workflow.continueRunThread");
      case NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE:
        return translate("workflow.closeBrowserAndMarkDone");
      default:
        return "";
    }
  }, [onSuccess]);

  const onErrorColor = useMemo(() => {
    switch (onError) {
      case NODE_ACTION.CONTINUE_RUN:
        return "var(--background-success)";
      case NODE_ACTION.PAUSE_THREAD:
        return "var(--background-yellow)";
      case NODE_ACTION.RERUN_THREAD:
        return "var(--background-blue)";
      case NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE:
        return "var(--background-error)";
      default:
        return "";
    }
  }, [onError]);

  const onErrorText = useMemo(() => {
    switch (onError) {
      case NODE_ACTION.CONTINUE_RUN:
        return translate("workflow.continueRunThread");
      case NODE_ACTION.PAUSE_THREAD:
        return translate("workflow.pauseThread");
      case NODE_ACTION.RERUN_THREAD:
        return translate("workflow.rerunThread");
      case NODE_ACTION.TERMINATE_THREAD_AND_MARK_DONE:
        return translate("workflow.closeBrowserAndMarkDone");
      default:
        return "";
    }
  }, [onSuccess]);

  const skipConfigColor = useMemo(() => {
    if (skipSetting?.isSkip) {
      return "var(--background-error)";
    }

    return "var(--background-success)";
  }, [skipSetting]);

  const nodeStatus = useMemo(() => {
    if (
      nodeData?.config?.workflowType === WORKFLOW_TYPE.UPDATE_PROFILE &&
      !props?.selectedCampaign
    ) {
      setWarning(translate("workflow.nodeNeedRunInCampaign"));
      return NODE_STATUS.INVALID;
    }

    // check enough config
    if (
      WORKFLOW_TYPE_PHANTOM_WALLET.includes(
        nodeData?.config?.workflowType as WORKFLOW_TYPE,
      ) &&
      !mapExtensionID[EXTENSION.PHANTOM_WALLET]
    ) {
      setWarning(translate("workflow.uninstallPhantomWallet"));
      return NODE_STATUS.INVALID;
    }

    if (
      WORKFLOW_TYPE_MARTIAN_WALLET.includes(
        nodeData?.config?.workflowType as WORKFLOW_TYPE,
      ) &&
      !mapExtensionID[EXTENSION.MARTIAN_WALLET]
    ) {
      setWarning(translate("workflow.uninstallMartianWallet"));
      return NODE_STATUS.INVALID;
    }

    if (
      WORKFLOW_TYPE_METAMASK.includes(
        nodeData?.config?.workflowType as WORKFLOW_TYPE,
      ) &&
      !mapExtensionID[EXTENSION.METAMASK]
    ) {
      // set invalid status
      setWarning(translate("workflow.uninstallMetamask"));
      return NODE_STATUS.INVALID;
    }

    if (
      WORKFLOW_TYPE_RABBY_WALLET.includes(
        nodeData?.config?.workflowType as WORKFLOW_TYPE,
      ) &&
      !mapExtensionID[EXTENSION.RABBY_WALLET]
    ) {
      // set invalid status
      setWarning(translate("workflow.uninstallRabbyWallet"));
      return NODE_STATUS.INVALID;
    }

    if (
      WORKFLOW_TYPE_OPEN_AI.includes(
        nodeData?.config?.workflowType as WORKFLOW_TYPE,
      ) &&
      !preference?.openAIApiKey
    ) {
      // set invalid status
      setWarning(translate("workflow.openAIApiKeyNotFound"));
      return NODE_STATUS.INVALID;
    }

    if (
      nodeData?.config?.workflowType === WORKFLOW_TYPE.SWAP_JUPITER &&
      preference?.jupiterApiKeys?.length === 0
    ) {
      setWarning(translate("workflow.jupiterApiKeyNotFound"));
      return NODE_STATUS.INVALID;
    }

    return status;
  }, [nodeData, mapExtensionID, status, preference]);

  useEffect(() => {
    if (previousSelected === selected) {
      return;
    }

    if (!selected && selectedNodeID !== nodeID) {
      return;
    }

    previousSelected = selected;
    props?.actSaveSelectedNode(selected ? nodeID : null);
    props?.actSetSelectedWorkflowType(config?.workflowType);

    if (selected) {
      props?.actSaveSelectedEdge(null);
    }
  }, [selected, selectedNodeID, nodeID, config]);

  // numberOfFlowProfile is now computed in the Redux selector

  const className = useMemo(() => {
    if (numberOfFlowProfile !== 0) {
      return "active";
    } else if (props?.selected || isTarget) {
      return "highlight";
    }

    return "";
  }, [props?.selected, isTarget, numberOfFlowProfile]);

  const onOpenModalNodeConfig = () => {
    props?.actSetModalOpen(true);
  };

  const errorColor = useMemo(() => {
    if (
      [MESSAGE_TURN_OFF_PROFILE, MESSAGE_CONDITION_RETURN_FALSE].includes(
        nodeError?.message,
      )
    ) {
      return "orange";
    }

    return "red";
  }, [nodeError]);

  return (
    <CustomNodeWrapper
      className={className}
      onDoubleClick={onOpenModalNodeConfig}
    >
      <div className="content">
        <div className="header">
          <div className="button">
            <div className="icon">
              {nodeStatus === NODE_STATUS.INVALID && (
                <Tooltip
                  title={warning || translate("workflow.invalidCustomNode")}
                >
                  <span>
                    <WarningIcon color="var(--color-yellow)" />
                  </span>
                </Tooltip>
              )}

              {nodeStatus === NODE_STATUS.RUN && (
                <PlayIcon color="var(--color-success)" />
              )}

              {nodeStatus === NODE_STATUS.STOP && (
                <div
                  style={{
                    transform: "scale(0.9)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <StopIcon color="var(--color-error)" />
                </div>
              )}
            </div>

            {(onSuccessColor || onErrorColor) && (
              <div className="action">
                <Tooltip
                  title={
                    <TooltipWrapper>
                      <div className="condition success">on success</div>
                      <div className="text">{onSuccessText}</div>
                    </TooltipWrapper>
                  }
                >
                  <div
                    className="node-action"
                    style={{ backgroundColor: onSuccessColor }}
                  />
                </Tooltip>

                <Tooltip
                  title={
                    <TooltipWrapper>
                      <div className="condition error">on error</div>
                      <div className="text">{onErrorText}</div>
                    </TooltipWrapper>
                  }
                >
                  <div
                    className="node-action"
                    style={{ backgroundColor: onErrorColor }}
                  />
                </Tooltip>

                <Tooltip
                  title={
                    <TooltipWrapper>
                      <div className="condition skip">Skip?</div>
                      <div className="text">
                        {skipSetting?.isSkip ? "Yes" : "No"}
                      </div>
                    </TooltipWrapper>
                  }
                >
                  <div
                    className="node-action"
                    style={{ backgroundColor: skipConfigColor }}
                  />
                </Tooltip>
              </div>
            )}
          </div>

          <div className="node">
            <div className="node-name">
              {trimText(config?.name || "", 16) ||
                SCRIPT_NAME[config?.workflowType as WORKFLOW_TYPE]}
            </div>
            <div className="node-type">
              <div className="icon">{mapNodeIcon[config?.workflowType!]}</div>
              <div className="text">
                {SCRIPT_NAME[config?.workflowType as WORKFLOW_TYPE]} {version}
              </div>
            </div>
          </div>
        </div>

        <div className="statistic">
          <div className="col-1">
            <div className="item">
              <div className="label">{translate("wait")}</div>
              <div className="value">{config?.sleep}s</div>
            </div>

            <div className="item">
              <div className="label">{translate("running")}</div>
              <div className="value">
                {numberOfFlowProfile} {translate("workflow.thread")}
              </div>
            </div>
          </div>

          {config?.workflowType !== WORKFLOW_TYPE.LOOP ? (
            <div className="col-2">
              <div className="item">
                <div className="label">Min</div>
                <div className="value">
                  {Math.round((nodeMinMaxDuration?.min || 0) / 1000)}s
                </div>
              </div>

              <div className="item">
                <div className="label">Max</div>
                <div className="value">
                  {Math.round((nodeMinMaxDuration?.max || 0) / 1000)}s
                </div>
              </div>
            </div>
          ) : (
            <div className="col-2">
              <div className="item">
                <div className="label" style={{ flexBasis: "100%" }}>
                  {`${translate("workflow.loop")}:`}
                </div>
              </div>

              <div className="item">
                <div className="value" style={{ flexBasis: "100%" }}>
                  {(config as ILoopNodeConfig)?.loop || 0}{" "}
                  {translate("workflow.times")}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {nodeError?.timestamp && (
        <Tooltip
          title={
            <div>
              <div>
                {`${translate("time")}:`}{" "}
                {formatTime(nodeError?.timestamp, locale)}
              </div>
              <div>
                <span>{`${translate("encounterError")}:`} </span>
                <span style={{ fontSize: "1.2rem" }}>{nodeError?.message}</span>
              </div>
            </div>
          }
        >
          <div className="error" style={{ backgroundColor: errorColor }}>
            <EmergencyIcon color="white" />
          </div>
        </Tooltip>
      )}

      <div className="handle-area">
        <Handle
          className="node-handle"
          position={Position.Right}
          type="source"
        />

        <div className="icon">
          <RedoIcon color="var(--color-primary)" />
        </div>

        <Handle
          className="node-handle"
          position={Position.Left}
          type="target"
          isConnectableStart={false}
        />
      </div>
    </CustomNodeWrapper>
  );
};

export default connect(
  (state: RootState, ownProps: any) => {
    const nodeID = ownProps.id || "";
    const mapThread = state?.WorkflowRunner?.mapThread;
    let numberOfFlowProfile = 0;
    Object.values(mapThread).forEach((flowProfile: any) => {
      if (flowProfile?.nodeID === nodeID) {
        numberOfFlowProfile += 1;
      }
    });

    return {
      numberOfFlowProfile,
      nodeMinMaxDuration: state?.WorkflowRunner?.mapMinMaxDuration?.[nodeID],
      nodeError: state?.WorkflowRunner?.mapError?.[nodeID],
      mapExtensionID: state?.WorkflowRunner?.mapExtensionID,
      selectedNodeID: state?.WorkflowRunner?.selectedNodeID,
      selectedCampaign: state?.Campaign?.selectedCampaign,
      preference: state?.Preference?.preference,
    };
  },

  {
    actSaveSelectedNode,
    actSaveSelectedEdge,
    actSetModalOpen,
    actSetSelectedWorkflowType,
  },
)(memo(CustomNode));
