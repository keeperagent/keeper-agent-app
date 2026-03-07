import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { IWorkflowVariable } from "@/electron/type";
import { useTranslation } from "@/hook";
import { trimText } from "@/service/util";
import { actSetModalAnalyzeVariableOpen } from "@/redux/workflowRunner";
import { Wrapper } from "./style";

type IProps = {
  variable: IWorkflowVariable;
  hideLabel?: boolean;
  actSetModalAnalyzeVariableOpen: (payload: {
    isModalAnalyzeVariableOpen: boolean;
    selectedVariable: IWorkflowVariable | null;
  }) => void;
};

const Variable = (props: IProps) => {
  const { translate } = useTranslation();
  const { variable, hideLabel } = props;

  return (
    <Wrapper>
      <div
        className="analyze-variable"
        onClick={() =>
          props?.actSetModalAnalyzeVariableOpen({
            isModalAnalyzeVariableOpen: true,
            selectedVariable: variable,
          })
        }
      >
        Analyze variable
      </div>

      {!hideLabel && (
        <div className="item">
          <div className="label">{`${translate("workflow.nameLabel")}:`}</div>
          <div className="value" style={{ fontWeight: 700 }}>
            {variable?.label}
          </div>
        </div>
      )}

      <div className="item">
        <div className="label">{`${translate("resource.variableName")}:`}</div>
        <div className="value">{variable?.variable}</div>
      </div>

      <div className="item">
        <div className="label">{`${translate("workflow.value")}:`}</div>
        <div className="value">
          {trimText(variable?.value?.toString(), 170)}
        </div>
      </div>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    isLightMode: state?.Layout?.isLightMode,
    isModalAnalyzeVariableOpen:
      state?.WorkflowRunner?.isModalAnalyzeVariableOpen,
    selectedVariable: state?.WorkflowRunner?.selectedVariable,
  }),
  {
    actSetModalAnalyzeVariableOpen,
  },
)(Variable);
