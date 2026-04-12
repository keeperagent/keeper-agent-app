import { Tooltip, message } from "antd";
import copy from "copy-to-clipboard";
import { IWorkflowVariable } from "@/electron/type";
import { EMPTY_STRING } from "@/config/constant";
import { CopyIcon } from "@/component/Icon";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";
import { getVariableFormat } from "../index";

type IProps = {
  variable: IWorkflowVariable;
  onClick: () => any;
  isActive: boolean;
  useJavascriptVariable?: boolean;
};

const Variable = (props: IProps) => {
  const { translate } = useTranslation();
  const { variable, onClick, isActive, useJavascriptVariable } = props;

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

      <div className="label">{variable?.label || EMPTY_STRING}</div>
    </Wrapper>
  );
};

export default Variable;
