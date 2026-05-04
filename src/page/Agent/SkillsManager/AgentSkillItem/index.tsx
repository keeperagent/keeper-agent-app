import { Button, Popconfirm, Switch } from "antd";
import { IAgentSkill } from "@/electron/type";
import { formatTime } from "@/service/util";
import { useTranslation } from "@/hook/useTranslation";
import { MESSAGE } from "@/electron/constant";
import { EMPTY_STRING } from "@/config/constant";
import { Wrapper } from "./style";

function formatDescription(desc: string | null | undefined): string {
  if (desc == null || desc === "") {
    return "";
  }

  let result = desc.replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
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
      <div className="item-header">
        <div className="item-dots" aria-hidden>
          <span className="item-dot item-dot-red" />
          <span className="item-dot item-dot-yellow" />
          <span className="item-dot item-dot-green" />
        </div>

        <Switch
          size="small"
          checked={item.isEnabled}
          disabled={item?.id == null}
          onChange={() => onToggle(item)}
        />
      </div>

      <div
        className="item-body"
        role="button"
        tabIndex={0}
        onClick={() => onEdit(item)}
      >
        <span className="item-name">{item.name}</span>
        {description && <span className="item-description">{description}</span>}
      </div>

      <div className="item-footer">
        <span className="item-updated">
          {translate("updatedAt")}:{" "}
          {item?.updateAt
            ? formatTime(Number(item.updateAt), locale)
            : EMPTY_STRING}
        </span>

        <div className="item-actions">
          {item?.folderName && (
            <Button size="small" onClick={onOpenFolder}>
              {translate("agent.openSkillFolder")}
            </Button>
          )}

          <Button size="small" onClick={() => onEdit(item)}>
            {translate("button.edit")}
          </Button>

          <Popconfirm
            title={translate("agent.deleteSkill")}
            onConfirm={() => onDelete(item.id!)}
            okText={translate("yes")}
            cancelText={translate("no")}
          >
            <Button size="small" danger onClick={(e) => e.stopPropagation()}>
              {translate("button.delete")}
            </Button>
          </Popconfirm>
        </div>
      </div>
    </Wrapper>
  );
};

export default AgentSkillItem;
