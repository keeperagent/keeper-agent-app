import { lazy, Suspense, useState, useEffect, useMemo, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import AnimatedNumber from "react-animated-numbers";
import { connect } from "react-redux";
import { Spin, Tabs, Tooltip } from "antd";
import { RootState } from "@/redux/store";
import { actSaveSelectedAgentProfile, LLMProvider } from "@/redux/agent";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { useAgentReadyStats } from "@/hook/agent";
import { useUpdateAgentProfile } from "@/hook/agentProfile";
import { LLM_PROVIDERS, isProviderConfigured } from "@/config/llmProviders";
import { IAgentProfile } from "@/electron/type";
import { Wrapper, StatBadgeWrapper, CliTag } from "./style";
import ChatView from "./ChatView";

const AgentProfileManager = lazy(() => import("./AgentProfileManager"));
const McpServerManager = lazy(() => import("./McpServerManager"));
const SkillsManager = lazy(() => import("./SkillsManager"));
const ToolsManager = lazy(() => import("./ToolsManager"));
const AgentAnalytic = lazy(() => import("@/component/AgentAnalytic"));

const AgentStatBadge = ({ count, label }: { count: number; label: string }) => (
  <StatBadgeWrapper title={label}>
    <span className="value">
      <AnimatedNumber animateToNumber={count} />
    </span>
    <span className="label">{label}</span>
  </StatBadgeWrapper>
);

const TabFallback = (
  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
    <Spin />
  </div>
);

const TAB = {
  AGENT: "AGENT",
  AGENTS: "AGENTS",
  MCP_SERVER: "MCP_SERVER",
  SKILLS: "SKILLS",
  TOOLS: "TOOLS",
  ANALYTIC: "ANALYTIC",
};

const AgentPage = (props: any) => {
  const {
    actSaveSelectedAgentProfile,
    preference,
    agentStats,
    selectedAgentProfile,
  } = props;
  const { translate } = useTranslation();
  const { updateAgentProfile } = useUpdateAgentProfile();

  const currentProvider =
    (selectedAgentProfile?.llmProvider as LLMProvider) || LLMProvider.CLAUDE;

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || TAB.AGENT,
  );
  const [encryptKey, setEncryptKey] = useState("");
  const [contentReady, setContentReady] = useState(false);
  const [modelByProvider, setModelByProvider] = useState<
    Partial<Record<LLMProvider, string>>
  >({});

  useEffect(() => {
    setEncryptKey("");
  }, []);

  useEffect(() => {
    setModelByProvider({});
  }, [selectedAgentProfile?.id]);

  useEffect(() => {
    const timer = setTimeout(() => setContentReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useAgentReadyStats(activeTab !== TAB.AGENT);

  const onChangeTab = (key: string) => {
    setActiveTab(key);
  };

  const onOpenProfileChat = (profile: IAgentProfile) => {
    actSaveSelectedAgentProfile(profile);
    setActiveTab(TAB.AGENT);
  };

  const resolveModelForProvider = (provider: LLMProvider): string => {
    const providerConfig = LLM_PROVIDERS.find((p) => p.key === provider);
    if (!providerConfig) {
      return DEFAULT_LLM_MODELS[provider];
    }
    return (
      (preference?.[providerConfig.modelField] as string) ||
      DEFAULT_LLM_MODELS[provider]
    );
  };

  const onSelectProvider = (provider: LLMProvider) => {
    if (provider === currentProvider || !selectedAgentProfile) {
      return;
    }
    const savedModelByProvider = {
      ...modelByProvider,
      [currentProvider]:
        selectedAgentProfile.llmModel ||
        resolveModelForProvider(currentProvider),
    };
    setModelByProvider(savedModelByProvider);
    updateAgentProfile({
      ...selectedAgentProfile,
      llmProvider: provider,
      llmModel:
        savedModelByProvider[provider] || resolveModelForProvider(provider),
    });
  };

  const currentModelName = useMemo(() => {
    if (selectedAgentProfile?.llmModel) {
      return selectedAgentProfile.llmModel;
    }
    return resolveModelForProvider(currentProvider);
  }, [selectedAgentProfile, currentProvider, preference]);

  const isClaudeCLIActive =
    currentProvider === LLMProvider.CLAUDE && Boolean(preference?.useClaudeCLI);
  const isCodexCLIActive =
    currentProvider === LLMProvider.OPENAI && Boolean(preference?.useCodexCLI);

  return (
    <Wrapper
      style={{
        height: activeTab !== TAB.AGENT ? "100%" : "calc(100vh - 6.9rem)",
      }}
    >
      <div className="tab">
        <Tabs
          onChange={onChangeTab}
          size="medium"
          items={[
            {
              key: TAB.AGENT,
              label: translate("agent.tabAgent"),
            },
            {
              key: TAB.AGENTS,
              label: translate("agent.tabAgents"),
            },
            {
              key: TAB.MCP_SERVER,
              label: translate("agent.tabMcpServer"),
            },
            {
              key: TAB.SKILLS,
              label: translate("agent.tabAgentSkill"),
            },
            {
              key: TAB.TOOLS,
              label: translate("agent.tabTools"),
            },
            {
              key: TAB.ANALYTIC,
              label: translate("agent.tabAnalytic"),
            },
          ]}
          activeKey={activeTab}
        />

        {activeTab === TAB.AGENT && (
          <Fragment>
            <div className="agent-status">
              <AgentStatBadge
                count={agentStats?.subAgentsCount || 0}
                label={translate("agent.subAgents")}
              />
              <AgentStatBadge
                count={agentStats?.toolsCount || 0}
                label={translate("agent.tools")}
              />
              <AgentStatBadge
                count={agentStats?.skillsCount || 0}
                label={translate("agent.skills")}
              />
            </div>

            <div className="list-provider">
              <span
                className="model-name-wrapper"
                style={{
                  marginRight:
                    isClaudeCLIActive || isCodexCLIActive ? "1.5rem" : 0,
                }}
              >
                <span className="current-model">{currentModelName}</span>
                {(isClaudeCLIActive || isCodexCLIActive) && (
                  <CliTag color="cyan">CLI</CliTag>
                )}
              </span>

              {LLM_PROVIDERS.map((provider) => {
                const isDisabled = !isProviderConfigured(provider, preference);
                const tooltipTitle = isDisabled
                  ? translate("agent.apiKeyNotConfigured").replace(
                      "{provider}",
                      provider.label,
                    )
                  : provider.label;

                return (
                  <Tooltip key={provider.key} title={tooltipTitle}>
                    <div
                      className={`provider-item ${currentProvider === provider.key ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                      onClick={() =>
                        !isDisabled && onSelectProvider(provider.key)
                      }
                    >
                      <img src={provider.icon} alt={provider.label} />
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </Fragment>
        )}
      </div>

      {!contentReady ? (
        <div className="loading-container">
          <Spin size="small" />
        </div>
      ) : (
        <Fragment>
          {activeTab === TAB.AGENT && (
            <ChatView setEncryptKey={setEncryptKey} encryptKey={encryptKey} />
          )}

          {activeTab === TAB.AGENTS && (
            <Suspense fallback={TabFallback}>
              <AgentProfileManager onOpenChat={onOpenProfileChat} />
            </Suspense>
          )}

          {activeTab === TAB.MCP_SERVER && (
            <Suspense fallback={TabFallback}>
              <McpServerManager />
            </Suspense>
          )}

          {activeTab === TAB.SKILLS && (
            <Suspense fallback={TabFallback}>
              <SkillsManager />
            </Suspense>
          )}

          {activeTab === TAB.TOOLS && (
            <Suspense fallback={TabFallback}>
              <ToolsManager />
            </Suspense>
          )}

          {activeTab === TAB.ANALYTIC && (
            <Suspense fallback={TabFallback}>
              <AgentAnalytic showToolbar showStatStrip defaultPeriod={7} />
            </Suspense>
          )}
        </Fragment>
      )}
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    preference: state?.Preference?.preference,
    agentStats: state?.Agent?.agentStats || null,
    selectedAgentProfile: state?.Agent?.selectedAgentProfile || null,
  }),
  { actSaveSelectedAgentProfile },
)(AgentPage);
