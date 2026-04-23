import { useMemo } from "react";
import { connect } from "react-redux";
import ReactECharts from "echarts-for-react";
import { RootState } from "@/redux/store";
import { ChartResultWrapper } from "./style";
import { applyTheme } from "./util";

type Props = {
  option: Record<string, unknown>;
  height?: number;
  isLightMode: boolean;
};

const MIN_CHART_HEIGHT = 200;
const MAX_CHART_HEIGHT = 1200;

const ChartResult = ({ option, height = 400, isLightMode }: Props) => {
  const clampedHeight = Number.isFinite(height)
    ? Math.min(Math.max(height, MIN_CHART_HEIGHT), MAX_CHART_HEIGHT)
    : 400;

  const themedOption = useMemo(
    () => applyTheme(option, isLightMode),
    [option, isLightMode],
  );

  return (
    <ChartResultWrapper $isLightMode={isLightMode}>
      <ReactECharts
        option={themedOption}
        style={{ height: `${clampedHeight}px`, width: "100%" }}
        notMerge
        lazyUpdate
        onChartReady={() =>
          window.dispatchEvent(new CustomEvent("chart-ready"))
        }
      />
    </ChartResultWrapper>
  );
};

export default connect((state: RootState) => ({
  isLightMode: state?.Layout?.isLightMode ?? true,
}))(ChartResult);
