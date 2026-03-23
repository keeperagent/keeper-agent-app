import { Popconfirm, Tag, Tooltip } from "antd";
import { IAgentRegistry } from "@/electron/type";
import { TrashIcon, EditIcon } from "@/component/Icon";
import { trimText, formatTime } from "@/service/util";
import { useTranslation } from "@/hook/useTranslation";
import { EMPTY_STRING } from "@/config/constant";
import { LLM_PROVIDERS } from "@/config/llmProviders";
import { Wrapper } from "./style";

type Props = {
  registry: IAgentRegistry;
  onEdit: (registry: IAgentRegistry) => void;
  onDelete: (registry: IAgentRegistry) => void;
  onOpenChat: (registry: IAgentRegistry) => void;
};

const AgentRegistryCard = (props: Props) => {
  const { registry, onEdit, onDelete, onOpenChat } = props;
  const { translate, locale } = useTranslation();

  const providerLabel =
    LLM_PROVIDERS.find((item) => item.key === registry?.llmProvider)?.label ||
    EMPTY_STRING;

  const modelLabel = registry.llmModel
    ? trimText(registry.llmModel, 20)
    : EMPTY_STRING;

  const allowedCampaignIds = registry.allowedCampaignIds?.length || 0;

  return (
    <Wrapper>
      <div className="card-header" onClick={() => onOpenChat(registry)}>
        <div className="card-name">{trimText(registry.name, 24)}</div>
        <div className="card-badges">
          <Tag color="blue">{providerLabel}</Tag>
          {modelLabel && <Tag color="default">{modelLabel}</Tag>}
        </div>
      </div>

      <div className="card-body" onClick={() => onOpenChat(registry)}>
        <div className="card-desc">
          {registry.description ? (
            trimText(registry.description, 100)
          ) : (
            <span className="card-no-desc">{translate("noDescription")}</span>
          )}
        </div>

        <div className="card-meta">
          <div className="card-meta-row">
            <span className="card-meta-label">
              {translate("agent.wallets")}:
            </span>
            <span className="card-meta-value">
              {allowedCampaignIds > 0
                ? `${allowedCampaignIds} ${translate("agent.campaigns")}`
                : translate("agent.allCampaigns")}
            </span>
          </div>

          {registry.updateAt != null && (
            <div className="card-meta-row">
              <span className="card-meta-label">{translate("updatedAt")}:</span>
              <span className="card-meta-value">
                {formatTime(Number(registry.updateAt), locale)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="card-footer">
        <div className="card-actions">
          <Tooltip title={translate("edit")}>
            <div
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(registry);
              }}
            >
              <EditIcon />
            </div>
          </Tooltip>

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
        </div>

        <div className="btn-chat" onClick={() => onOpenChat(registry)}>
          {translate("agent.openChat")}
        </div>
      </div>
    </Wrapper>
  );
};

export default AgentRegistryCard;
