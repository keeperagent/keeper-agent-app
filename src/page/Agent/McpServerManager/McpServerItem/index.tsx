import { Popconfirm, Switch, Tooltip } from "antd";
import { IMcpServer, MCPServerStatus } from "@/electron/type";
import { EyeOpenIcon, TrashIcon } from "@/component/Icon";
import Status from "@/component/Status";
import { formatTime, trimText } from "@/service/util";
import { useTranslation } from "@/hook/useTranslation";
import { EMPTY_STRING } from "@/config/constant";
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
  const { locale, translate } = useTranslation();

  const statusContent =
    item.status === MCPServerStatus.CONNECTED
      ? translate("connected")
      : item.status === MCPServerStatus.ERROR
        ? translate("error")
        : translate("disconnected");
  const isConnected = item.status === MCPServerStatus.CONNECTED;
  const fullError =
    item.status === MCPServerStatus.ERROR ? item.lastError || "" : "";
  const showErrorTooltip =
    item.status === MCPServerStatus.ERROR && fullError.length > 0;
  const showToolCount = isConnected && Boolean(item.toolsCount);

  return (
    <Wrapper>
      <div className="item-dots-row" aria-hidden>
        <div className="item-dots">
          <span className="item-dot item-dot-red" />
          <span className="item-dot item-dot-yellow" />
          <span className="item-dot item-dot-green" />
        </div>
      </div>

      <div
        className="item-top-bar"
        role="button"
        tabIndex={0}
        onClick={() => onEdit(item)}
      >
        <span className="item-name">{item.name}</span>
        {showErrorTooltip ? (
          <Tooltip title={fullError} placement="topLeft">
            <span style={{ flexShrink: 0, display: "inline-block" }}>
              <Status
                content={statusContent}
                isSuccess={isConnected}
                style={{ flexShrink: 0 }}
              />
            </span>
          </Tooltip>
        ) : (
          <Status
            content={statusContent}
            isSuccess={isConnected}
            style={{ flexShrink: 0 }}
          />
        )}
      </div>

      <div
        className="item-center"
        role="button"
        tabIndex={0}
        onClick={() => onEdit(item)}
      >
        <div className="item-center-row">
          <span className="item-label">{translate("commandOrUrl")}:</span>
          <span className="item-value item-command-or-url">
            {item.commandOrUrl || ""}
          </span>
        </div>

        <div className="item-center-row">
          <span className="item-label">{translate("toolsCount")}:</span>
          <Tooltip title={translate("agent.viewTools")}>
            <span
              className="item-value item-tools-row"
              onClick={(e) => {
                e.stopPropagation();
                showToolCount && onViewTools(item);
              }}
            >
              {showToolCount
                ? `${item.toolsCount} ${translate("tools")}`
                : EMPTY_STRING}

              {showToolCount && (
                <div className="view-icon">
                  <EyeOpenIcon />
                </div>
              )}
            </span>
          </Tooltip>
        </div>

        <div className="item-center-row">
          <span className="item-label">{translate("description")}:</span>
          <span className="item-value item-description">
            {item?.description
              ? trimText(item?.description, 105)
              : EMPTY_STRING}
          </span>
        </div>
      </div>

      <div className="item-bottom-bar">
        <span className="item-updated">
          {translate("updatedAt")}:{" "}
          {item?.updateAt != null
            ? formatTime(Number(item.updateAt), locale)
            : "—"}
        </span>

        <div className="item-actions">
          <Popconfirm
            title={translate("agent.deleteMcpServer")}
            onConfirm={() => onDelete(item.id!)}
            okText={translate("yes")}
            cancelText={translate("no")}
          >
            <div className="btn-delete">
              <TrashIcon className="trash" />
            </div>
          </Popconfirm>

          <Switch
            size="small"
            checked={item.isEnabled}
            disabled={item?.id == null}
            onChange={() => item?.id != null && onToggle(item)}
          />
        </div>
      </div>
    </Wrapper>
  );
};

export default McpServerItem;
