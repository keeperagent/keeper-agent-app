import { Popconfirm, Switch, Tooltip } from "antd";
import { IAgentSkill } from "@/electron/type";
import { formatTime } from "@/service/util";
import { useTranslation } from "@/hook/useTranslation";
import { MESSAGE } from "@/electron/constant";
import { OpenFolderIcon, TrashIcon } from "@/component/Icon";
import { EMPTY_STRING } from "@/config/constant";
import { Wrapper } from "./style";

function formatDescription(desc: string | null | undefined): string {
  if (desc == null || desc === "") {
    return "";
  }

  let result = desc.replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
  // Remove one surrounding double quote at start and end if both present (e.g. "Convert files..." -> Convert files...)
  if (result.length >= 2 && result.startsWith('"') && result.endsWith('"')) {
    result = result.slice(1, -1).trim();
  }
  return result;
}

type IAgentSkillItemProps = {
  item: IAgentSkill;
  onEdit: (item: IAgentSkill) => void;
  onDelete: (id: number) => void;
  onToggle: (item: IAgentSkill) => void;
};

const AgentSkillItem = (props: IAgentSkillItemProps) => {
  const { item, onEdit, onDelete, onToggle } = props;
  const { locale, translate } = useTranslation();
  const description = formatDescription(item.description);

  const onOpenFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item?.folderName) {
      window?.electron?.send(MESSAGE.OPEN_FOLDER, {
        skillFolderName: item.folderName,
      });
    }
  };

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
        onClick={() => onEdit(item)}
      >
        <span className="item-name">{item.name}</span>
      </div>

      <div
        className="item-center"
        role="button"
        tabIndex={0}
        onClick={() => onEdit(item)}
      >
        <div className="item-center-row">
          <span className="item-value item-description">
            {description || EMPTY_STRING}
          </span>
        </div>
      </div>

      <div className="item-bottom-bar">
        <span className="item-updated">
          {translate("updatedAt")}:{" "}
          {item?.updateAt
            ? formatTime(Number(item.updateAt), locale)
            : EMPTY_STRING}
        </span>

        <div className="item-actions">
          <Popconfirm
            title={translate("agent.deleteSkill")}
            onConfirm={() => onDelete(item.id!)}
            okText={translate("yes")}
            cancelText={translate("no")}
          >
            <div className="btn-delete">
              <TrashIcon className="trash" />
            </div>
          </Popconfirm>

          <Tooltip title={translate("agent.openSkillFolder")}>
            <div
              className="item-action-open-folder"
              onClick={onOpenFolder}
              role="button"
              tabIndex={0}
              aria-label={translate("agent.openSkillFolderAria")}
            >
              <OpenFolderIcon
                className="open-folder-icon"
                width={20}
                height={20}
              />
            </div>
          </Tooltip>

          <Switch
            size="small"
            checked={item.isEnabled}
            disabled={item?.id == null}
            onChange={() => onToggle(item)}
          />
        </div>
      </div>
    </Wrapper>
  );
};

export default AgentSkillItem;
