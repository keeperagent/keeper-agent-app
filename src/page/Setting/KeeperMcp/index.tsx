import { useEffect, useState } from "react";
import { connect } from "react-redux";
import {
  Button,
  Switch,
  InputNumber,
  message,
  Tooltip,
  Row,
  Col,
  Segmented,
} from "antd";
import { RootState } from "@/redux/store";
import { IPreference } from "@/electron/type";
import {
  useUpdatePreference,
  useTranslation,
  useInstallToClaudeCode,
} from "@/hook";
import copy from "copy-to-clipboard";
import { Status, CodeEditor } from "@/component";
import { CopyIcon, CheckIcon } from "@/component/Icon";
import { DEFAULT_MCP_PORT } from "@/electron/constant";
import { ListAuthToken } from "./ListAuthToken";
import { KeeperMcpWrapper } from "./style";

type IProps = {
  preference: IPreference | null;
  isLightMode: boolean;
};

type ConfigType = "normal" | "mcpRemote";

const KeeperMcp = ({ preference, isLightMode }: IProps) => {
  const { translate } = useTranslation();
  const { updatePreference, loading: updatingPreference } =
    useUpdatePreference();
  const { installToClaudeCode, loading: installingToClaudeCode } =
    useInstallToClaudeCode();
  const [configType, setConfigType] = useState<ConfigType>("normal");
  const [port, setPort] = useState<number>(
    preference?.mcpServerPort || DEFAULT_MCP_PORT,
  );
  const [isCopiedConfig, setCopiedConfig] = useState(false);

  useEffect(() => {
    setPort(preference?.mcpServerPort || DEFAULT_MCP_PORT);
  }, [preference]);

  const onToggleMcpServer = async (checked: boolean) => {
    await updatePreference({
      id: preference?.id,
      isMcpServerOn: checked,
      mcpServerPort: port,
    });
  };

  const onSavePort = async () => {
    await updatePreference({
      id: preference?.id,
      mcpServerPort: port,
    });
    message.success(translate("updateSuccess"));
  };

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        "keeper-agent": {
          url: `http://127.0.0.1:${port}/mcp`,
          headers: {
            Authorization: "Bearer <your-token>",
          },
        },
      },
    },
    null,
    2,
  );

  const mcpConfigWithMcpRemote = JSON.stringify(
    {
      mcpServers: {
        "keeper-agent": {
          command: "npx",
          args: [
            "mcp-remote",
            `http://127.0.0.1:${port}/mcp`,
            "--header",
            "Authorization: Bearer <your-token>",
          ],
        },
      },
    },
    null,
    2,
  );

  const onCopyConfig = () => {
    copy(configType === "normal" ? mcpConfig : mcpConfigWithMcpRemote);
    message.success(translate("copied"));
    setCopiedConfig(true);
    setTimeout(() => {
      setCopiedConfig(false);
    }, 1500);
  };

  const onInstallToClaudeCode = async () => {
    const result = await installToClaudeCode();
    if (result.success) {
      message.success(translate("mcp.installToClaudeCodeSuccess"));
    } else {
      message.error(translate("mcp.installToClaudeCodeError"));
    }
  };

  return (
    <KeeperMcpWrapper>
      <Row gutter={24} justify="space-between">
        <Col span={11}>
          <div className="section-label">{translate("mcp.serverSettings")}</div>

          <div className="server-card">
            <div className="card-row">
              <div className="row-label">{translate("mcp.enableServer")}</div>
              <div className="row-control">
                <Status
                  content={
                    preference?.isMcpServerOn
                      ? translate("mcp.serverRunning")
                      : translate("mcp.serverStopped")
                  }
                  isSuccess={preference?.isMcpServerOn || false}
                />

                <Switch
                  checked={preference?.isMcpServerOn || false}
                  onChange={onToggleMcpServer}
                  loading={updatingPreference}
                  checkedChildren={translate("yes")}
                  unCheckedChildren={translate("no")}
                />
              </div>
            </div>

            <div className="card-row">
              <div className="row-label">{translate("mcp.serverPort")}</div>
              <div className="row-control">
                <InputNumber
                  className="port-input custom-input"
                  value={port}
                  onChange={(value) => setPort(value || DEFAULT_MCP_PORT)}
                  min={1024}
                  max={65535}
                  placeholder={translate("mcp.serverPortPlaceholder")}
                  size="large"
                />
                <Button
                  onClick={onSavePort}
                  loading={updatingPreference}
                  type="primary"
                  size="middle"
                >
                  {translate("save")}
                </Button>
              </div>
            </div>
          </div>

          <div className="cli-section">
            <div className="cli-text">
              <div className="cli-title">
                {translate("mcp.installToClaudeCode")}
              </div>
              <div className="cli-desc">
                {translate("mcp.claudeCodeCliDesc")}
              </div>
            </div>

            <Button
              className="cli-button"
              onClick={onInstallToClaudeCode}
              loading={installingToClaudeCode}
              type="primary"
              size="middle"
            >
              {translate("mcp.installToClaudeCodeBtn")}
            </Button>
          </div>

          <div className="config-section">
            <div className="section-label">{translate("mcp.manualConfig")}</div>
            <Segmented
              options={[
                { label: translate("mcp.normalConfig"), value: "normal" },
                { label: translate("mcp.mcpRemoteConfig"), value: "mcpRemote" },
              ]}
              value={configType}
              onChange={(value) => setConfigType(value as ConfigType)}
              style={{ marginBottom: "var(--margin-bottom)" }}
            />

            <div className="code-wrapper">
              <CodeEditor
                value={
                  configType === "normal" ? mcpConfig : mcpConfigWithMcpRemote
                }
                language="json"
                readOnly
                height={configType === "normal" ? "19rem" : "25rem"}
                fontSize={13}
                theme={isLightMode ? "light" : "dark"}
              />
              <Tooltip title={translate("copy")} placement="top">
                {isCopiedConfig ? (
                  <div className="icon copied">
                    <CheckIcon />
                  </div>
                ) : (
                  <div className="icon" onClick={onCopyConfig}>
                    <CopyIcon />
                  </div>
                )}
              </Tooltip>
            </div>
          </div>
        </Col>

        <Col span={12}>
          <ListAuthToken />
        </Col>
      </Row>
    </KeeperMcpWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    preference: state?.Preference?.preference,
    isLightMode: state?.Layout?.isLightMode,
  }),
  {},
)(KeeperMcp);
