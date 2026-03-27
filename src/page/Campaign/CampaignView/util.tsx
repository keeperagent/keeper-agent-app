import _ from "lodash";
import { Tooltip, Dropdown, Badge } from "antd";
import { ICampaign, IRunningWorkflow, IWorkflow } from "@/electron/type";
import { trimText } from "@/service/util";
import { EMPTY_STRING } from "@/config/constant";
import { IconHighlightWrapper, OptionWrapper } from "./style";

export const renderListWorkflowTooltip = (
  campaign: ICampaign,
  onViewWorkflow: (campaign: ICampaign, workflowId: number) => void,
  listRunningWorkflow: IRunningWorkflow[],
  icon: JSX.Element,
  translate: any,
  classname?: string,
) => {
  const { listWorkflow = [] } = campaign || {};

  if (listWorkflow?.length === 0) {
    return (
      <IconHighlightWrapper
        className={classname ? `${classname} disable` : "disable"}
      >
        {icon}
      </IconHighlightWrapper>
    );
  }

  const items = listWorkflow?.map((workflow: IWorkflow, index: number) => ({
    key: workflow?.id!,
    label: (
      <OptionWrapper onClick={() => onViewWorkflow(campaign, workflow?.id!)}>
        <div className="name">
          {index + 1}. {workflow?.name}
          {_.find(listRunningWorkflow, {
            campaignId: campaign?.id,
            workflowId: workflow?.id,
          }) && (
            <Tooltip title={translate("running")}>
              <Badge status="success" style={{ marginLeft: "1rem" }} />
            </Tooltip>
          )}
        </div>
        <div className="description">
          {trimText(workflow?.note || "", 60) || EMPTY_STRING}
        </div>
      </OptionWrapper>
    ),
  }));

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <IconHighlightWrapper
        className={classname ? `${classname} disable` : "disable"}
      >
        {icon}
      </IconHighlightWrapper>
    </Dropdown>
  );
};
