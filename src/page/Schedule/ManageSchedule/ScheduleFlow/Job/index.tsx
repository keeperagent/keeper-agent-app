import _ from "lodash";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Badge, Popconfirm, Popover, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation, useGetOneSchedule } from "@/hook";
import {
  AgentScheduleStatus,
  IJob,
  IRunningWorkflow,
  ISchedule,
  JobType,
} from "@/electron/type";
import { EMPTY_STRING } from "@/config/constant";
import { TrashBoldIcon, DurationIcon, SpinIcon } from "@/component/Icon";
import { useDeleteJob, useMarkJobCompleted } from "@/hook";
import { formatTimeToDate, formatDurationBetween } from "@/service/util";
import {
  collapseResultToOneLine,
  normalizeAgentMessageContent,
} from "@/service/agentMessageContent";
import ReactMarkdown from "react-markdown";
import { LLM_PROVIDERS } from "@/config/llmProviders";
import { Wrapper, DurationWrapper, ProviderBadge } from "./style";

type IProps = {
  job: IJob;
  schedule: ISchedule;
  index: number;
  listRunningWorkflow: IRunningWorkflow[];
  onOpenEdit: (job: IJob) => void;
};

const Job = (props: IProps) => {
  const { job, schedule, index, listRunningWorkflow, onOpenEdit } = props;
  const [isMarkJobCompleted, setIsMarkJobCompleted] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

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

  const isAgentJob = job.type === JobType.AGENT;
  const isAgentRunning = job.lastLog?.status === AgentScheduleStatus.RUNNING;
  const startedAt = isAgentJob ? job.lastLog?.startedAt : job.lastRunTime;
  const finishedAt = isAgentJob ? job.lastLog?.finishedAt : job.lastEndTime;
  const runStartedAt = startedAt;

  useEffect(() => {
    if (!isAgentRunning || !runStartedAt) {
      return;
    }

    setElapsedMs(Date.now() - runStartedAt);
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - runStartedAt);
    }, 1000);

    return () => clearInterval(timer);
  }, [isAgentRunning, runStartedAt]);

  const renderDuration = () => (
    <DurationWrapper>
      {Boolean(startedAt) && (
        <div className="item">
          <div className="label">
            <div
              className="icon"
              style={{ backgroundColor: "var(--color-success)" }}
            />
            <span>{translate("campaign.startTime")}:</span>
          </div>
          <div className="value">{formatTimeToDate(startedAt!)}</div>
        </div>
      )}

      {isAgentRunning && runStartedAt ? (
        <div className="item">
          <div className="label">
            <div
              className="icon"
              style={{ backgroundColor: "var(--color-blue)" }}
            />
            <span>{translate("schedule.runningFor")}:</span>
          </div>

          <div className="value">
            {formatDurationBetween(runStartedAt, runStartedAt + elapsedMs)}
          </div>
        </div>
      ) : (
        <Fragment>
          <div className="item">
            <div className="label">
              <div
                className="icon"
                style={{ backgroundColor: "var(--color-error)" }}
              />
              <span>{translate("campaign.endTime")}:</span>
            </div>

            <div className="value">
              {Boolean(finishedAt) && startedAt! < finishedAt!
                ? formatTimeToDate(finishedAt!)
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
              {startedAt && finishedAt && finishedAt > startedAt
                ? formatDurationBetween(startedAt, finishedAt)
                : EMPTY_STRING}
            </div>
          </div>
        </Fragment>
      )}

      {job.lastLog && (
        <Fragment>
          <div className="divider" />

          <div className="item">
            <div className="label">
              <div
                className="icon"
                style={{
                  backgroundColor:
                    lastLogStatusColorMap[job.lastLog.status || ""] ||
                    "var(--color-text-secondary)",
                }}
              />
              <span>{translate("schedule.lastStatus")}:</span>
            </div>
            <div className="value">{job.lastLog.status}</div>
          </div>

          {lastLogText && (
            <div className="item log-markdown">
              <ReactMarkdown>{lastLogText}</ReactMarkdown>
            </div>
          )}
        </Fragment>
      )}
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

  const lastLogText = normalizeAgentMessageContent(
    job.lastLog?.result || job.lastLog?.errorMessage || "",
  );

  const lastLogStatusColorMap: Record<string, string> = {
    [AgentScheduleStatus.SUCCESS]: "var(--color-success)",
    [AgentScheduleStatus.ERROR]: "var(--color-error)",
    [AgentScheduleStatus.RUNNING]: "var(--color-blue)",
    [AgentScheduleStatus.RETRYING]: "var(--color-yellow)",
    [AgentScheduleStatus.SKIPPED]: "var(--color-text-secondary)",
  };

  const currentProvider =
    LLM_PROVIDERS.find((provider) => provider.key === job?.llmProvider) ||
    LLM_PROVIDERS[0];

  return (
    <Wrapper onClick={isAgentJob ? () => onOpenEdit(job) : undefined}>
      <div className="header" onClick={(e) => e.stopPropagation()}>
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

        <Popconfirm
          title={translate("confirmDelete")}
          onConfirm={onRemoveJob}
          placement="top"
        >
          <Tooltip title={translate("remove")}>
            <div className="delete icon">
              <TrashBoldIcon />
            </div>
          </Tooltip>
        </Popconfirm>

        {(Boolean(startedAt) ||
          Boolean(finishedAt) ||
          Boolean(job?.lastLog)) && (
          <Popover
            content={renderDuration()}
            trigger="hover"
            placement="bottomRight"
          >
            <div className="icon">
              <DurationIcon
                color={lastLogStatusColorMap[job.lastLog?.status || ""]}
              />
            </div>
          </Popover>
        )}

        <div className="order">{index + 1}</div>
      </div>

      {isAgentJob ? (
        <Fragment>
          <div className="item prompt-block">
            <div className="label">{`${translate("schedule.agentPrompt")}:`}</div>
            {job?.prompt ? (
              <div className="value prompt-preview">
                {collapseResultToOneLine(job.prompt)}
              </div>
            ) : (
              <div className="value">{EMPTY_STRING}</div>
            )}
          </div>

          <div className="item provider-row">
            <div className="label">{`${translate("schedule.llmProvider")}:`}</div>
            <ProviderBadge>
              <img src={currentProvider.icon} alt={currentProvider.label} />
              <span>{currentProvider.label}</span>
            </ProviderBadge>
          </div>
        </Fragment>
      ) : (
        <Fragment>
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
        </Fragment>
      )}
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listRunningWorkflow: state?.WorkflowRunner?.listRunningWorkflow || [],
  }),
  {},
)(Job);
