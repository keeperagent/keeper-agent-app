import { useState, useEffect, useMemo, Fragment } from "react";
import AnimatedNumbers from "react-animated-numbers";
import { connect } from "react-redux";
import { Segmented } from "antd";
import Highcharts from "highcharts";
import HighchartsHeatmap from "highcharts/modules/heatmap";
import HighchartsReact from "highcharts-react-official";
import { RootState } from "@/redux/store";
import { useGetAgentAnalytics } from "@/hook/agentTask";
import { useTranslation } from "@/hook";
import RealtimeIndicator from "@/component/RealtimeIndicator";
import { Wrapper, StatStrip, ChartGrid, ChartBox } from "./style";
import { formatTime } from "@/service/util";

HighchartsHeatmap(Highcharts);

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

const EMPTY_ANALYTICS = {
  totalDone: 0,
  totalFailed: 0,
  avgDurationMs: 0,
  avgWaitTimeMs: 0,
  pendingNow: 0,
  inProgressNow: 0,
  dailyActivity: [],
  perAgentStats: [],
  hourlyActivity: [],
};

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

  const data = analytics ?? EMPTY_ANALYTICS;

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
    const total = data.totalDone + data.totalFailed;
    if (total === 0) {
      return 0;
    }
    return Math.round((data.totalDone / total) * 100);
  }, [data]);

  const commonAxis = useMemo(
    () => ({
      labels: { style: { color: theme.text, fontSize: "11px" } },
      lineColor: theme.axis,
      tickColor: theme.axis,
      gridLineColor: theme.grid,
    }),
    [theme],
  );

  const commonTooltip = useMemo(
    () => ({
      backgroundColor: theme.tooltipBg,
      borderColor: theme.tooltipBorder,
      style: { color: theme.text, fontSize: "12px" },
    }),
    [theme],
  );

  const commonLegend = useMemo(
    () => ({
      enabled: true,
      itemStyle: { color: theme.text, fontWeight: "normal", fontSize: "12px" },
    }),
    [theme],
  );

  const activityChartOptions = useMemo(() => {
    if (!data?.dailyActivity) {
      return {
        chart: {
          type: "area",
          height: "240px",
          backgroundColor: "transparent",
        },
        title: { text: "" },
        credits: { enabled: false },
      };
    }

    const categories = data.dailyActivity.map(
      (dailyItem: any) => dailyItem.date,
    );
    const doneData = data.dailyActivity.map((dailyItem: any) => dailyItem.done);
    const failedData = data.dailyActivity.map(
      (dailyItem: any) => dailyItem.failed,
    );

    return {
      chart: { type: "area", height: "240px", backgroundColor: "transparent" },
      title: { text: "" },
      credits: { enabled: false },
      legend: commonLegend,
      xAxis: { ...commonAxis, categories },
      yAxis: {
        title: { text: "" },
        allowDecimals: false,
        min: 0,
        ...commonAxis,
      },
      tooltip: { ...commonTooltip, shared: true },
      plotOptions: {
        area: {
          marker: { radius: 3, symbol: "circle" },
          lineWidth: 2,
          fillOpacity: 1,
        },
      },
      series: [
        {
          name: translate("agentAnalytic.series.failed"),
          data: failedData,
          color: "#ff4d4f",
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, "#ff4d4f33"],
              [1, "#ff4d4f00"],
            ],
          },
        },
        {
          name: translate("agentAnalytic.series.done"),
          data: doneData,
          color: "#52c41a",
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, "#52c41a33"],
              [1, "#52c41a00"],
            ],
          },
        },
      ],
    };
  }, [data, commonAxis, commonTooltip, commonLegend, translate]);

  const perAgentChartOptions = useMemo(() => {
    if (!data?.perAgentStats || data.perAgentStats.length === 0) {
      return {};
    }
    const bubbleData = data.perAgentStats.map((agent: any) => {
      const total = agent.done + agent.failed;
      const failureRate =
        total > 0 ? Math.round((agent.failed / total) * 1000) / 10 : 0;
      const color =
        failureRate < 5 ? "#52c41a" : failureRate < 10 ? "#faad14" : "#ff4d4f";

      return {
        x: agent.done,
        y: failureRate,
        z: agent.avgDurationMs,
        name: agent.name,
        color: color + "bb",
        marker: { lineColor: color, lineWidth: 1 },
      };
    });

    return {
      chart: {
        type: "bubble",
        height: "320px",
        backgroundColor: "transparent",
        plotBorderWidth: 0,
      },
      title: { text: "" },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        ...commonAxis,
        title: {
          text: translate("agentAnalytic.axis.tasksDone"),
          style: { color: theme.text, fontSize: "10px" },
        },
      },
      yAxis: {
        ...commonAxis,
        min: 0,
        title: {
          text: translate("agentAnalytic.axis.failureRatePercent"),
          style: { color: theme.text, fontSize: "10px" },
        },
      },
      tooltip: {
        ...commonTooltip,
        useHTML: false,
        formatter(this: any) {
          return (
            `${String(this.point.name || "")}\n` +
            `${translate("agentAnalytic.tooltip.done")}: ${this.point.x}\n` +
            `${translate("agentAnalytic.tooltip.failureRate")}: ${this.point.y}%\n` +
            `${translate("agentAnalytic.tooltip.avgDuration")}: ${formatDuration(this.point.z)}`
          );
        },
      },
      plotOptions: {
        bubble: { minSize: 6, maxSize: 36 },
      },
      series: [{ name: "Agents", data: bubbleData }],
    };
  }, [data, commonAxis, commonTooltip, theme, translate]);

  const peakHoursChartOptions = useMemo(() => {
    if (!data?.hourlyActivity || data.hourlyActivity.length === 0) {
      return {
        chart: {
          type: "heatmap",
          height: "240px",
          backgroundColor: "transparent",
        },
        title: { text: "" },
        credits: { enabled: false },
      };
    }

    return {
      chart: {
        type: "heatmap",
        height: "240px",
        backgroundColor: "transparent",
      },
      title: { text: "" },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        ...commonAxis,
        categories: HOURS,
        labels: { style: { color: theme.text, fontSize: "9px" }, step: 3 },
      },
      yAxis: {
        ...commonAxis,
        categories: DAYS,
        title: { text: "" },
        reversed: true,
      },
      colorAxis: {
        min: 0,
        minColor: isLightMode ? "#f0f0f0" : "#111111",
        maxColor: "#52c41a",
      },
      tooltip: {
        ...commonTooltip,
        formatter(this: any) {
          return (
            `<b>${DAYS[this.point.y]}</b> ${this.point.x}:00<br/>` +
            `${translate("agentAnalytic.tooltip.tasks")}: <b>${this.point.value}</b>`
          );
        },
      },
      series: [
        {
          name: "Tasks",
          type: "heatmap",
          data: data.hourlyActivity,
          borderWidth: 2,
          borderColor: isLightMode ? "#ffffff" : "#0d0d0d",
        },
      ],
    };
  }, [data, commonAxis, commonTooltip, theme, isLightMode, translate]);

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
                <AnimatedNumbers animateToNumber={data.totalDone} />
              </div>
              <div className="stat-label">
                {translate("agentAnalytic.stat.done")}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-value" style={{ color: "#ff4d4f" }}>
                <AnimatedNumbers animateToNumber={data.totalFailed} />
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
                {formatDuration(data.avgDurationMs)}
              </div>
              <div className="stat-label">
                {translate("agentAnalytic.stat.avgDuration")}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-value" style={{ color: "#faad14" }}>
                <AnimatedNumbers animateToNumber={data.pendingNow} />
              </div>
              <div className="stat-label">
                {translate("agentAnalytic.stat.pending")}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-value" style={{ color: "#13c2c2" }}>
                <AnimatedNumbers animateToNumber={data.inProgressNow} />
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

            {data?.perAgentStats?.length > 0 ? (
              <HighchartsReact
                highcharts={Highcharts}
                options={perAgentChartOptions}
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

            <HighchartsReact
              highcharts={Highcharts}
              options={activityChartOptions}
            />
          </ChartBox>

          <ChartBox>
            <div className="chart-title">
              {showToolbar
                ? translate("agentAnalytic.chart.peakHours")
                : translate("agentAnalytic.chart.agentPeakHours")}
            </div>

            {data?.hourlyActivity?.length > 0 ? (
              <HighchartsReact
                highcharts={Highcharts}
                options={peakHoursChartOptions}
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
