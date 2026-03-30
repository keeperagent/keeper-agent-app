import { useState, useEffect, useMemo, Fragment } from "react";
import AnimatedNumbers from "react-animated-numbers";
import { connect } from "react-redux";
import { Segmented } from "antd";
import ReactECharts from "echarts-for-react";
import { RootState } from "@/redux/store";
import { useGetAgentAnalytics } from "@/hook/agentTask";
import { useTranslation } from "@/hook";
import RealtimeIndicator from "@/component/RealtimeIndicator";
import { formatTime, trimText } from "@/service/util";
import { Wrapper, StatStrip, ChartGrid, ChartBox } from "./style";

const PERIODS = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

const formatDuration = (ms: number): string => {
  if (ms === 0) {
    return "—";
  }
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${Math.round(ms / 1000)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
};

const buildTheme = (isLightMode: boolean) => ({
  text: isLightMode ? "#555" : "#c8c8c8",
  grid: isLightMode ? "#ebebeb" : "#252525",
  axis: isLightMode ? "#ddd" : "#383838",
  tooltipBg: isLightMode ? "#fff" : "#1c1c1c",
  tooltipBorder: isLightMode ? "#e0e0e0" : "#383838",
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, index) => `${index}h`);

type OwnProps = {
  showToolbar?: boolean;
  showStatStrip?: boolean;
  defaultPeriod?: number;
};

type Props = OwnProps & { isLightMode: boolean };

const AgentAnalytic = ({
  isLightMode,
  showToolbar = false,
  showStatStrip = false,
  defaultPeriod = 7,
}: Props) => {
  const { translate } = useTranslation();
  const [activePeriod, setActivePeriod] = useState(defaultPeriod);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const { analytics, getAgentAnalytics } = useGetAgentAnalytics();

  useEffect(() => {
    const fromTimestamp = Date.now() - activePeriod * 86400000;
    getAgentAnalytics(fromTimestamp);
  }, [activePeriod]);

  useEffect(() => {
    setLastUpdatedAt(Date.now());
  }, [analytics]);

  useEffect(() => {
    const interval = setInterval(() => setTick((tick) => tick + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const theme = useMemo(() => buildTheme(isLightMode), [isLightMode]);

  const successRate = useMemo(() => {
    if (!analytics) {
      return 0;
    }
    const total = analytics.totalDone + analytics.totalFailed;
    if (total === 0) {
      return 0;
    }
    return Math.round((analytics.totalDone / total) * 100);
  }, [analytics]);

  const activityChartOptions = useMemo(() => {
    if (!analytics?.dailyActivity) {
      return { backgroundColor: "transparent" };
    }

    const categories = analytics.dailyActivity.map(
      (dailyItem: any) => dailyItem.date,
    );
    const doneData = analytics.dailyActivity.map(
      (dailyItem: any) => dailyItem.done,
    );
    const failedData = analytics.dailyActivity.map(
      (dailyItem: any) => dailyItem.failed,
    );

    const axisBase = {
      axisLabel: { color: theme.text, fontSize: 11 },
      axisLine: { lineStyle: { color: theme.axis } },
      axisTick: { lineStyle: { color: theme.axis } },
      splitLine: { lineStyle: { color: theme.grid } },
    };

    return {
      backgroundColor: "transparent",
      grid: { top: 20, right: 10, bottom: 10, left: 30, containLabel: true },
      xAxis: { type: "category", data: categories, ...axisBase },
      yAxis: {
        type: "value",
        minInterval: 1,
        min: 0,
        name: "Tasks",
        nameLocation: "middle",
        nameGap: 35,
        nameTextStyle: { color: theme.text, fontSize: 12 },
        ...axisBase,
        splitLine: { lineStyle: { color: theme.grid, opacity: 0.3 } },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        textStyle: { color: theme.text, fontSize: 12 },
      },
      legend: { show: false },
      series: [
        {
          name: translate("agentAnalytic.series.failed"),
          type: "line",
          data: failedData,
          smooth: true,
          lineStyle: { color: "#ff4d4f", width: 1 },
          itemStyle: { color: "#ff4d4f" },
          symbolSize: 5,
          emphasis: { focus: "series" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#ff4d4f66" },
                { offset: 1, color: "#ff4d4f00" },
              ],
            },
          },
        },
        {
          name: translate("agentAnalytic.series.done"),
          type: "line",
          data: doneData,
          smooth: true,
          lineStyle: { color: "#52c41a", width: 1 },
          itemStyle: { color: "#52c41a" },
          symbolSize: 5,
          emphasis: { focus: "series" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#52c41a66" },
                { offset: 1, color: "#52c41a00" },
              ],
            },
          },
        },
      ],
    };
  }, [analytics, theme, translate]);

  const perAgentChartOptions = useMemo(() => {
    if (!analytics?.perAgentStats || analytics.perAgentStats.length === 0) {
      return {};
    }

    const bubbleData = analytics.perAgentStats.map((agent: any) => {
      const total = agent.done + agent.failed;
      const failureRate =
        total > 0 ? Math.round((agent.failed / total) * 1000) / 10 : 0;
      const color =
        failureRate < 5 ? "#52c41a" : failureRate < 15 ? "#fa8c16" : "#fa541c";

      return {
        value: [agent.done, failureRate, agent.avgDurationMs],
        name: agent.name,
        itemStyle: {
          color: color + "bb",
          borderColor: color,
          borderWidth: 1,
        },
      };
    });

    const allZ = bubbleData.map(
      (bubbleItem: any) => bubbleItem.value[2] as number,
    );
    const minZ = Math.min(...allZ);
    const maxZ = Math.max(...allZ);

    const allY = bubbleData.map(
      (bubbleItem: any) => bubbleItem.value[1] as number,
    );
    const minY = Math.max(0, Math.floor(Math.min(...allY) - 2));

    const subtleColor = isLightMode ? "#aaa" : "#555";

    const axisBase = {
      axisLabel: { color: theme.text, fontSize: 11 },
      axisLine: { lineStyle: { color: theme.axis } },
      axisTick: { lineStyle: { color: theme.axis } },
      splitLine: { lineStyle: { color: theme.grid, opacity: 0.6 } },
    };

    return {
      backgroundColor: "transparent",
      grid: { top: 20, right: 10, bottom: 20, left: 30, containLabel: true },
      xAxis: {
        type: "value",
        name: translate("agentAnalytic.axis.tasksDone"),
        nameLocation: "middle",
        nameGap: 25,
        nameTextStyle: { color: theme.text, fontSize: 12 },
        ...axisBase,
      },
      yAxis: {
        type: "value",
        min: minY,
        name: translate("agentAnalytic.axis.failureRatePercent"),
        nameLocation: "middle",
        nameGap: 40,
        nameTextStyle: { color: theme.text, fontSize: 12 },
        ...axisBase,
      },
      tooltip: {
        trigger: "item",
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        textStyle: { color: theme.text, fontSize: 12 },
        formatter: (params: any) => {
          const [x, y, z] = params.analytics.value;
          return (
            `<strong>${trimText(params.analytics.name || "", 15)}</strong><br/>` +
            `${translate("agentAnalytic.tooltip.done")}: ${x}<br/>` +
            `${translate("agentAnalytic.tooltip.failureRate")}: ${y}%<br/>` +
            `${translate("agentAnalytic.tooltip.avgDuration")}: ${formatDuration(z)}`
          );
        },
      },
      legend: { show: false },
      graphic: [
        {
          type: "text",
          right: 16,
          top: 16,
          style: {
            text: "avg duration = bubble size",
            fill: subtleColor,
            fontSize: 11,
          },
        },
      ],
      series: [
        {
          type: "scatter",
          symbolSize: (dataValues: number[]) => {
            const z = dataValues[2];
            const minSize = bubbleData.length > 50 ? 6 : 20;
            const maxSize = bubbleData.length > 50 ? 50 : 70;
            if (maxZ === minZ) {
              return (minSize + maxSize) / 2;
            }
            const ratio = (z - minZ) / (maxZ - minZ);
            return minSize + Math.sqrt(ratio) * (maxSize - minSize);
          },
          label: {
            show: bubbleData.length <= 25,
            position: "right",
            formatter: (params: any) => trimText(params.analytics.name, 15),
            color: subtleColor,
            fontSize: 11,
          },
          data: bubbleData,
        },
      ],
    };
  }, [analytics, theme, isLightMode, translate]);

  const peakHoursChartOptions = useMemo(() => {
    if (!analytics?.hourlyActivity || analytics.hourlyActivity.length === 0) {
      return { backgroundColor: "transparent" };
    }

    const maxHeatmapValue = Math.max(
      ...analytics.hourlyActivity.map((hourlyItem: any) => hourlyItem[2]),
      1,
    );

    const activityMap = new Map<string, number>();
    analytics.hourlyActivity.forEach((hourlyItem: any) => {
      activityMap.set(`${hourlyItem[0]}_${hourlyItem[1]}`, hourlyItem[2]);
    });
    const fullGrid: [number, number, number][] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        fullGrid.push([hour, day, activityMap.get(`${hour}_${day}`) || 0]);
      }
    }

    const axisBase = {
      axisLine: { lineStyle: { color: theme.axis } },
      axisTick: { lineStyle: { color: theme.axis } },
      splitLine: { show: false },
    };

    return {
      backgroundColor: "transparent",
      grid: { top: 20, right: 10, bottom: 10, left: 10, containLabel: true },
      xAxis: {
        type: "category",
        data: HOURS,
        axisLabel: { color: theme.text, fontSize: 9, interval: 2 },
        ...axisBase,
      },
      yAxis: {
        type: "category",
        data: DAYS,
        inverse: true,
        axisLabel: { color: theme.text, fontSize: 11 },
        ...axisBase,
      },
      visualMap: {
        min: 0,
        max: maxHeatmapValue,
        show: false,
        inRange: {
          color: [isLightMode ? "#f0f0f0" : "#2a2a2a", "#52c41a"],
        },
      },
      tooltip: {
        trigger: "item",
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        textStyle: { color: theme.text, fontSize: 12 },
        formatter: (params: any) => {
          const hourIndex = params.data[0];
          const dayIndex = params.data[1];
          const value = params.data[2];
          return (
            `<b>${DAYS[dayIndex]}</b> ${hourIndex}:00<br/>` +
            `${translate("agentAnalytic.tooltip.tasks")}: <b>${value}</b>`
          );
        },
      },
      series: [
        {
          type: "heatmap",
          data: fullGrid,
          itemStyle: {
            borderWidth: 1,
            borderColor: isLightMode ? "#ffffff" : "#0d0d0d",
            borderRadius: 2,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowColor: "#52c41a",
            },
          },
          label: { show: false },
        },
      ],
    };
  }, [analytics, theme, isLightMode, translate]);

  return (
    <Wrapper>
      {showToolbar && (
        <div className="toolbar">
          <Segmented
            value={activePeriod}
            onChange={(value) => setActivePeriod(value as number)}
            options={PERIODS}
          />
          <RealtimeIndicator
            text={`${translate("agentAnalytic.lastUpdated")}: ${formatTime(
              lastUpdatedAt || 0,
            )}`}
          />
        </div>
      )}

      <Fragment>
        {showStatStrip && (
          <StatStrip>
            <div className="stat-item">
              <div className="stat-value" style={{ color: "#52c41a" }}>
                <AnimatedNumbers animateToNumber={analytics.totalDone} />
              </div>
              <div className="stat-label">
                {translate("agentAnalytic.stat.done")}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-value" style={{ color: "#ff4d4f" }}>
                <AnimatedNumbers animateToNumber={analytics.totalFailed} />
              </div>
              <div className="stat-label">
                {translate("agentAnalytic.stat.failed")}
              </div>
            </div>

            <div className="stat-item">
              <div
                className="stat-value"
                style={{ color: "var(--color-primary)" }}
              >
                <AnimatedNumbers animateToNumber={successRate} />%
              </div>
              <div className="stat-label">
                {translate("agentAnalytic.stat.successRate")}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-value" style={{ color: "#722ed1" }}>
                {formatDuration(analytics.avgDurationMs)}
              </div>
              <div className="stat-label">
                {translate("agentAnalytic.stat.avgDuration")}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-value" style={{ color: "#faad14" }}>
                <AnimatedNumbers animateToNumber={analytics.pendingNow} />
              </div>
              <div className="stat-label">
                {translate("agentAnalytic.stat.pending")}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-value" style={{ color: "#13c2c2" }}>
                <AnimatedNumbers animateToNumber={analytics.inProgressNow} />
              </div>
              <div className="stat-label">
                {translate("agentAnalytic.stat.inProgress")}
              </div>
            </div>
          </StatStrip>
        )}

        <ChartGrid>
          <ChartBox className="full-width">
            <div className="chart-title">
              {translate("agentAnalytic.chart.perAgentPerformance")}
            </div>

            {analytics?.perAgentStats?.length > 0 ? (
              <ReactECharts
                option={perAgentChartOptions}
                style={{ height: "320px", width: "100%" }}
                notMerge={true}
              />
            ) : (
              <div className="no-data">
                {translate("agentAnalytic.empty.noAgentData")}
              </div>
            )}
          </ChartBox>

          <ChartBox>
            <div className="chart-title">
              {showToolbar
                ? translate("agentAnalytic.chart.taskActivity")
                : translate("agentAnalytic.chart.agentTaskActivity")}
            </div>

            <ReactECharts
              option={activityChartOptions}
              style={{ height: "240px", width: "100%" }}
              notMerge={true}
            />
          </ChartBox>

          <ChartBox>
            <div className="chart-title">
              {showToolbar
                ? translate("agentAnalytic.chart.peakHours")
                : translate("agentAnalytic.chart.agentPeakHours")}
            </div>

            {analytics?.hourlyActivity?.length > 0 ? (
              <ReactECharts
                option={peakHoursChartOptions}
                style={{ height: "240px", width: "100%" }}
                notMerge={true}
              />
            ) : (
              <div className="no-data">
                <span>{translate("agentAnalytic.empty.noAgentData")}</span>
              </div>
            )}
          </ChartBox>
        </ChartGrid>
      </Fragment>
    </Wrapper>
  );
};

export default connect((state: RootState) => ({
  isLightMode: state?.Layout?.isLightMode ?? true,
}))(AgentAnalytic);
