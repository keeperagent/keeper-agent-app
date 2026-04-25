import { lazy, Suspense, useState, useEffect, useMemo, Fragment } from "react";
import AnimatedNumber from "react-animated-numbers";
import { connect } from "react-redux";
import { Spin, Tabs, Tooltip } from "antd";
import { RootState } from "@/redux/store";
import { actSetLLMProvider, LLMProvider } from "@/redux/agent";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { useAgentReadyStats } from "@/hook/agent";
import { useUpdatePreference } from "@/hook/preference";
import { LLM_PROVIDERS, isProviderConfigured } from "@/config/llmProviders";
import { Wrapper, StatBadgeWrapper, CliTag, AgentHubTabWrapper } from "./style";
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
  const { llmProvider, actSetLLMProvider, preference, agentStatsFromReady } =
    props;
  const currentProvider = llmProvider || LLMProvider.CLAUDE;
  const { translate } = useTranslation();
  const { updatePreference } = useUpdatePreference();

  const [activeTab, setActiveTab] = useState(TAB.AGENT);
  const [encryptKey, setEncryptKey] = useState("");
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    setEncryptKey("");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setContentReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useAgentReadyStats(activeTab !== TAB.AGENT);

  const onChangeTab = (key: string) => {
    setActiveTab(key);
  };

  const onSelectProvider = (provider: LLMProvider) => {
    if (provider === currentProvider) {
      return;
    }
    actSetLLMProvider(provider);
    updatePreference({ id: preference?.id, llmProvider: provider });
  };

  const currentModelName = useMemo(() => {
    const providerKey = currentProvider as LLMProvider;
    const provider = LLM_PROVIDERS.find((p) => p.key === providerKey);
    if (!provider) {
      return DEFAULT_LLM_MODELS[providerKey];
    }

    return (
      (preference?.[provider.modelField] as string) ||
      DEFAULT_LLM_MODELS[providerKey]
    );
  }, [currentProvider, preference]);

  const isClaudeCLIActive =
    currentProvider === LLMProvider.CLAUDE && Boolean(preference?.useClaudeCLI);
  const isCodexCLIActive =
    currentProvider === LLMProvider.OPENAI && Boolean(preference?.useCodexCLI);

  const agentStats = useMemo(() => {
    const subAgents = agentStatsFromReady?.subAgentsCount || 0;
    const tools = agentStatsFromReady?.toolsCount || 0;
    const skills = agentStatsFromReady?.skillsCount || 0;

    return { subAgents, tools, skills };
  }, [agentStatsFromReady]);

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
                count={agentStats.subAgents}
                label={translate("agent.subAgents")}
              />
              <AgentStatBadge
                count={agentStats.tools}
                label={translate("agent.tools")}
              />
              <AgentStatBadge
                count={agentStats.skills}
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
            <AgentHubTabWrapper>
              <AgentProfileManager />
            </AgentHubTabWrapper>
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
    llmProvider: state?.Agent?.llmProvider,
    preference: state?.Preference?.preference,
    agentStatsFromReady: state?.Agent?.agentStats || null,
  }),
  { actSetLLMProvider },
)(AgentPage);
