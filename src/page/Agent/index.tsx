import { lazy, Suspense, useState, useEffect, useMemo } from "react";
import { connect } from "react-redux";
import { Spin, Tabs, Tooltip } from "antd";
import { RootState } from "@/redux/store";
import { actSetLLMProvider, LLMProvider } from "@/redux/agent";
import { IPreference } from "@/electron/type";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import claudeLogo from "@/asset/claude.webp";
import openaiLogo from "@/asset/openai.webp";
import geminiLogo from "@/asset/gemini.webp";
import { EMPTY_STRING } from "@/config/constant";
import { Wrapper } from "./style";
import ChatAgent from "./ChatAgent";

const McpServerManager = lazy(() => import("./McpServerManager"));
const SkillsManager = lazy(() => import("./SkillsManager"));

const TAB = {
  AGENT: "AGENT",
  MCP_SERVER: "MCP_SERVER",
  SKILLS: "SKILLS",
};

const PROVIDERS: {
  key: LLMProvider;
  labelKey: string;
  icon: string;
  apiKeyField: keyof IPreference;
  modelField: keyof IPreference;
}[] = [
  {
    key: LLMProvider.CLAUDE,
    labelKey: "agent.providerClaude",
    icon: claudeLogo,
    apiKeyField: "anthropicApiKey",
    modelField: "anthropicModel",
  },
  {
    key: LLMProvider.OPENAI,
    labelKey: "agent.providerOpenAI",
    icon: openaiLogo,
    apiKeyField: "openAIApiKey",
    modelField: "openAIModel",
  },
  {
    key: LLMProvider.GEMINI,
    labelKey: "agent.providerGemini",
    icon: geminiLogo,
    apiKeyField: "googleGeminiApiKey",
    modelField: "googleGeminiModel",
  },
];

const AgentPage = (props: any) => {
  const { llmProvider, actSetLLMProvider, preference, agentStatsFromReady } =
    props;
  const currentProvider = llmProvider || LLMProvider.CLAUDE;
  const { translate } = useTranslation();

  const [activeTab, setActiveTab] = useState(TAB.AGENT);
  const [encryptKey, setEncryptKey] = useState("");
  /** Defer heavy content so route change and shell paint immediately. */
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    setEncryptKey("");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setContentReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  const onChangeTab = (key: string) => {
    setActiveTab(key);
  };

  const isProviderConfigured = (provider: (typeof PROVIDERS)[number]) => {
    return (
      Boolean(preference?.[provider.apiKeyField]) &&
      Boolean(preference?.[provider.modelField])
    );
  };

  const onSelectProvider = (provider: LLMProvider) => {
    if (provider === currentProvider) return;
    actSetLLMProvider(provider);
  };

  const currentModelName = useMemo(() => {
    const providerKey = currentProvider as LLMProvider;
    const provider = PROVIDERS.find((p) => p.key === providerKey);
    if (!provider) return DEFAULT_LLM_MODELS[providerKey];
    return (
      (preference?.[provider.modelField] as string) ||
      DEFAULT_LLM_MODELS[providerKey]
    );
  }, [currentProvider, preference]);

  const agentStats = useMemo(() => {
    const subAgents = agentStatsFromReady?.subAgentsCount || 0;
    const tools = agentStatsFromReady?.toolsCount || 0;
    const skills = agentStatsFromReady?.skillsCount || 0;
    return { subAgents, tools, skills };
  }, [agentStatsFromReady]);

  return (
    <Wrapper>
      <div className="tab">
        <Tabs
          onChange={onChangeTab}
          size="small"
          items={[
            {
              key: TAB.AGENT,
              label: translate("agent.tabAgent"),
            },
            {
              key: TAB.MCP_SERVER,
              label: translate("agent.tabMcpServer"),
            },
            {
              key: TAB.SKILLS,
              label: translate("agent.tabAgentSkill"),
            },
          ]}
          activeKey={activeTab}
        />

        <div className="agent-status">
          <span
            className="agent-status__badge"
            title={translate("agent.subAgents")}
          >
            <span className="agent-status__value">
              {agentStats.subAgents || EMPTY_STRING}
            </span>
            <span className="agent-status__label">
              {translate("agent.subAgents")}
            </span>
          </span>

          <span
            className="agent-status__badge"
            title={translate("agent.tools")}
          >
            <span className="agent-status__value">
              {agentStats.tools || EMPTY_STRING}
            </span>
            <span className="agent-status__label">
              {translate("agent.tools")}
            </span>
          </span>

          <span
            className="agent-status__badge"
            title={translate("agent.skills")}
          >
            <span className="agent-status__value">
              {agentStats.skills || EMPTY_STRING}
            </span>
            <span className="agent-status__label">
              {translate("agent.skills")}
            </span>
          </span>
        </div>

        <div className="list-provider">
          <span className="current-model">{currentModelName}</span>

          {PROVIDERS.map((provider) => {
            const isDisabled = !isProviderConfigured(provider);
            const providerLabel = translate(provider.labelKey);
            const tooltipTitle = isDisabled
              ? translate("agent.apiKeyNotConfigured").replace(
                  "{provider}",
                  providerLabel,
                )
              : providerLabel;

            return (
              <Tooltip key={provider.key} title={tooltipTitle}>
                <div
                  className={`provider-item ${currentProvider === provider.key ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                  onClick={() => !isDisabled && onSelectProvider(provider.key)}
                >
                  <img src={provider.icon} alt={providerLabel} />
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {!contentReady ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          <Spin size="small" />
        </div>
      ) : (
        <>
          {activeTab === TAB.AGENT && (
            <ChatAgent setEncryptKey={setEncryptKey} encryptKey={encryptKey} />
          )}
          {activeTab === TAB.MCP_SERVER && (
            <Suspense
              fallback={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "2rem",
                  }}
                >
                  <Spin />
                </div>
              }
            >
              <McpServerManager />
            </Suspense>
          )}
          {activeTab === TAB.SKILLS && (
            <Suspense
              fallback={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "2rem",
                  }}
                >
                  <Spin />
                </div>
              }
            >
              <SkillsManager />
            </Suspense>
          )}
        </>
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
