import { useEffect, useState } from "react";
import { Pagination, Spin, Empty } from "antd";
import { IAppLog } from "@/electron/type";
import { useGetListAgentProfileLog } from "@/hook/agentProfile";
import { useTranslation } from "@/hook/useTranslation";
import { TotalData } from "@/component";
import HistoryItem from "./HistoryItem";
import { HistoryWrapper } from "./style";

const PAGE_SIZE = 10;

type Props = {
  agentProfileId: number;
};

const HistoryTab = ({ agentProfileId }: Props) => {
  const { translate } = useTranslation();
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const { data, loading, getListAgentProfileLog } = useGetListAgentProfileLog();

  useEffect(() => {
    getListAgentProfileLog(agentProfileId, page, PAGE_SIZE);
  }, [agentProfileId, page]);

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

  const logs: IAppLog[] = data?.data || [];
  const totalData = data?.totalData || 0;

  return (
    <HistoryWrapper>
      {totalData > PAGE_SIZE && (
        <div className="history-pagination">
          <TotalData
            text={`${translate("total")} ${totalData} ${translate("data")}`}
          />

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

        {logs.map((log: IAppLog) => (
          <HistoryItem
            key={log.id}
            log={log}
            isExpanded={expandedIds.has(log.id!)}
            onToggle={toggleExpand}
          />
        ))}
      </div>
    </HistoryWrapper>
  );
};

export default HistoryTab;
