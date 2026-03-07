import { useCallback, useEffect } from "react";
import { useLocation, useBeforeUnload } from "react-router-dom";
import { connect } from "react-redux";
import qs from "qs";
import { RootState } from "@/redux/store";
import { IUndoRedo, actSetAlertBeforeQuit } from "@/redux/workflowRunner";
import { WORKFLOW_PATHNAME, CAMPAIGN_PATHNAME } from "@/config/constant";
import ModalSaveWorkflowBeforeQuit from "./ModalSaveScriptBeforeQuit";

interface IProps {
  isSaved: boolean;
  flowData: IUndoRedo | null;
  alertBeforeQuit: boolean;
  actSetAlertBeforeQuit: (payload: boolean) => void;
}
let shouldAlertSaveBeforeQuit = false;

const BeforeQuitHandler = (props: IProps) => {
  const { flowData, isSaved } = props;
  const { past = [], future = [] } = flowData || {};

  const { pathname, search } = useLocation();
  const { workflowId } = qs.parse(search, { ignoreQueryPrefix: true });

  useEffect(() => {
    shouldAlertSaveBeforeQuit =
      !isSaved && (past?.length > 0 || future?.length > 0);
  }, [past, future, isSaved]);

  // use when user reload or close app
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        let isRouteHasWorkflow = false;
        if (
          (pathname?.includes(WORKFLOW_PATHNAME) ||
            pathname?.includes(CAMPAIGN_PATHNAME)) &&
          workflowId !== undefined
        ) {
          isRouteHasWorkflow = true;
        }

        if (!isRouteHasWorkflow || !shouldAlertSaveBeforeQuit) {
          return;
        }

        event?.preventDefault();
        event.returnValue = "";
        props?.actSetAlertBeforeQuit(true);
      },
      [pathname, workflowId]
    )
  );

  return <ModalSaveWorkflowBeforeQuit />;
};

export default connect(
  (state: RootState) => ({
    flowData: state?.WorkflowRunner?.flowData,
    isSaved: state?.WorkflowRunner?.isSaved,
    alertBeforeQuit: state?.WorkflowRunner?.alertBeforeQuit,
  }),
  { actSetAlertBeforeQuit }
)(BeforeQuitHandler);
