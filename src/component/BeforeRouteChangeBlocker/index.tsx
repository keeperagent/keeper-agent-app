import { useCallback, useEffect } from "react";
import { connect } from "react-redux";
import { useLocation } from "react-router-dom";
import qs from "qs";
import { RootState } from "@/redux/store";
import { IUndoRedo, actSetAlertBeforeQuit } from "@/redux/workflowRunner";
import { WORKFLOW_PATHNAME, CAMPAIGN_PATHNAME } from "@/config/constant";

interface IProps {
  isSaved: boolean;
  flowData: IUndoRedo | null;
  children: JSX.Element;
  onClick: () => void;
  actSetAlertBeforeQuit: (payload: boolean) => void;
}
let shouldAlertSaveBeforeQuit = false;

const BeforeRouteChangeBlocker = (props: IProps) => {
  const { flowData, isSaved, children, onClick } = props;
  const { past = [], future = [] } = flowData || {};
  const { pathname, search } = useLocation();
  const { workflowId } = qs.parse(search, { ignoreQueryPrefix: true });

  useEffect(() => {
    shouldAlertSaveBeforeQuit =
      !isSaved && (past?.length > 0 || future?.length > 0);
  }, [past, future, isSaved]);

  const onClickLink = useCallback(() => {
    let isRouteHasWorkflow = false;
    if (
      (pathname?.includes(WORKFLOW_PATHNAME) ||
        pathname?.includes(CAMPAIGN_PATHNAME)) &&
      workflowId !== undefined
    ) {
      isRouteHasWorkflow = true;
    }

    if (!isRouteHasWorkflow || !shouldAlertSaveBeforeQuit) {
      onClick();
      return;
    }

    props?.actSetAlertBeforeQuit(true);
  }, [pathname, workflowId, onClick]);

  return <span onClick={onClickLink}>{children}</span>;
};

export default connect(
  (state: RootState) => ({
    flowData: state?.WorkflowRunner?.flowData,
    isSaved: state?.WorkflowRunner?.isSaved,
  }),
  { actSetAlertBeforeQuit },
)(BeforeRouteChangeBlocker);
