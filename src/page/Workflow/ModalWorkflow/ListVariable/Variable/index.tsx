import { Form, Tooltip, Input } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation } from "@/hook";
import { IWorkflowVariable } from "@/electron/type";
import { TrashBoldIcon } from "@/component/Icon";
import { Wrapper } from "./style";

type IProps = {
  variable: IWorkflowVariable;
  onChangeVariable: (variable: IWorkflowVariable, index: number) => void;
  onRemoveVariable: (index: number) => void;
  index: number;
};

const Variable = (props: IProps) => {
  const { variable, onChangeVariable, onRemoveVariable, index } = props;

  const { translate } = useTranslation();

  const onChangeValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event?.target?.value;
    onChangeVariable({ ...variable, value }, index);
  };

  const onChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    const variableName = event?.target?.value;
    onChangeVariable({ ...variable, variable: variableName }, index);
  };

  return (
    <Wrapper>
      <Form.Item
        label={`${translate("workflow.variableNameLabel")}:`}
      >
        <Input
          placeholder={translate("workflow.enterVariableName")}
          className="custom-input"
          size="large"
          onInput={(e) =>
          ((e.target as HTMLInputElement).value = (
            e.target as HTMLInputElement
          )?.value
            .toUpperCase()
            ?.replaceAll(" ", ""))
          }
          onChange={onChangeName}
          value={variable?.variable}
        />
      </Form.Item>

      <Form.Item
        label={`${translate("workflow.variableValueLabel")}:`}
      >
        <Input
          placeholder={translate("workflow.enterVariableValue")}
          className="custom-input"
          size="large"
          value={variable?.value}
          onChange={onChangeValue}
        />
      </Form.Item>

      <div className="tool">
        {index > 0 ? (
          <Tooltip title={translate("remove")}>
            <div className="delete" onClick={() => onRemoveVariable(index)}>
              <TrashBoldIcon />
            </div>
          </Tooltip>
        ) : null}

        <div className="order">
          <span>{index + 1}</span>
        </div>
      </div>
    </Wrapper>
  );
};

export default connect((_state: RootState) => ({}), {})(Variable);
