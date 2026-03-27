import AnimatedNumbers from "react-animated-numbers";
import { Wrapper } from "./style";

type IProps = {
  label: string;
  value: number;
  style?: React.CSSProperties;
};

const StatisticItem = ({ label, value, style }: IProps) => {
  return (
    <Wrapper style={style}>
      <div className="value">
        <AnimatedNumbers animateToNumber={value} />
      </div>
      <div className="label">{label}</div>
    </Wrapper>
  );
};

export default StatisticItem;
