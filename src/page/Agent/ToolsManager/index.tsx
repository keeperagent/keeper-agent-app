import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { IPreference } from "@/electron/type";
import { useUpdatePreference } from "@/hook/preference";
import {
  BASE_TOOL_REGISTRY,
  BASE_TOOL_GROUP_LABELS,
  BaseToolGroup,
} from "@/electron/appAgent/baseTool/registry";
import ToolItem from "./ToolItem";
import { Wrapper } from "./style";

const GROUPS: BaseToolGroup[] = [
  BaseToolGroup.APP_MANAGEMENT,
  BaseToolGroup.TRANSACTION,
  BaseToolGroup.CODE_EXECUTION,
];

const ToolsManager = (props: { preference: IPreference | null }) => {
  const { preference } = props;
  const { updatePreference, loading } = useUpdatePreference();

  const disabledTools: string[] = preference?.disabledTools || [];
  const disabledSet = new Set(disabledTools);

  const onToggle = (toolKey: string, checked: boolean) => {
    if (!preference) {
      return;
    }

    const next = checked
      ? disabledTools.filter((key) => key !== toolKey)
      : [...disabledTools, toolKey];
    updatePreference({ ...preference, disabledTools: next }, true);
  };

  return (
    <Wrapper>
      {GROUPS.map((group) => {
        const tools = BASE_TOOL_REGISTRY.filter((tool) => tool.group === group);

        return (
          <div key={group} className="group">
            <div className="group-title">{BASE_TOOL_GROUP_LABELS[group]}</div>
            <div className="group-items">
              {tools.map((tool) => (
                <ToolItem
                  key={tool.key}
                  tool={tool}
                  enabled={!disabledSet.has(tool.key)}
                  loading={loading}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </div>
        );
      })}
    </Wrapper>
  );
};

export default connect((state: RootState) => ({
  preference: state?.Preference?.preference || null,
}))(ToolsManager);
