import { Modal } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation, useUpdateWorkflow } from "@/hook";
import {
  actSetIsSaved,
  actSetAlertBeforeQuit,
  IUndoRedo,
} from "@/redux/workflowRunner";
import { IWorkflowData } from "@/types/interface";
import { IWorkflow } from "@/electron/type";

type IProps = {
  selectedWorkflow: IWorkflow | null;
  flowData: IUndoRedo | null;
  actSetIsSaved: (payload: boolean) => void;
  alertBeforeQuit: boolean;
  actSetAlertBeforeQuit: (payload: boolean) => void;
};

const ModalSaveWorkflowBeforeQuit = (props: IProps) => {
  const { translate } = useTranslation();
  const { selectedWorkflow, alertBeforeQuit, flowData } = props;
  const { edges = [], nodes = [] } = flowData?.present || {};
  const { updateWorkflow } = useUpdateWorkflow();

  const onSaveFlow = async () => {
    if (!selectedWorkflow) {
      return;
    }
    const workflowData: IWorkflowData = {
      nodes,
      edges,
    };

    props?.actSetIsSaved(true);
    await updateWorkflow({
      ...selectedWorkflow,
      data: JSON.stringify(workflowData),
    });
    props?.actSetAlertBeforeQuit(false);
  };

  const onCancel = () => {
    props?.actSetAlertBeforeQuit(false);
  };

  return (
    <Modal
      title={translate("workflow.dataIsNotSaved")}
      mask={{ closable: false }}
      onOk={onSaveFlow}
      onCancel={onCancel}
      open={alertBeforeQuit}
      cancelText={translate("no")}
      okText={translate("yes")}
      closeIcon={null}
    >
      {translate("workflow.saveBeforeQuitDescription")}
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    flowData: state?.WorkflowRunner?.flowData,
    alertBeforeQuit: state?.WorkflowRunner?.alertBeforeQuit,
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
  }),
  { actSetIsSaved, actSetAlertBeforeQuit },
)(ModalSaveWorkflowBeforeQuit);
