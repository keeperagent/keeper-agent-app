import { Empty } from "antd";
import { IMcpConnection } from "@/electron/type";
import { useTranslation } from "@/hook";
import { ListConnectedAgentRoot } from "./style";

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

type GroupedConnection = {
  tokenId: number;
  tokenName: string;
  clientInfo: string;
  connectedAt: number;
  sessionCount: number;
};

const groupByToken = (connections: IMcpConnection[]): GroupedConnection[] => {
  const groupMap = new Map<number, GroupedConnection>();

  for (const conn of connections) {
    const existing = groupMap.get(conn.tokenId);
    if (existing) {
      existing.sessionCount++;
      if (conn.connectedAt < existing.connectedAt) {
        existing.connectedAt = conn.connectedAt;
      }
    } else {
      groupMap.set(conn.tokenId, {
        tokenId: conn.tokenId,
        tokenName: conn.tokenName,
        clientInfo: conn.clientInfo || "",
        connectedAt: conn.connectedAt,
        sessionCount: 1,
      });
    }
  }

  return Array.from(groupMap.values());
};

export type ListConnectedAgentProps = {
  connections: IMcpConnection[];
};

export const ListConnectedAgent = ({
  connections,
}: ListConnectedAgentProps) => {
  const { translate } = useTranslation();
  const grouped = groupByToken(connections);

  return (
    <ListConnectedAgentRoot>
      <div className="section-wrapper">
        <div className="section-header">
          <div className="section-title">
            {translate("mcp.connectedAgents")}
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="empty">
            <Empty description={translate("mcp.noConnections")} />
          </div>
        ) : (
          <div className="connection-list">
            {grouped.map((conn) => (
              <div className="connection-row" key={conn.tokenId}>
                <div className="connection-dot" />

                <div className="connection-info">
                  <div className="connection-name">
                    {conn.tokenName}
                    {conn.sessionCount > 1 && (
                      <span className="session-count">
                        {` (${conn.sessionCount} sessions)`}
                      </span>
                    )}
                  </div>
                  <div className="connection-time">
                    {translate("mcp.connectedAt")}:{" "}
                    {formatTime(conn.connectedAt)}
                    {conn.clientInfo && ` ~ ${conn.clientInfo}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ListConnectedAgentRoot>
  );
};
