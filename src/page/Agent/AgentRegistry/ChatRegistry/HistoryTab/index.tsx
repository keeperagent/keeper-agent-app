import { useEffect, useState, Fragment } from "react";
import { Pagination, Spin, Tag, Tooltip, Empty } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IScheduleLog, AgentScheduleStatus } from "@/electron/type";
import { useGetListAgentRegistryLog } from "@/hook/agentRegistry";
import { useTranslation } from "@/hook/useTranslation";
import { formatTimeToDate } from "@/service/util";
import {
  collapseResultToOneLine,
  normalizeAgentMessageContent,
} from "@/service/agentMessageContent";
import { HistoryWrapper } from "./style";

const PAGE_SIZE = 10;

const statusColorMap: Record<string, string> = {
  [AgentScheduleStatus.SUCCESS]: "green",
  [AgentScheduleStatus.ERROR]: "red",
  [AgentScheduleStatus.RUNNING]: "blue",
  [AgentScheduleStatus.RETRYING]: "orange",
  [AgentScheduleStatus.SKIPPED]: "default",
};

type Props = {
  agentRegistryId: number;
};

const HistoryTab = ({ agentRegistryId }: Props) => {
  const { translate } = useTranslation();
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const { data, loading, getListAgentRegistryLog } =
    useGetListAgentRegistryLog();

  useEffect(() => {
    getListAgentRegistryLog(agentRegistryId, page, PAGE_SIZE);
  }, [agentRegistryId, page]);

  const toggleExpand = (logId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  if (loading && !data) {
    return (
      <HistoryWrapper>
        <div className="loading-center">
          <Spin />
        </div>
      </HistoryWrapper>
    );
  }

  const logs = data?.data || [];
  const totalData = data?.totalData || 0;

  return (
    <HistoryWrapper>
      <div className="history-list">
        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "1rem",
            }}
          >
            <Spin size="small" />
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="empty-center">
            <Empty description={translate("agent.noHistory")} />
          </div>
        )}

        {logs.map((log: IScheduleLog) => {
          const isExpanded = expandedIds.has(log.id!);
          const statusTag = log.status ? (
            <Tag color={statusColorMap[log.status] || "default"}>
              {log.status.toUpperCase()}
            </Tag>
          ) : null;

          const hasContent = Boolean(log.result || log.errorMessage);

          return (
            <div key={log.id} className="history-item">
              <div
                className="history-item-header"
                onClick={() => hasContent && toggleExpand(log.id!)}
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

              {isExpanded && hasContent && (
                <div className="history-item-body">
                  {log.result && (
                    <Fragment>
                      <div className="markdown-result">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {normalizeAgentMessageContent(log.result)}
                        </ReactMarkdown>
                      </div>
                    </Fragment>
                  )}

                  {!log.result && log.errorMessage && (
                    <div className="error-text">{log.errorMessage}</div>
                  )}
                </div>
              )}

              {!isExpanded && hasContent && (
                <div
                  className="history-item-body"
                  style={{ maxHeight: "4rem", overflow: "hidden" }}
                >
                  <Tooltip title={translate("agent.clickToExpand")}>
                    <div
                      style={{
                        color: "var(--color-text-secondary)",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleExpand(log.id!)}
                    >
                      {collapseResultToOneLine(
                        normalizeAgentMessageContent(
                          log.result || log.errorMessage || "",
                        ),
                      )}
                    </div>
                  </Tooltip>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalData > PAGE_SIZE && (
        <div className="history-pagination">
          <Pagination
            size="small"
            current={page}
            pageSize={PAGE_SIZE}
            total={totalData}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}
    </HistoryWrapper>
  );
};

export default HistoryTab;
