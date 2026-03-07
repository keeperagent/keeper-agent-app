import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import { Badge, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation, useGetOneSchedule } from "@/hook";
import { IJob, IRunningWorkflow, ISchedule } from "@/electron/type";
import { EMPTY_STRING } from "@/config/constant";
import { TrashBoldIcon, DurationIcon, SpinIcon } from "@/component/Icon";
import { useDeleteJob, useMarkJobCompleted } from "@/hook";
import { formatTimeToDate, formatDurationBetween } from "@/service/util";
import { Wrapper, DurationWrapper } from "./style";

type IProps = {
  job: IJob;
  schedule: ISchedule;
  index: number;
  listRunningWorkflow: IRunningWorkflow[];
};

const Job = (props: IProps) => {
  const { job, schedule, index, listRunningWorkflow } = props;
  const [isMarkJobCompleted, setIsMarkJobCompleted] = useState(false);

  const { translate } = useTranslation();
  const { deleteJob, loading, isSuccess } = useDeleteJob();
  const { getOneSchedule } = useGetOneSchedule();
  const navigate = useNavigate();
  const { markJobCompleted } = useMarkJobCompleted();

  useEffect(() => {
    if (!loading && isSuccess) {
      getOneSchedule(schedule?.id!);
    }
  }, [loading, isSuccess]);

  const renderDuration = () => (
    <DurationWrapper>
      {Boolean(job?.lastRunTime) && (
        <div className="item">
          <div className="label">
            <div
              className="icon"
              style={{ backgroundColor: "var(--color-success)" }}
            />

            <span>{translate("campaign.startTime")}:</span>
          </div>
          <div className="value">{formatTimeToDate(job?.lastRunTime!)}</div>
        </div>
      )}

      <div className="item">
        <div className="label">
          <div
            className="icon"
            style={{ backgroundColor: "var(--color-error)" }}
          />

          <span>{translate("campaign.endTime")}:</span>
        </div>
        <div className="value">
          {Boolean(job?.lastEndTime) && job?.lastRunTime! < job?.lastEndTime!
            ? formatTimeToDate(job?.lastEndTime!)
            : EMPTY_STRING}
        </div>
      </div>

      <div className="item">
        <div className="label">
          <div
            className="icon"
            style={{ backgroundColor: "var(--color-blue)" }}
          />

          <span>{translate("campaign.duration")}:</span>
        </div>
        <div className="value">
          {job?.lastRunTime &&
          job?.lastEndTime &&
          job?.lastEndTime > job?.lastRunTime
            ? formatDurationBetween(job?.lastRunTime, job?.lastEndTime)
            : EMPTY_STRING}
        </div>
      </div>
    </DurationWrapper>
  );

  const onRemoveJob = () => {
    deleteJob([job?.id!]);
  };

  const onMarkJobComplete = () => {
    setIsMarkJobCompleted(true);
    markJobCompleted(job?.id!);
  };

  const onViewCampaign = () => {
    navigate(
      `/dashboard/campaign?campaignId=${job?.campaign?.id}&mode=VIEW_PROFILE`,
    );
  };

  const onViewWorkflow = () => {
    navigate(
      `/dashboard/campaign?campaignId=${job?.campaign?.id}&workflowId=${job?.workflow?.id}&mode=VIEW_WORKFLOW`,
    );
  };

  const isRunning = useMemo(() => {
    return _.find(listRunningWorkflow, {
      workflowId: job?.workflowId,
      campaignId: job?.campaignId,
    });
  }, [listRunningWorkflow, job]);

  const waitForJobComplete = useMemo(() => {
    return !isRunning || (isMarkJobCompleted && isRunning);
  }, [isRunning, isMarkJobCompleted]);

  return (
    <Wrapper>
      <div className="header">
        {isRunning && (
          <Tooltip title={translate("running")} placement="top">
            <span>
              <Badge status="success" style={{ marginLeft: "1rem" }} />
            </span>
          </Tooltip>
        )}

        {isRunning && !isMarkJobCompleted && (
          <Tooltip title={translate("stop")}>
            <div className="stop-icon" onClick={onMarkJobComplete} />
          </Tooltip>
        )}
        {isRunning && waitForJobComplete && (
          <div className="loading">
            <div className="loading-icon">
              <SpinIcon />
            </div>
          </div>
        )}

        <Tooltip title={translate("remove")}>
          <div className="delete icon" onClick={onRemoveJob}>
            <TrashBoldIcon />
          </div>
        </Tooltip>

        {(Boolean(job?.lastRunTime) || Boolean(job?.lastEndTime)) && (
          <Tooltip title={renderDuration}>
            <div className="icon" style={{ cursor: "auto" }}>
              <DurationIcon />
            </div>
          </Tooltip>
        )}

        <div className="order">{index + 1}</div>
      </div>

      <div className="item">
        <div className="label">{`${translate("sidebar.campaign")}:`}</div>
        <div className="value" onClick={onViewCampaign}>
          {job?.campaign?.name || EMPTY_STRING}
        </div>
      </div>

      <div className="item">
        <div className="label">{`${translate("sidebar.workflow")}:`}</div>
        <div className="value" onClick={onViewWorkflow}>
          {job?.workflow?.name || EMPTY_STRING}
        </div>
      </div>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listRunningWorkflow: state?.WorkflowRunner?.listRunningWorkflow || [],
  }),
  {},
)(Job);
