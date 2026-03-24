import { useEffect, useState } from "react";
import { Pagination, Spin, Empty } from "antd";
import { IScheduleLog } from "@/electron/type";
import { useGetListAgentRegistryLog } from "@/hook/agentRegistry";
import { useTranslation } from "@/hook/useTranslation";
import { HistoryWrapper } from "./style";
import HistoryItem from "./HistoryItem";

const PAGE_SIZE = 10;

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

        {logs.map((log: IScheduleLog) => (
          <HistoryItem
            key={log.id}
            log={log}
            isExpanded={expandedIds.has(log.id!)}
            onToggle={toggleExpand}
          />
        ))}
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
