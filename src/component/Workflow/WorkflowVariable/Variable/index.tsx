import { Badge, Tooltip, message } from "antd";
import copy from "copy-to-clipboard";
import { IWorkflowVariable, WorkflowVariableSourceType } from "@/electron/type";
import { CopyIcon } from "@/component/Icon";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";
import { getVariableFormat } from "../index";

const badgeColorMap: Record<WorkflowVariableSourceType, string> = {
  [WorkflowVariableSourceType.GLOBAL]: "var(--color-blue)",
  [WorkflowVariableSourceType.WORKFLOW]: "var(--color-success)",
  [WorkflowVariableSourceType.OTHER_WORKFLOW]: "var(--color-yellow)",
};

type IProps = {
  variable: IWorkflowVariable;
  onClick: () => any;
  isActive: boolean;
  useJavascriptVariable?: boolean;
};

const Variable = (props: IProps) => {
  const { translate } = useTranslation();
  const { variable, onClick, isActive, useJavascriptVariable } = props;

  const badgeTooltipMap: Record<WorkflowVariableSourceType, string> = {
    [WorkflowVariableSourceType.GLOBAL]: translate("variable.source.global"),
    [WorkflowVariableSourceType.WORKFLOW]: translate(
      "variable.source.workflow",
    ),
    [WorkflowVariableSourceType.OTHER_WORKFLOW]: translate(
      "variable.source.otherWorkflow",
    ),
  };

  const onCopy = () => {
    message.success(translate("copied"));
    copy(
      useJavascriptVariable
        ? variable?.variable
        : getVariableFormat(variable?.variable),
    );
  };

  return (
    <Wrapper onClick={onClick} className={isActive ? "active" : ""}>
      <div className="variable">
        <span className="variable-name">{variable?.variable}</span>

        <Tooltip title={translate("copy")} placement="top">
          <div className="icon" onClick={onCopy}>
            <CopyIcon />
          </div>
        </Tooltip>
      </div>

      {variable?.label && <div className="label">{variable.label}</div>}
      {variable?.sourceLabel && (
        <div className="source-label">{variable.sourceLabel}</div>
      )}

      {variable?.sourceType && (
        <Tooltip title={badgeTooltipMap[variable.sourceType]} placement="right">
          <span className="source-type-badge">
            <Badge color={badgeColorMap[variable.sourceType]} />
          </span>
        </Tooltip>
      )}
    </Wrapper>
  );
};

export default Variable;
