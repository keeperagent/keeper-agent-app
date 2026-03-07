import { Switch } from "antd";
import { BaseToolRegistryItem } from "@/electron/appAgent/baseTool/registry";
import { Wrapper } from "./style";

type Props = {
  tool: BaseToolRegistryItem;
  enabled: boolean;
  loading: boolean;
  onToggle: (toolKey: string, checked: boolean) => void;
};

const ToolItem = ({ tool, enabled, loading, onToggle }: Props) => (
  <Wrapper className={enabled ? "" : "disabled"}>
    <div className="tool-info">
      <div className="tool-name">{tool.name}</div>
      <div className="tool-description">{tool.description}</div>
    </div>

    <Switch
      checked={enabled}
      onChange={(checked) => onToggle(tool.key, checked)}
      loading={loading}
      size="small"
    />
  </Wrapper>
);

export default ToolItem;
