import { Popconfirm } from "antd";
import { IAgentProfile } from "@/electron/type";
import { TrashIcon } from "@/component/Icon";
import { trimText, formatTime } from "@/service/util";
import { useTranslation } from "@/hook/useTranslation";
import { EMPTY_STRING } from "@/config/constant";
import { LLM_PROVIDERS } from "@/config/llmProviders";
import Status from "@/component/Status";
import { listChainConfig } from "@/page/Agent/config";
import { Wrapper, ProviderBadge } from "./style";

type Props = {
  profile: IAgentProfile;
  onEdit: (profile: IAgentProfile) => void;
  onDelete: (profile: IAgentProfile) => void;
  onOpenChat: (profile: IAgentProfile) => void;
};

const AgentProfileCard = (props: Props) => {
  const { profile, onEdit, onDelete, onOpenChat } = props;
  const { translate, locale } = useTranslation();

  const provider = LLM_PROVIDERS.find(
    (item) => item.key === profile?.llmProvider,
  );
  const providerLabel = provider?.label || EMPTY_STRING;
  const providerIcon = provider?.icon || EMPTY_STRING;
  const modelLabel = profile.llmModel
    ? trimText(profile.llmModel, 24)
    : EMPTY_STRING;

  const chainConfig = profile.chainKey
    ? listChainConfig.find(
        (config) => config.dexscreenerKey === profile.chainKey,
      ) || null
    : null;

  const allowedToolCount = profile.allowedBaseTools?.length || 0;
  const allowedSkillCount = profile.allowedSkillIds?.length || 0;

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
        onClick={() => onEdit(profile)}
      >
        {chainConfig && (
          <img
            className="item-chain-logo"
            src={chainConfig.logo}
            alt={chainConfig.chainName}
          />
        )}

        <span className="item-name">{profile.name}</span>

        {profile.isMainAgent && (
          <span className="item-main-badge">
            {translate("agent.mainAgent")}
          </span>
        )}

        <Status
          content={
            profile.isActive ? translate("active") : translate("inActive")
          }
          isSuccess={Boolean(profile.isActive)}
          style={{ flexShrink: 0 }}
        />
      </div>

      <div
        className="item-center"
        role="button"
        tabIndex={0}
        onClick={() => onEdit(profile)}
      >
        {chainConfig && (
          <div className="item-center-row">
            <ProviderBadge>
              {providerIcon && <img src={providerIcon} alt={providerLabel} />}
              <span className="provider-name">{providerLabel}</span>
              {modelLabel && <span className="model-name">{modelLabel}</span>}
            </ProviderBadge>
          </div>
        )}

        <div className="item-center-row">
          <span className="item-label">{translate("description")}</span>
          <span className="item-description">
            {profile.description || EMPTY_STRING}
          </span>
        </div>

        <div className="item-center-row">
          <div className="item-stats">
            <div className="item-stat">
              <span className="item-label">{translate("agent.tool")}</span>
              <span className="item-value">
                {allowedToolCount > 0
                  ? allowedToolCount
                  : translate("agent.allTools")}
              </span>
            </div>

            <div className="item-stat">
              <span className="item-label">{translate("agent.skill")}</span>
              <span className="item-value">
                {allowedSkillCount > 0
                  ? allowedSkillCount
                  : translate("agent.allSkills")}
              </span>
            </div>

            <div className="item-stat">
              <span className="item-label">
                {translate("sidebar.campaign")}
              </span>
              <span className="item-value">
                {profile.campaign?.name || EMPTY_STRING}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="item-bottom-bar">
        <span className="item-updated">
          {translate("updatedAt")}:{" "}
          {profile.updateAt != null
            ? formatTime(Number(profile.updateAt), locale)
            : EMPTY_STRING}
        </span>

        <div className="item-actions">
          {!profile.isMainAgent && (
            <Popconfirm
              title={translate("confirmDelete")}
              onConfirm={() => onDelete(profile)}
              okText={translate("yes")}
              cancelText={translate("no")}
            >
              <div
                className="btn-icon btn-delete"
                onClick={(e) => e.stopPropagation()}
              >
                <TrashIcon className="trash" />
              </div>
            </Popconfirm>
          )}

          <div
            className="btn-chat"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat(profile);
            }}
          >
            {translate("agent.openChat")}
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default AgentProfileCard;
