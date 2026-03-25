import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Row, Col, Tabs, Divider } from "antd";
import { useTranslation, useGetPreference } from "@/hook";
import { actSetPageName } from "@/redux/layout";
import { Wrapper } from "./style";
import ConnectTelegram from "./ConnectTelegram";
import ConnectWhatsApp from "./ConnectWhatsApp";
import ImportDatabase from "./ImportDatabase";
import ExportDatabase from "./ExportDatabase";
import Other from "./Other";
import LanguageModel from "./LanguageModel";
import WebSearch from "./WebSearch";
import KeeperMcp from "./KeeperMcp";

const TAB = {
  GENERAL_SETTING: "GENERAL_SETTING",
  AGENT_SETTING: "AGENT_SETTING",
  KEEPER_MCP: "KEEPER_MCP",
  DATABASE_SETTING: "DATABASE_SETTING",
};

const SettingPage = (props: any) => {
  const { translate } = useTranslation();
  const { getPreference } = useGetPreference();
  const [activeTab, setActiveTab] = useState(TAB.GENERAL_SETTING);

  useEffect(() => {
    getPreference();
  }, []);

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.preference"));
  }, [translate]);

  const onChangeTab = (key: string) => {
    setActiveTab(key);
  };

  return (
    <Wrapper>
      <title>{translate("sidebar.preference")}</title>

      <div className="tab">
        <Tabs
          onChange={onChangeTab}
          size="small"
          items={[
            {
              key: TAB.GENERAL_SETTING,
              label: translate("setting.general"),
            },
            {
              key: TAB.AGENT_SETTING,
              label: translate("setting.agent"),
            },
            {
              key: TAB.KEEPER_MCP,
              label: translate("setting.keeperMcp"),
            },
            {
              key: TAB.DATABASE_SETTING,
              label: translate("setting.database"),
            },
          ]}
          activeKey={activeTab}
        />
      </div>

      {activeTab === TAB.GENERAL_SETTING && (
        <Row style={{ width: "100%" }} justify="space-between">
          <Col span={7}>
            <div className="form">
              <div className="heading">
                <span>{translate("setting.connectTelegram")}</span>
              </div>
              <ConnectTelegram />
            </div>

            <Divider />

            <div className="form">
              <div className="heading">
                <span>{translate("setting.connectWhatsApp")}</span>
              </div>
              <ConnectWhatsApp />
            </div>

            <Divider />
          </Col>

          <Col span={7}>
            <div className="form">
              <div className="heading">
                <span>{translate("setting.otherSetting")}</span>
              </div>
              <Other />
            </div>
          </Col>

          <Col span={7}></Col>
        </Row>
      )}

      {activeTab === TAB.AGENT_SETTING && (
        <Row style={{ width: "100%" }} justify="space-between">
          <Col span={7}>
            <div className="form">
              <div className="heading">
                <span>{translate("setting.languageModel")}</span>
              </div>

              <LanguageModel />
            </div>
          </Col>

          <Col span={7}>
            <div className="form">
              <div className="heading">
                <span>{translate("setting.webSearch")}</span>
              </div>
              <WebSearch />
            </div>
          </Col>

          <Col span={7}></Col>
        </Row>
      )}

      {activeTab === TAB.DATABASE_SETTING && (
        <Row style={{ width: "100%" }} justify="space-between">
          <Col span={7}>
            <div className="form">
              <div className="heading">{translate("setting.syncData")}</div>
              <ImportDatabase />
            </div>
          </Col>

          <Col span={7}>
            <div className="form">
              <div className="heading">{translate("setting.exportData")}</div>
              <ExportDatabase />
            </div>
          </Col>

          <Col span={7}></Col>
        </Row>
      )}

      {activeTab === TAB.KEEPER_MCP && <KeeperMcp />}
    </Wrapper>
  );
};

export default connect(() => ({}), { actSetPageName })(SettingPage);
