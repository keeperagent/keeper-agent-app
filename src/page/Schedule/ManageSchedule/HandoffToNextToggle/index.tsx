import { Switch, Tooltip } from "antd";
import { useTranslation } from "@/hook";
import { QuestionIcon } from "@/component/Icon";
import { Wrapper } from "./style";

type IProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const HandoffToNextToggle = ({ checked, onChange }: IProps) => {
  const { translate } = useTranslation();

  return (
    <Wrapper>
      <Switch size="small" checked={checked} onChange={onChange} />
      <span className="label">{translate("schedule.handoffToNext")}</span>
      <Tooltip title={translate("schedule.handoffToNextHint")}>
        <span className="hint-icon">
          <QuestionIcon />
        </span>
      </Tooltip>
    </Wrapper>
  );
};

export default HandoffToNextToggle;
