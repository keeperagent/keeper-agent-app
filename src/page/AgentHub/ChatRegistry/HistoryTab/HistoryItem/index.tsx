import { Fragment } from "react";
import { Tag, Tooltip } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IScheduleLog, AgentScheduleStatus } from "@/electron/type";
import { useTranslation } from "@/hook/useTranslation";
import { formatTimeToDate } from "@/service/util";
import {
  collapseResultToOneLine,
  normalizeAgentMessageContent,
} from "@/service/agentMessageContent";
import { HistoryItemWrapper } from "./style";

const statusColorMap: Record<string, string> = {
  [AgentScheduleStatus.SUCCESS]: "green",
  [AgentScheduleStatus.ERROR]: "red",
  [AgentScheduleStatus.RUNNING]: "blue",
  [AgentScheduleStatus.RETRYING]: "orange",
  [AgentScheduleStatus.SKIPPED]: "default",
};

type Props = {
  log: IScheduleLog;
  isExpanded: boolean;
  onToggle: (logId: number) => void;
};

const HistoryItem = ({ log, isExpanded, onToggle }: Props) => {
  const { translate } = useTranslation();
  const hasContent = Boolean(log.result || log.errorMessage);

  const statusTag = log.status ? (
    <Tag color={statusColorMap[log.status] || "default"}>{log.status}</Tag>
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
          <span
            style={{
              fontSize: "1.1rem",
              color: "var(--color-text-secondary)",
            }}
          >
            {isExpanded ? "▲" : "▼"}
          </span>
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
