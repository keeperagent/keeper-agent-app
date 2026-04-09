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
import { useUpdatePreference, useTranslation } from "@/hook";
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

  return (
    <KeeperMcpWrapper>
      <Row gutter={24} justify="space-between">
        <Col span={11}>
          <div className="item-wrapper">
            <div className="section-title">{translate("mcp.enableServer")}</div>
            <Switch
              checked={preference?.isMcpServerOn || false}
              onChange={onToggleMcpServer}
              loading={updatingPreference}
              checkedChildren={translate("yes")}
              unCheckedChildren={translate("no")}
            />
          </div>

          <div className="item-wrapper">
            <div className="section-title">{translate("mcp.serverStatus")}</div>

            <div className="status-wrapper">
              <Status
                content={
                  preference?.isMcpServerOn
                    ? translate("mcp.serverRunning")
                    : translate("mcp.serverStopped")
                }
                isSuccess={preference?.isMcpServerOn || false}
                isLarge={true}
              />
            </div>
          </div>

          <div className="item-wrapper">
            <div className="section-title">{translate("mcp.serverPort")}</div>

            <div className="port-row">
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
                size="medium"
              >
                {translate("save")}
              </Button>
            </div>
          </div>

          <div className="item-wrapper">
            <div className="section-title">{translate("mcp.howToConnect")}</div>
            <div className="connect-hint">
              <div className="code-wrapper">
                <Segmented
                  options={[
                    {
                      label: translate("mcp.normalConfig"),
                      value: "normal",
                    },
                    {
                      label: translate("mcp.mcpRemoteConfig"),
                      value: "mcpRemote",
                    },
                  ]}
                  value={configType}
                  onChange={(value) => setConfigType(value as ConfigType)}
                  style={{ marginBottom: "var(--margin-bottom)" }}
                />

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
