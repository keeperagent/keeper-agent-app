import { useState, useEffect } from "react";
import NumberFlow from "@number-flow/react";

type IProps = {
  value: number;
};

const AnimatedNumber = ({ value }: IProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <NumberFlow
      value={displayValue}
      format={{ useGrouping: true }}
      continuous
      transformTiming={{ duration: 600, easing: "ease-out" }}
      spinTiming={{ duration: 600, easing: "ease-out" }}
      opacityTiming={{ duration: 300, easing: "ease-out" }}
    />
  );
};

export default AnimatedNumber;
