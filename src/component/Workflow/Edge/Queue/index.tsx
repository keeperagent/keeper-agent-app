import { useMemo, useEffect } from "react";
import { connect } from "react-redux";
import {
  actSaveSelectedEdge,
  actSaveSelectedNode,
  actSetModalQueueOpen,
} from "@/redux/workflowRunner";
import { RootState } from "@/redux/store";
import { ICampaign, IFlowProfile, IWorkflow } from "@/electron/type";
import { useTranslation } from "@/hook";
import { QueueWrapper } from "./style";

type IQueueProps = {
  edgeID: string;
  style?: React.CSSProperties;
  conditionLabel?: string;
  conditionColor?: string;
  maxConcurrency?: number;
  mapThread: {
    [threadID: string]: IFlowProfile;
  };
  selected: boolean;
  actSaveSelectedEdge: (payload: string | null) => void;
  actSaveSelectedNode: (payload: string | null) => void;
  selectedWorkflow: IWorkflow | null;
  selectedCampaign: ICampaign | null;
  selectedEdgeID: string | null;
  actSetModalQueueOpen: (payload: boolean) => any;
};

let previousSelected: any = null;

const Queue = (props: IQueueProps) => {
  const { translate } = useTranslation();
  const {
    style,
    selectedWorkflow,
    mapThread,
    edgeID,
    selected,
    selectedCampaign,
    selectedEdgeID,
    conditionLabel,
    conditionColor,
  } = props;

  useEffect(() => {
    if (previousSelected === selected) {
      return;
    }

    if (!selected && selectedEdgeID !== edgeID) {
      return;
    }

    previousSelected = selected;
    props?.actSaveSelectedEdge(selected ? edgeID : null);

    if (selected) {
      props?.actSaveSelectedNode(null);
    }
  }, [selected, selectedEdgeID, edgeID]);

  const onSetSelectedWhenClick = () => {
    props?.actSaveSelectedEdge(edgeID);
  };

  const totalThread = useMemo(() => {
    return selectedCampaign
      ? selectedCampaign?.numberOfThread || 1
      : selectedWorkflow?.numberOfThread || 1;
  }, [selectedCampaign, selectedWorkflow]);

  const numberOfFlowProfile = useMemo(() => {
    let count = 0;
    Object.values(mapThread).forEach((flowProfile: IFlowProfile) => {
      if (flowProfile?.edgeID === edgeID) {
        count += 1;
      }
    });

    return count;
  }, [mapThread, edgeID]);

  const percentage = useMemo(() => {
    return Math.round((numberOfFlowProfile * 100) / totalThread);
  }, [numberOfFlowProfile, totalThread]);

  const onOpenModalQueueData = () => {
    props?.actSetModalQueueOpen(true);
  };

  return (
    <QueueWrapper
      style={style}
      className={selected ? "selected" : ""}
      onClick={onSetSelectedWhenClick}
      onDoubleClick={onOpenModalQueueData}
    >
      <div className="header">
        {conditionLabel && (
          <div className="condition-label" style={{ color: conditionColor }}>
            {conditionLabel}
          </div>
        )}
        <div className="value">{translate("workflow.queue")}</div>
      </div>

      <div className="content">
        <div className="text">
          {numberOfFlowProfile}/{totalThread}{" "}
          <span>{translate("workflow.thread")}</span>
        </div>
        <div className="line">
          <div className="process" style={{ flexBasis: `${percentage}%` }} />
          <div
            className="total"
            style={{ flexBasis: `${100 - percentage}%` }}
          />
        </div>
      </div>
    </QueueWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    mapThread: state?.WorkflowRunner.mapThread,
    selectedEdgeID: state?.WorkflowRunner.selectedEdgeID,
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
    selectedCampaign: state?.Campaign?.selectedCampaign,
  }),
  { actSaveSelectedEdge, actSaveSelectedNode, actSetModalQueueOpen },
)(Queue);
