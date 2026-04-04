import { Switch, Tooltip } from "antd";
import { BaseToolRegistryItem } from "@/electron/appAgent/baseTool/registry";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";

type Props = {
  tool: BaseToolRegistryItem;
  enabled: boolean;
  loading: boolean;
  onToggle: (toolKey: string, checked: boolean) => void;
};

const ToolItem = ({ tool, enabled, loading, onToggle }: Props) => {
  const { translate } = useTranslation();

  return (
    <Wrapper className={enabled ? "" : "disabled"}>
      <div className="tool-info">
        <div className="tool-name">{tool.name}</div>
        <div className="tool-description">{tool.description}</div>
      </div>

      <Tooltip
        title={tool.locked ? translate("agent.toolLockedTooltip") : undefined}
      >
        <Switch
          checked={tool.locked ? true : enabled}
          onChange={(checked) => onToggle(tool.key, checked)}
          loading={!tool.locked && loading}
          disabled={tool.locked}
          size="small"
        />
      </Tooltip>
    </Wrapper>
  );
};

export default ToolItem;
