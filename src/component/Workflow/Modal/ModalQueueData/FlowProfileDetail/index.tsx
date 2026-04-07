import { Popover } from "antd";
import { connect } from "react-redux";
import _ from "lodash";
import { RootState } from "@/redux/store";
import { EyeOpenIcon } from "@/component/Icon";
import { IWorkflowVariable } from "@/electron/type";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";
import Variable from "./Variable";

type IProps = {
  listVariable: IWorkflowVariable[];
  hideLabel?: boolean;
};

const FlowProfileDetail = (props: IProps) => {
  const { translate } = useTranslation();
  let { listVariable, hideLabel } = props;

  const renderListVariable = () => {
    listVariable = _.sortBy(
      listVariable,
      (variable: IWorkflowVariable) => variable?.variable,
    );

    return listVariable?.map((variable: IWorkflowVariable, index: number) => (
      <Variable variable={variable} key={index} hideLabel={hideLabel} />
    ));
  };

  return (
    <Popover
      content={renderListVariable()}
      placement="right"
      title={translate("profile.profileInfo")}
      zIndex={3}
    >
      <Wrapper>
        <EyeOpenIcon />
      </Wrapper>
    </Popover>
  );
};

export default connect((_state: RootState) => ({}), {})(FlowProfileDetail);
