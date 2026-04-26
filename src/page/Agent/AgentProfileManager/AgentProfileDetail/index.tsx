import { useState, useMemo } from "react";
import { Button, Tabs } from "antd";
import { BackIcon } from "@/component/Icon";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { IAgentProfile, ICampaign } from "@/electron/type";
import { agentProfileSelector } from "@/redux/agentProfile";
import { useTranslation } from "@/hook/useTranslation";
import { LLM_PROVIDERS } from "@/config/llmProviders";
import { listChainConfig } from "@/page/Agent/config";
import HistoryTab from "./HistoryTab";
import MemoryTab from "./MemoryTab";
import SystemPromptTab from "./SystemPromptTab";
import { Wrapper, ContextChip } from "./style";

const TAB = {
  HISTORY: "HISTORY",
  MEMORY: "MEMORY",
  SYSTEM_PROMPT: "SYSTEM_PROMPT",
};

type Props = {
  agentProfileId: number;
  onBack: () => void;
  onOpenChat?: (profile: IAgentProfile) => void;
  selectedAgentProfile?: IAgentProfile | null;
  listCampaign?: ICampaign[];
};

const AgentProfileDetail = (props: Props) => {
  const {
    agentProfileId,
    onBack,
    onOpenChat,
    selectedAgentProfile,
    listCampaign,
  } = props;
  const { translate } = useTranslation();

  const [activeTab, setActiveTab] = useState(
    selectedAgentProfile?.isMainAgent ? TAB.MEMORY : TAB.HISTORY,
  );
  const effectiveTab =
    selectedAgentProfile?.isMainAgent && activeTab === TAB.HISTORY
      ? TAB.MEMORY
      : activeTab;

  const provider = LLM_PROVIDERS.find(
    (item) => item.key === selectedAgentProfile?.llmProvider,
  );

  const chainConfig = useMemo(() => {
    if (!selectedAgentProfile?.chainKey) {
      return null;
    }
    return (
      listChainConfig.find(
        (config) => config.dexscreenerKey === selectedAgentProfile.chainKey,
      ) || null
    );
  }, [selectedAgentProfile?.chainKey]);

  const campaign = useMemo(() => {
    if (!selectedAgentProfile?.campaignId) {
      return null;
    }
    return (
      (listCampaign || []).find(
        (item) => item.id === selectedAgentProfile.campaignId,
      ) || null
    );
  }, [listCampaign, selectedAgentProfile?.campaignId]);

  const walletLabel = useMemo(() => {
    if (!selectedAgentProfile?.campaignId) {
      return null;
    }
    const profileIds = selectedAgentProfile?.profileIds || [];
    if (selectedAgentProfile?.isAllWallet === true || profileIds.length === 0) {
      return translate("agent.allWallet");
    }
    return `${profileIds.length} ${translate("agent.wallets")}`;
  }, [selectedAgentProfile]);

  const agentName = selectedAgentProfile?.name || `Agent #${agentProfileId}`;

  return (
    <Wrapper>
      <div className="chat-header">
        <div className="chat-header-top">
          <Button type="text" onClick={onBack} className="btn-back">
            <span className="btn-back-icon">
              <BackIcon />
            </span>
            {translate("back")}
          </Button>

          {chainConfig && (
            <img
              className="chain-logo"
              src={chainConfig.logo}
              alt={chainConfig.chainName}
            />
          )}

          <div className="chat-agent-info">
            <span className="chat-agent-name">{agentName}</span>
            {selectedAgentProfile?.description && (
              <span className="chat-agent-desc">
                {selectedAgentProfile.description}
              </span>
            )}
          </div>

          {onOpenChat && selectedAgentProfile && (
            <Button
              type="primary"
              size="large"
              onClick={() => onOpenChat(selectedAgentProfile)}
            >
              {translate("agent.chat")}
            </Button>
          )}

          {provider && (
            <ContextChip>
              {provider.icon && (
                <img src={provider.icon} alt={provider.label} />
              )}
              <div className="chip-lines">
                <span className="chip-label">{provider.label}</span>
                {selectedAgentProfile?.llmModel && (
                  <span className="chip-value">
                    {selectedAgentProfile.llmModel}
                  </span>
                )}
              </div>
            </ContextChip>
          )}

          {campaign && (
            <ContextChip>
              <div className="chip-lines">
                <span className="chip-label">
                  {translate("sidebar.campaign")}
                </span>
                <span className="chip-value">{campaign.name}</span>
              </div>
            </ContextChip>
          )}

          {walletLabel && (
            <ContextChip>
              <div className="chip-lines">
                <span className="chip-label">
                  {translate("agent.walletProfiles")}
                </span>
                <span className="chip-value">{walletLabel}</span>
              </div>
            </ContextChip>
          )}
        </div>

        <Tabs
          size="small"
          activeKey={effectiveTab}
          onChange={setActiveTab}
          items={[
            ...(!selectedAgentProfile?.isMainAgent
              ? [{ key: TAB.HISTORY, label: translate("agent.history") }]
              : []),
            { key: TAB.MEMORY, label: translate("agent.memory") },
            {
              key: TAB.SYSTEM_PROMPT,
              label: translate("agent.systemPrompt"),
            },
          ]}
          className="chat-tabs"
        />
      </div>

      <div className="chat-body">
        {effectiveTab === TAB.HISTORY && (
          <HistoryTab agentProfileId={agentProfileId} />
        )}

        {effectiveTab === TAB.MEMORY && (
          <MemoryTab agentProfileId={agentProfileId} />
        )}

        {effectiveTab === TAB.SYSTEM_PROMPT && selectedAgentProfile && (
          <SystemPromptTab profile={selectedAgentProfile} />
        )}
      </div>
    </Wrapper>
  );
};

export default connect((state: RootState) => ({
  selectedAgentProfile: agentProfileSelector(state).selectedAgentProfile,
  listCampaign: state?.Campaign?.listCampaign || [],
}))(AgentProfileDetail);
