import { useEffect, useState } from "react";
import { Modal, Switch, Table, Tooltip } from "antd";
import { MESSAGE } from "@/electron/constant";
import { useTranslation } from "@/hook/useTranslation";
import { EMPTY_STRING } from "@/config/constant";
import { trimText } from "@/service/util";

type McpToolInfo = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

type ModalMcpServerToolsProps = {
  open: boolean;
  serverId: number;
  serverName: string;
  config: string;
  disabledTools: string[];
  onToggleTool: (toolName: string, disabled: boolean) => void;
  onClose: () => void;
};

const ModalMcpServerTools = (props: ModalMcpServerToolsProps) => {
  const { open, serverId, serverName, config, disabledTools, onToggleTool, onClose } = props;
  const { translate } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<McpToolInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || serverId == null || !serverName || !config) {
      setTools([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    window?.electron?.send(MESSAGE.GET_MCP_SERVER_TOOLS, {
      serverId,
      serverName,
      config,
    });

    const handler = (
      _: any,
      payload: { data?: McpToolInfo[]; error?: string },
    ) => {
      setLoading(false);
      setTools(payload?.data || []);
      setError(payload?.error || null);
    };
    window?.electron?.on(MESSAGE.GET_MCP_SERVER_TOOLS_RES, handler);
    return () => {
      window?.electron?.removeAllListeners(MESSAGE.GET_MCP_SERVER_TOOLS_RES);
    };
  }, [open, serverId, serverName, config]);

  const columns = [
    {
      title: translate("indexTable"),
      dataIndex: "index",
      key: "index",
      width: "7rem",
    },
    {
      title: translate("agent.toolName"),
      dataIndex: "name",
      key: "name",
      width: "25%",
      ellipsis: true,
      render: (v: string) => v || EMPTY_STRING,
    },
    {
      title: translate("description"),
      dataIndex: "description",
      key: "description",
      width: "40%",
      render: (v: string) => v || EMPTY_STRING,
    },
    {
      title: translate("agent.parameters"),
      key: "inputSchema",
      render: (_: unknown, row: McpToolInfo) => {
        const params = row.inputSchema
          ? JSON.stringify(row.inputSchema)
          : EMPTY_STRING;
        const maxLength = 25;
        const display = trimText(params, maxLength);

        if (params.length > maxLength) {
          const pretty = JSON.stringify(row.inputSchema, null, 2);
          const preStyle: React.CSSProperties = {
            padding: "1.1rem 1.5rem",
            fontSize: "1.2rem",
            maxWidth: "50rem",
            maxHeight: "35rem",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: "#d4d4d4",
            borderRadius: "0.8rem",
          };

          return (
            <Tooltip
              title={<pre style={preStyle}>{pretty}</pre>}
              overlayStyle={{ maxWidth: "50rem" }}
              overlayInnerStyle={{
                padding: 0,
              }}
            >
              <span>{display}</span>
            </Tooltip>
          );
        }
        return display;
      },
    },
    {
      title: translate("agent.toolEnabled"),
      key: "enabled",
      width: "9rem",
      render: (_: unknown, row: McpToolInfo) => {
        const isEnabled = !disabledTools.includes(row.name);
        return (
          <Switch
            size="small"
            checked={isEnabled}
            onChange={(checked) => onToggleTool(row.name, !checked)}
          />
        );
      },
    },
  ];

  const dataSource = tools.map((tool, index) => ({
    ...tool,
    index: index + 1,
  }));

  return (
    <Modal
      title={`${translate("agent.availableTools")} - ${serverName}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width="120rem"
      destroyOnHidden
      style={{ top: "6rem" }}
    >
      {error && (
        <div style={{ color: "var(--color-error)", marginBottom: 8 }}>
          {error}
        </div>
      )}

      <Table
        size="small"
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowKey="name"
        pagination={{ pageSize: 20 }}
        scroll={{ x: "100rem", y: "60rem" }}
      />
    </Modal>
  );
};

export default ModalMcpServerTools;
