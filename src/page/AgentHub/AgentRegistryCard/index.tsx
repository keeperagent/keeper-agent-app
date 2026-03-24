import { Popconfirm } from "antd";
import { IAgentRegistry } from "@/electron/type";
import { TrashIcon } from "@/component/Icon";
import { trimText, formatTime } from "@/service/util";
import { useTranslation } from "@/hook/useTranslation";
import { EMPTY_STRING } from "@/config/constant";
import { LLM_PROVIDERS } from "@/config/llmProviders";
import Status from "@/component/Status";
import { Wrapper, ProviderBadge } from "./style";

type Props = {
  registry: IAgentRegistry;
  onEdit: (registry: IAgentRegistry) => void;
  onDelete: (registry: IAgentRegistry) => void;
  onOpenChat: (registry: IAgentRegistry) => void;
};

const AgentRegistryCard = (props: Props) => {
  const { registry, onEdit, onDelete, onOpenChat } = props;
  const { translate, locale } = useTranslation();

  const provider = LLM_PROVIDERS.find(
    (item) => item.key === registry?.llmProvider,
  );
  const providerLabel = provider?.label || EMPTY_STRING;
  const providerIcon = provider?.icon || EMPTY_STRING;
  const modelLabel = registry.llmModel
    ? trimText(registry.llmModel, 24)
    : EMPTY_STRING;

  const allowedToolCount = registry.allowedBaseTools?.length || 0;
  const allowedSkillCount = registry.allowedSkillIds?.length || 0;

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
        onClick={() => onEdit(registry)}
      >
        <span className="item-name">{registry.name}</span>
        <Status
          content={
            registry.isActive ? translate("active") : translate("inActive")
          }
          isSuccess={Boolean(registry.isActive)}
          style={{ flexShrink: 0 }}
        />
      </div>

      <div
        className="item-center"
        role="button"
        tabIndex={0}
        onClick={() => onEdit(registry)}
      >
        <div className="item-center-row">
          <ProviderBadge>
            {providerIcon && <img src={providerIcon} alt={providerLabel} />}
            <span className="provider-name">{providerLabel}</span>
            {modelLabel && <span className="model-name">{modelLabel}</span>}
          </ProviderBadge>
        </div>

        <div className="item-center-row">
          <span className="item-label">{translate("description")}:</span>
          <span className="item-description">
            {registry.description || EMPTY_STRING}
          </span>
        </div>

        <div className="item-center-row">
          <div className="item-stats">
            <div className="item-stat">
              <span className="item-label">{translate("agent.tool")}:</span>
              <span className="item-value">
                {allowedToolCount > 0
                  ? allowedToolCount
                  : translate("agent.allTools")}
              </span>
            </div>
            <div className="item-stat">
              <span className="item-label">{translate("agent.skill")}:</span>
              <span className="item-value">
                {allowedSkillCount > 0
                  ? allowedSkillCount
                  : translate("agent.allSkills")}
              </span>
            </div>
            <div className="item-stat">
              <span className="item-label">
                {translate("sidebar.campaign")}:
              </span>
              <span className="item-value">
                {registry.campaign?.name || EMPTY_STRING}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="item-bottom-bar">
        <span className="item-updated">
          {translate("updatedAt")}:{" "}
          {registry.updateAt != null
            ? formatTime(Number(registry.updateAt), locale)
            : EMPTY_STRING}
        </span>

        <div className="item-actions">
          <Popconfirm
            title={translate("agent.confirmDeleteRegistry")}
            onConfirm={() => onDelete(registry)}
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

          <div
            className="btn-chat"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat(registry);
            }}
          >
            {translate("agent.openChat")}
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default AgentRegistryCard;
