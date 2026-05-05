import { Fragment } from "react";
import { Tag, Tooltip } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  IAppLog,
  AppLogType,
  AgentTaskStatus,
  AgentScheduleStatus,
} from "@/electron/type";
import { useTranslation } from "@/hook/useTranslation";
import { formatTimeToDate, formatDurationBetween } from "@/service/util";
import {
  collapseResultToOneLine,
  normalizeAgentMessageContent,
} from "@/service/agentMessageContent";
import { EMPTY_STRING } from "@/config/constant";
import { HistoryItemWrapper } from "./style";

const scheduleStatusColorMap: Record<string, string> = {
  [AgentScheduleStatus.SUCCESS]: "green",
  [AgentScheduleStatus.ERROR]: "red",
  [AgentScheduleStatus.RUNNING]: "blue",
  [AgentScheduleStatus.RETRYING]: "orange",
  [AgentScheduleStatus.SKIPPED]: "default",
};

const taskStatusColorMap: Record<string, string> = {
  [AgentTaskStatus.DONE]: "green",
  [AgentTaskStatus.FAILED]: "red",
  [AgentTaskStatus.IN_PROGRESS]: "blue",
  [AgentTaskStatus.CANCELLED]: "default",
  [AgentTaskStatus.EXPIRED]: "orange",
};

type Props = {
  log: IAppLog;
  isExpanded: boolean;
  onToggle: (logId: number) => void;
};

const HistoryItem = (props: Props) => {
  const { log, isExpanded, onToggle } = props;
  const { translate } = useTranslation();
  const hasContent = Boolean(log.result || log.errorMessage);

  if (log.logType === AppLogType.TASK) {
    const statusColor = taskStatusColorMap[log.status || ""] || "default";
    const duration =
      log.startedAt && log.finishedAt
        ? formatDurationBetween(log.startedAt, log.finishedAt)
        : null;

    return (
      <HistoryItemWrapper>
        <div
          className="history-item-header"
          onClick={() => hasContent && onToggle(log.id!)}
        >
          <Tag color={statusColor} className="history-item-tag">
            {log.status || "task"}
          </Tag>

          <span className="history-item-title">
            {log.message || EMPTY_STRING}
          </span>

          <div className="history-item-meta">
            {duration && (
              <Fragment>
                <span className="history-item-duration">{duration}</span>
                <span className="history-item-separator">·</span>
              </Fragment>
            )}
            <span className="history-item-time">
              {formatTimeToDate(Number(log.createAt))}
            </span>

            {hasContent && (
              <span className="history-item-chevron">
                {isExpanded ? "▲" : "▼"}
              </span>
            )}
          </div>
        </div>

        {(hasContent || log.task?.description) && (
          <div
            className={`history-item-body${isExpanded ? " is-expanded" : ""}`}
          >
            {isExpanded ? (
              <Fragment>
                {log.task?.description && (
                  <div className="task-description">{log.task.description}</div>
                )}
                {log.result && (
                  <div className="markdown-result">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {normalizeAgentMessageContent(log.result)}
                    </ReactMarkdown>
                  </div>
                )}
                {!log.result && log.errorMessage && (
                  <div className="error-text">{log.errorMessage}</div>
                )}
              </Fragment>
            ) : (
              <Tooltip title={translate("agent.clickToExpand")}>
                <div
                  className={`preview-text${!log.result && log.errorMessage ? " preview-text--error" : ""}`}
                  onClick={() => onToggle(log.id!)}
                >
                  {collapseResultToOneLine(
                    normalizeAgentMessageContent(
                      log.result ||
                        log.errorMessage ||
                        log.task?.description ||
                        "",
                    ),
                  )}
                </div>
              </Tooltip>
            )}
          </div>
        )}
      </HistoryItemWrapper>
    );
  }

  const statusTag = log.status ? (
    <Tag color={scheduleStatusColorMap[log.status] || "default"}>
      {log.status}
    </Tag>
  ) : null;

  return (
    <HistoryItemWrapper>
      <div
        className="history-item-header"
        onClick={() => hasContent && onToggle(log.id!)}
      >
        {statusTag}

        <span className="history-item-time">
          {formatTimeToDate(Number(log.createAt))}
        </span>

        {hasContent && (
          <span className="history-item-chevron">{isExpanded ? "▲" : "▼"}</span>
        )}
      </div>

      {hasContent && (
        <div className={`history-item-body${isExpanded ? " is-expanded" : ""}`}>
          {isExpanded ? (
            <Fragment>
              {log.result && (
                <div className="markdown-result">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {normalizeAgentMessageContent(log.result)}
                  </ReactMarkdown>
                </div>
              )}
              {!log.result && log.errorMessage && (
                <div className="error-text">{log.errorMessage}</div>
              )}
            </Fragment>
          ) : (
            <Tooltip title={translate("agent.clickToExpand")}>
              <div
                className={`preview-text${!log.result && log.errorMessage ? " preview-text--error" : ""}`}
                onClick={() => onToggle(log.id!)}
              >
                {collapseResultToOneLine(
                  normalizeAgentMessageContent(
                    log.result || log.errorMessage || "",
                  ),
                )}
              </div>
            </Tooltip>
          )}
        </div>
      )}
    </HistoryItemWrapper>
  );
};

export default HistoryItem;
