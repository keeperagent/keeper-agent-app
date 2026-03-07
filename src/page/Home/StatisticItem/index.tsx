import AnimatedNumbers from "react-animated-numbers";
import { Wrapper } from "./style";

type IProps = {
  firstLabel: string;
  firstValue: number;
  secondLabel: string;
  secondValue: number;
  style?: React.CSSProperties;
};

const StatisticItem = (props: IProps) => {
  const { firstLabel, firstValue, secondLabel, secondValue, style } = props;

  return (
    <Wrapper style={style}>
      <div className="statistic">
        <div className="label">{firstLabel}</div>
        <div className="value">
          <AnimatedNumbers animateToNumber={firstValue} />
        </div>
      </div>

      <div className="statistic">
        <div className="label">{secondLabel}</div>
        <div className="value">
          <AnimatedNumbers animateToNumber={secondValue} />
        </div>
      </div>
    </Wrapper>
  );
};

export default StatisticItem;
