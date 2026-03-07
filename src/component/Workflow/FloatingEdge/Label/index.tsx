import { useMemo, useEffect } from "react";
import { connect } from "react-redux";
import {
  actSaveSelectedEdge,
  actSaveSelectedNode,
} from "@/redux/workflowRunner";
import { RootState } from "@/redux/store";
import { ICampaign, IFlowProfile, IWorkflow } from "@/electron/type";
import { actSetModalQueueOpen } from "@/redux/workflowRunner";
import { LabelWrapper } from "./style";
import { useTranslation } from "@/hook";

type ILabelProps = {
  edgeID: string;
  style?: React.CSSProperties;
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

const Label = (props: ILabelProps) => {
  const { translate } = useTranslation();
  const {
    style,
    selectedWorkflow,
    mapThread,
    edgeID,
    selected,
    selectedCampaign,
    selectedEdgeID,
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
    <LabelWrapper
      style={style}
      className={selected ? "selected" : ""}
      onClick={onSetSelectedWhenClick}
      onDoubleClick={onOpenModalQueueData}
    >
      <div className="header">
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
    </LabelWrapper>
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
)(Label);
