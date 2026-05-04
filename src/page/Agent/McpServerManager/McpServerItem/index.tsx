import { Button, Popconfirm, Switch, Tooltip } from "antd";
import { IMcpServer, MCPServerStatus } from "@/electron/type";
import Status from "@/component/Status";
import { formatTime } from "@/service/util";
import { useTranslation } from "@/hook/useTranslation";
import { Wrapper } from "./style";

type IMcpServerItemProps = {
  item: IMcpServer;
  onEdit: (item: IMcpServer) => void;
  onDelete: (id: number) => void;
  onToggle: (item: IMcpServer) => void;
  onViewTools: (item: IMcpServer) => void;
};

const McpServerItem = (props: IMcpServerItemProps) => {
  const { item, onEdit, onDelete, onToggle, onViewTools } = props;
  const { translate, locale } = useTranslation();

  const statusContent =
    item.status === MCPServerStatus.CONNECTED
      ? translate("connected")
      : item.status === MCPServerStatus.ERROR
        ? translate("error")
        : translate("disconnected");

  const isConnected = item.status === MCPServerStatus.CONNECTED;
  const isError = item.status === MCPServerStatus.ERROR;
  const fullError = isError ? item.lastError || "" : "";
  const showToolCount = isConnected && Boolean(item.toolsCount);

  return (
    <Wrapper>
      <div className="item-header">
        <div className="item-dots" aria-hidden>
          <span className="item-dot item-dot-red" />
          <span className="item-dot item-dot-yellow" />
          <span className="item-dot item-dot-green" />
        </div>

        <Switch
          size="small"
          checked={item.isEnabled}
          disabled={item?.id == null}
          onChange={() => item?.id != null && onToggle(item)}
        />
      </div>

      <div
        className="item-body"
        role="button"
        tabIndex={0}
        onClick={() => onEdit(item)}
      >
        <span className="item-name">{item.name}</span>

        {item.description && (
          <span className="item-description">{item.description}</span>
        )}

        {item.commandOrUrl && (
          <div className="item-command-or-url-row">
            <span className="item-label">{translate("commandOrUrl")}:</span>
            <span className="item-command-or-url">{item.commandOrUrl}</span>
          </div>
        )}

        <div className="item-status-row">
          {isError && fullError ? (
            <Tooltip title={fullError} placement="topLeft">
              <span>
                <Status content={statusContent} isSuccess={false} />
              </span>
            </Tooltip>
          ) : (
            <Status content={statusContent} isSuccess={isConnected} />
          )}

          {showToolCount && (
            <span className="item-tool-count">
              {item.toolsCount} {translate("tools")}
            </span>
          )}
        </div>
      </div>

      <div className="item-footer">
        <span className="item-updated">
          {translate("updatedAt")}:{" "}
          {item?.updateAt != null
            ? formatTime(Number(item.updateAt), locale)
            : "—"}
        </span>

        <div className="item-actions">
          {showToolCount && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onViewTools(item);
              }}
            >
              {translate("tools")}
            </Button>
          )}

          <Button size="small" onClick={() => onEdit(item)}>
            {translate("button.edit")}
          </Button>

          <Popconfirm
            title={translate("agent.deleteMcpServer")}
            onConfirm={() => onDelete(item.id!)}
            okText={translate("yes")}
            cancelText={translate("no")}
          >
            <Button size="small" danger onClick={(e) => e.stopPropagation()}>
              {translate("button.delete")}
            </Button>
          </Popconfirm>
        </div>
      </div>
    </Wrapper>
  );
};

export default McpServerItem;
