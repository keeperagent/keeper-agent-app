import { Fragment, useEffect } from "react";
import { useLocation } from "react-router-dom";
import qs from "qs";
import { Workflow } from "@/component";
import { useGetOneWorkflow } from "@/hook";

const WorkflowView = () => {
  const location = useLocation();
  const { search } = location;
  const { workflowId } = qs.parse(search, {
    ignoreQueryPrefix: true,
  });
  const { getOneWorkflow } = useGetOneWorkflow();

  useEffect(() => {
    if (workflowId) {
      getOneWorkflow(Number(workflowId?.toString()));
    }
  }, [workflowId]);

  return (
    <Fragment>
      <title>Campaign Workflow</title>

      <Workflow />
    </Fragment>
  );
};

export default WorkflowView;
