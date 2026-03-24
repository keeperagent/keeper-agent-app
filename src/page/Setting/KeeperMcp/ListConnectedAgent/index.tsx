import { Empty } from "antd";
import { IMcpConnection } from "@/electron/type";
import { useTranslation } from "@/hook";
import { ListConnectedAgentRoot } from "./style";

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

export type ListConnectedAgentProps = {
  connections: IMcpConnection[];
};

export const ListConnectedAgent = ({
  connections,
}: ListConnectedAgentProps) => {
  const { translate } = useTranslation();

  return (
    <ListConnectedAgentRoot>
      <div className="section-wrapper">
        <div className="section-header">
          <div className="section-title">
            {translate("mcp.connectedAgents")}
          </div>
        </div>

        {connections.length === 0 ? (
          <div className="empty">
            <Empty description={translate("mcp.noConnections")} />
          </div>
        ) : (
          <div className="connection-list">
            {connections.map((conn) => (
              <div
                className="connection-row"
                key={`${conn.tokenId}-${conn.connectedAt}-${conn.clientInfo ?? ""}`}
              >
                <div className="connection-dot" />

                <div className="connection-info">
                  <div className="connection-name">{conn.tokenName}</div>
                  <div className="connection-time">
                    {translate("mcp.connectedAt")}:{" "}
                    {formatTime(conn.connectedAt)}
                    {conn.clientInfo && ` — ${conn.clientInfo}`}
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
