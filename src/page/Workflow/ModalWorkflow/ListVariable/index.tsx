import { Tooltip } from "antd";
import { useTranslation } from "@/hook";
import { PlusIcon } from "@/component/Icon";
import { IWorkflowVariable } from "@/electron/type";
import { Wrapper } from "./style";
import Variable from "./Variable";

type IProps = {
  onChangeVariable: (variable: IWorkflowVariable, index: number) => void;
  onAddVariable: () => void;
  onRemoveVariable: (index: number) => void;
  listVariable: IWorkflowVariable[];
};

const ListVariable = (props: IProps) => {
  const { onChangeVariable, onAddVariable, onRemoveVariable, listVariable } =
    props;
  const { translate } = useTranslation();

  return (
    <Wrapper
      style={{
        overflowY: listVariable?.length > 2 ? "auto" : "hidden",
      }}
    >
      {listVariable.map((variable, index) => (
        <Variable
          key={index}
          index={index}
          variable={variable}
          onChangeVariable={onChangeVariable}
          onRemoveVariable={onRemoveVariable}
        />
      ))}

      <div className="add">
        <Tooltip title={translate("add")}>
          <div className="icon" onClick={onAddVariable}>
            <PlusIcon />
          </div>
        </Tooltip>
      </div>
    </Wrapper>
  );
};

export default ListVariable;
