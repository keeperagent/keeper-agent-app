import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Tabs } from "antd";
import { actSetPageName } from "@/redux/layout";
import { useTranslation } from "@/hook/useTranslation";
import AgentAnalytic from "@/component/AgentAnalytic";
import ListAgent from "./ListAgent";
import { Wrapper } from "./style";

const TAB = {
  AGENTS: "AGENTS",
  ANALYTICS: "ANALYTICS",
};

const AgentHubPage = (props: any) => {
  const { actSetPageName } = props;
  const { translate } = useTranslation();
  const [activeTab, setActiveTab] = useState(TAB.AGENTS);
  const [isChatRegistryOpen, setIsChatRegistryOpen] = useState(false);

  useEffect(() => {
    actSetPageName(translate("sidebar.agentHub"));
  }, [translate]);

  const onChangeTab = (key: string) => {
    setActiveTab(key);
  };

  return (
    <Wrapper>
      {!isChatRegistryOpen && (
        <div className="tab">
          <Tabs
            onChange={onChangeTab}
            size="small"
            activeKey={activeTab}
            items={[
              { key: TAB.AGENTS, label: translate("agentHub.tab.agent") },
              { key: TAB.ANALYTICS, label: translate("agentHub.tab.analytics") },
            ]}
          />
        </div>
      )}

      {activeTab === TAB.AGENTS && (
        <ListAgent onChatRegistryOpenChange={setIsChatRegistryOpen} />
      )}
      {activeTab === TAB.ANALYTICS && (
        <AgentAnalytic showToolbar showStatStrip defaultPeriod={7} />
      )}
    </Wrapper>
  );
};

export default connect(() => ({}), { actSetPageName })(AgentHubPage);
