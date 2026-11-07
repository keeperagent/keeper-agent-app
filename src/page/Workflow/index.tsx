import { useEffect, useMemo, useState } from "react";
import { Tabs } from "antd";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";
import { RootState } from "@/redux/store";
import { actSetPageName } from "@/redux/layout";
import { actSaveSelectedWorkflow } from "@/redux/workflow";
import { useGetOneWorkflow, useTranslation } from "@/hook";
import { Workflow } from "@/component";
import { WorkflowPageWrapper } from "./style";
import { VIEW_MODE } from "./constant";
import ManageWorkflow from "./ManageWorkflow";
import WorkflowGroup from "./WorkflowGroup";

const WorkflowPage = (props: any) => {
  const { translate } = useTranslation();
  const [viewMode, setViewMode] = useState(VIEW_MODE.WORKFLOW);
  const location = useLocation();
  const { search } = location;
  const { mode, group, workflowId } = qs.parse(search, {
    ignoreQueryPrefix: true,
  });
  const navigate = useNavigate();
  const { getOneWorkflow } = useGetOneWorkflow();

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.workflow"));
  }, [translate]);

  useEffect(() => {
    setViewMode(
      mode && mode !== "undefined" ? mode?.toString() : VIEW_MODE.WORKFLOW,
    );
  }, [mode]);

  useEffect(() => {
    if (workflowId) {
      getOneWorkflow(Number(workflowId));
    } else {
      props?.actSaveSelectedWorkflow(null);
    }
  }, [workflowId]);

  const onChangeViewMode = (mode: any) => {
    navigate(`/dashboard/workflow?group=${group}&mode=${mode}`);
  };

  const isWorkflow = useMemo(() => workflowId !== undefined, [workflowId]);

  if (isWorkflow) {
    return <Workflow />;
  }

  return (
    <WorkflowPageWrapper>
      <title>{translate("sidebar.workflow")}</title>

      <div className="tab">
        <Tabs
          activeKey={viewMode}
          items={[
            {
              key: VIEW_MODE.WORKFLOW,
              label: translate("workflow.workflow"),
            },
            {
              key: VIEW_MODE.WORKFLOW_GROUP,
              label: translate("workflow.workflowGroup"),
            },
          ]}
          onChange={onChangeViewMode}
        />
      </div>

      <div className="tab-content">
        {viewMode === VIEW_MODE.WORKFLOW_GROUP ? (
          <WorkflowGroup />
        ) : (
          <ManageWorkflow />
        )}
      </div>
    </WorkflowPageWrapper>
  );
};

export default connect((_state: RootState) => ({}), {
  actSetPageName,
  actSaveSelectedWorkflow,
})(WorkflowPage);
