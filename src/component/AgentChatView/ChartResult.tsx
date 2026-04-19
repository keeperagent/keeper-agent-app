import { useMemo } from "react";
import { connect } from "react-redux";
import ReactECharts from "echarts-for-react";
import { RootState } from "@/redux/store";

const CHART_COLORS = [
  "#6366F1", // indigo
  "#F97316", // orange
  "#8B5CF6", // violet
  "#10B981", // emerald
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#EC4899", // pink
  "#14B8A6", // teal
  "#A78BFA", // lavender
  "#34D399", // mint
];

const NON_COLOR_SERIES_TYPES = new Set(["candlestick", "k"]);

const buildTheme = (isLightMode: boolean) => ({
  text: isLightMode ? "#1e293b" : "#e2e8f0",
  subText: isLightMode ? "#64748b" : "#94a3b8",
  grid: isLightMode ? "rgba(99,102,241,0.04)" : "rgba(255,255,255,0.06)",
  radarWeb: isLightMode ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.15)",
  tooltipBg: isLightMode ? "#ffffff" : "#0f172a",
  tooltipBorder: isLightMode ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)",
  pieBorder: isLightMode ? "#ffffff" : "#111827",
});

const resolveChartFontFamily = (): string => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return '"JetBrains Mono", monospace';
  }
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue("--text-font-primary")
    .trim();
  return resolved || '"JetBrains Mono", monospace';
};

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const forceAxisTheme = (
  axisConfig: any,
  theme: ReturnType<typeof buildTheme>,
  isYAxis = false,
) => {
  if (!axisConfig || typeof axisConfig !== "object") {
    return axisConfig;
  }
  return {
    ...axisConfig,
    axisLabel: {
      fontSize: 11,
      ...axisConfig.axisLabel,
      color: theme.subText,
    },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: {
      ...axisConfig.splitLine,
      lineStyle: {
        ...axisConfig.splitLine?.lineStyle,
        color: theme.grid,
        width: 0.5,
      },
    },
    ...(axisConfig.name && {
      nameLocation: "middle",
      nameRotate: isYAxis ? 90 : 0,
      nameGap: isYAxis ? 52 : 28,
      nameTextStyle: {
        fontSize: 11,
        ...axisConfig.nameTextStyle,
        color: theme.subText,
      },
    }),
  };
};

const applyTheme = (
  rawOption: Record<string, unknown>,
  isLightMode: boolean,
): Record<string, unknown> => {
  const theme = buildTheme(isLightMode);
  const option = { ...rawOption };

  option.backgroundColor = "transparent";
  option.color = CHART_COLORS;

  const fontFamily = resolveChartFontFamily();
  option.textStyle = {
    fontFamily,
    ...((option.textStyle as Record<string, unknown>) || {}),
  };

  const hasTitle = !!option.title;
  if (option.title) {
    const titles = Array.isArray(option.title) ? option.title : [option.title];
    option.title = titles.map((titleItem: any) => ({
      top: 8,
      left: "center",
      ...titleItem,
      textStyle: {
        fontSize: 14,
        fontWeight: 600,
        ...titleItem.textStyle,
        color: theme.text,
      },
      subtextStyle: {
        fontSize: 12,
        ...titleItem.subtextStyle,
        color: theme.subText,
      },
    }));
  }

  if (option.legend) {
    const legends = Array.isArray(option.legend)
      ? option.legend
      : [option.legend];
    option.legend = legends.map((legendItem: any) => ({
      padding: [4, 16],
      itemGap: 16,
      itemWidth: 14,
      itemHeight: 14,
      ...legendItem,
      // Force bottom positioning after spread so LLM's top/left/right can't override
      top: "auto",
      bottom: 8,
      textStyle: {
        fontSize: 12,
        ...legendItem.textStyle,
        color: theme.subText,
      },
    }));
  }

  const isScatterChart =
    Array.isArray(rawOption.series) &&
    (rawOption.series as any[]).some(
      (s: any) => s?.type === "scatter" || s?.type === "effectScatter",
    );

  if (option.tooltip) {
    const tooltips = Array.isArray(option.tooltip)
      ? option.tooltip
      : [option.tooltip];
    option.tooltip = tooltips.map((tooltipItem: any) => {
      const base: any = {
        trigger: isScatterChart ? "item" : "axis",
        axisPointer: {
          type: "cross",
          crossStyle: { color: theme.grid, width: 1 },
        },
        ...tooltipItem,
        backgroundColor: theme.tooltipBg,
        borderColor: theme.tooltipBorder,
        borderRadius: 8,
        padding: [8, 12],
        textStyle: {
          fontSize: 12,
          ...tooltipItem.textStyle,
          color: theme.text,
        },
        extraCssText: `box-shadow: 0 8px 32px rgba(0,0,0,${isLightMode ? 0.12 : 0.4}); backdrop-filter: blur(8px);`,
      };

      // Inject a readable formatter for scatter/bubble charts when none provided
      if (isScatterChart && !tooltipItem.formatter) {
        const xAxisObj = Array.isArray(rawOption.xAxis)
          ? (rawOption.xAxis as any[])[0]
          : (rawOption.xAxis as any);
        const yAxisObj = Array.isArray(rawOption.yAxis)
          ? (rawOption.yAxis as any[])[0]
          : (rawOption.yAxis as any);
        const xLabel = xAxisObj?.name || "X";
        const yLabel = yAxisObj?.name || "Y";
        base.formatter = (params: any) => {
          const name = params.name || params.seriesName || "";
          const value = Array.isArray(params.value) ? params.value : [];
          const fmt = (v: any) =>
            typeof v === "number"
              ? Math.abs(v) >= 1000
                ? v.toLocaleString()
                : v.toFixed(2)
              : (v ?? "");
          const lines: string[] = [];
          if (name) {
            lines.push(`<b>${name}</b>`);
          }
          lines.push(`${xLabel}: ${fmt(value[0])}`);
          lines.push(`${yLabel}: ${fmt(value[1])}`);
          if (value[2] != null) {
            lines.push(`Size: ${fmt(value[2])}`);
          }
          return lines.join("<br/>");
        };
      }

      return base;
    });
  }

  if (option.xAxis !== undefined) {
    if (Array.isArray(option.xAxis)) {
      // Multiple xAxis at same position causes label duplication — alternate bottom/top
      option.xAxis = option.xAxis.map((axis: any, idx: number) =>
        forceAxisTheme(
          { position: idx === 0 ? "bottom" : "top", ...axis },
          theme,
          false,
        ),
      );
    } else {
      option.xAxis = forceAxisTheme(option.xAxis, theme, false);
    }
  }

  if (option.yAxis !== undefined) {
    if (Array.isArray(option.yAxis)) {
      // Cap at 2 yAxes — 3+ causes overlapping labels with no clean fix
      const capped = option.yAxis.slice(0, 2);
      option.yAxis = capped.map((axis: any, idx: number) =>
        forceAxisTheme(
          { position: idx === 0 ? "left" : "right", ...axis },
          theme,
          true,
        ),
      );
      // Reassign any series pointing at a dropped axis (index ≥ 2) to axis 1
      if (Array.isArray(option.series)) {
        option.series = (option.series as any[]).map((seriesItem: any) =>
          (seriesItem?.yAxisIndex ?? 0) >= 2
            ? { ...seriesItem, yAxisIndex: 1 }
            : seriesItem,
        );
      }
    } else {
      option.yAxis = forceAxisTheme(option.yAxis, theme, true);
    }
  }

  if (option.radar && typeof option.radar === "object") {
    const radar = option.radar as any;
    option.radar = {
      radius: "60%",
      center: ["50%", "52%"],
      ...radar,
      axisName: {
        color: theme.subText,
        fontSize: 11,
        formatter: (name: string) =>
          name && name.length > 14 ? name.slice(0, 13) + "…" : name,
        ...radar.axisName,
      },
      splitLine: {
        ...radar.splitLine,
        lineStyle: {
          width: 1,
          ...(radar.splitLine?.lineStyle || {}),
          color: theme.radarWeb,
        },
      },
      splitArea: { show: false, ...radar.splitArea },
      axisLine: {
        ...radar.axisLine,
        lineStyle: {
          width: 1,
          ...(radar.axisLine?.lineStyle || {}),
          color: theme.radarWeb,
        },
      },
    };
  }

  if (!option.grid) {
    const hasLegend = !!option.legend;
    const yAxes = option.yAxis
      ? ((Array.isArray(option.yAxis) ? option.yAxis : [option.yAxis]) as any[])
      : [];
    const xAxes = option.xAxis
      ? ((Array.isArray(option.xAxis) ? option.xAxis : [option.xAxis]) as any[])
      : [];
    const hasYAxisName = yAxes.some((axis: any) => axis?.name);
    const hasXAxisName = xAxes.some((axis: any) => axis?.name);
    const hasRightAxis = yAxes.length >= 2;
    option.grid = {
      top: hasTitle ? 64 : 24,
      right: hasRightAxis ? 72 : hasXAxisName ? 40 : 20,
      bottom: hasLegend ? 48 : hasXAxisName ? 40 : 20,
      left: hasYAxisName ? 50 : 16,
      containLabel: true,
    };
  }

  const isHorizontalBar = (() => {
    const xAxisObj = Array.isArray(rawOption.xAxis)
      ? (rawOption.xAxis as any[])[0]
      : (rawOption.xAxis as any);
    const yAxisObj = Array.isArray(rawOption.yAxis)
      ? (rawOption.yAxis as any[])[0]
      : (rawOption.yAxis as any);
    return xAxisObj?.type === "value" && yAxisObj?.type === "category";
  })();

  const totalRadarPolygons = Array.isArray(option.series)
    ? (option.series as any[])
        .filter((s) => s?.type === "radar")
        .reduce(
          (sum: number, radarSeries: any) =>
            sum +
            (Array.isArray(radarSeries.data) ? radarSeries.data.length : 0),
          0,
        )
    : 0;

  if (Array.isArray(option.series)) {
    let colorIndex = 0;
    option.series = option.series.map((seriesItem: any) => {
      if (NON_COLOR_SERIES_TYPES.has(seriesItem?.type)) {
        return seriesItem;
      }

      const seriesColor = CHART_COLORS[colorIndex % CHART_COLORS.length];
      colorIndex += 1;

      const { color: _ic, ...safeItemStyle } = (seriesItem.itemStyle ||
        {}) as any;
      const { color: _lc, ...safeLineStyle } = (seriesItem.lineStyle ||
        {}) as any;
      const { color: _ac, ...safeAreaStyle } = (seriesItem.areaStyle ||
        {}) as any;

      const result: any = { ...seriesItem, itemStyle: safeItemStyle };

      if (seriesItem.type === "line") {
        result.smooth = seriesItem.smooth ?? true;
        result.symbol = seriesItem.symbol ?? "circle";
        result.symbolSize = seriesItem.symbolSize ?? 6;
        result.lineStyle = {
          width: 3,
          shadowBlur: 12,
          shadowColor: hexToRgba(seriesColor, 0.3),
          shadowOffsetY: 6,
          ...safeLineStyle,
        };
        result.itemStyle = {
          borderWidth: 2,
          borderColor: theme.pieBorder,
          ...safeItemStyle,
        };
        result.areaStyle = {
          ...safeAreaStyle,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: hexToRgba(seriesColor, 0.25) },
              { offset: 1, color: hexToRgba(seriesColor, 0) },
            ],
          },
        };
      }

      if (seriesItem.type === "bar") {
        const barRadius = isHorizontalBar
          ? [999, 999, 999, 999]
          : [10, 10, 0, 0];
        result.itemStyle = {
          borderRadius: barRadius,
          shadowBlur: 8,
          shadowColor: hexToRgba(seriesColor, 0.2),
          shadowOffsetY: 4,
          ...safeItemStyle,
        };
        result.barMaxWidth = seriesItem.barMaxWidth ?? 36;
      }

      if (seriesItem.type === "pie") {
        if (!seriesItem.radius) {
          result.radius = hasTitle ? ["48%", "72%"] : ["55%", "80%"];
        }
        if (!seriesItem.center) {
          result.center = hasTitle ? ["50%", "58%"] : ["50%", "50%"];
        }
        if (seriesItem.avoidLabelOverlap === undefined) {
          result.avoidLabelOverlap = true;
        }
        result.minAngle = seriesItem.minAngle ?? 2;
        result.labelLine = {
          length: 10,
          length2: 12,
          smooth: true,
          ...(seriesItem.labelLine || {}),
        };
        result.itemStyle = {
          borderRadius: 8,
          borderWidth: 3,
          borderColor: theme.pieBorder,
          shadowBlur: 12,
          shadowColor: hexToRgba(seriesColor, 0.15),
          ...safeItemStyle,
        };
        const rawLabel = (seriesItem.label || {}) as any;
        const {
          color: _lblColor,
          textBorderColor: _lblTbColor,
          textBorderWidth: _lblTbWidth,
          ...safeLabel
        } = rawLabel;
        result.label = {
          show: true,
          position: "outside",
          formatter: "{b}\n{d}%",
          fontSize: 12,
          lineHeight: 16,
          ...safeLabel,
          color: theme.text,
          textBorderWidth: 0,
        };
      }

      if (seriesItem.type === "radar") {
        const rawData: any[] = Array.isArray(seriesItem.data)
          ? seriesItem.data
          : [];
        const entityCount = rawData.length;
        const singleEntry = entityCount <= 1;
        const fillAlpha = totalRadarPolygons <= 1 ? 0.25 : 0.13;

        result.symbol = seriesItem.symbol ?? "circle";
        result.symbolSize = seriesItem.symbolSize ?? 5;

        result.data = rawData.map((entry: any, entryIndex: number) => {
          const palette = singleEntry
            ? seriesColor
            : CHART_COLORS[entryIndex % CHART_COLORS.length];
          const entryObj =
            typeof entry === "object" && entry !== null && !Array.isArray(entry)
              ? entry
              : { value: entry };
          const { color: _eic, ...safeEntryItemStyle } = (entryObj.itemStyle ||
            {}) as any;
          const { color: _elc, ...safeEntryLineStyle } = (entryObj.lineStyle ||
            {}) as any;
          const { color: _eac, ...safeEntryAreaStyle } = (entryObj.areaStyle ||
            {}) as any;
          return {
            ...entryObj,
            lineStyle: {
              width: 2.5,
              ...safeEntryLineStyle,
              color: palette,
            },
            itemStyle: {
              borderWidth: 2,
              borderColor: theme.pieBorder,
              ...safeEntryItemStyle,
              color: palette,
            },
            areaStyle: {
              ...safeEntryAreaStyle,
              color: hexToRgba(palette, fillAlpha),
            },
          };
        });
      }

      if (
        seriesItem.type === "scatter" ||
        seriesItem.type === "effectScatter"
      ) {
        const rawData: any[] = Array.isArray(seriesItem.data)
          ? seriesItem.data
          : [];
        // Normalize object-format data {x, y, value/size} → [x, y, size] arrays
        const normalized = rawData.map((point: any) => {
          if (Array.isArray(point)) {
            return point;
          }
          if (typeof point === "object" && point !== null) {
            const x = point.x ?? point.value?.[0] ?? 0;
            const y = point.y ?? point.value?.[1] ?? 0;
            const size =
              point.size ??
              point.symbolSize ??
              point.value?.[2] ??
              point.marketCap ??
              point.cap ??
              0;
            return [x, y, size];
          }
          return point;
        });

        // Auto symbolSize function when data has a 3rd element (bubble size)
        const hasBubbleSize = normalized.some(
          (point: any) =>
            Array.isArray(point) && point.length >= 3 && point[2] > 0,
        );
        if (hasBubbleSize && typeof seriesItem.symbolSize !== "number") {
          const sizes = normalized.map((point: any) =>
            Array.isArray(point) ? (point[2] ?? 0) : 0,
          );
          const maxSize = Math.max(...sizes) || 1;
          result.symbolSize = (dataItem: any) => {
            const rawSize = Array.isArray(dataItem) ? (dataItem[2] ?? 0) : 0;
            return 26 + (rawSize / maxSize) * 82;
          };
        } else if (seriesItem.symbolSize === undefined) {
          result.symbolSize = 32;
        }

        // Assign a distinct palette color per data point, preserving name for tooltip
        result.data = normalized.map((point: any, pointIndex: number) => {
          const originalPoint = rawData[pointIndex];
          const name =
            originalPoint?.name ??
            originalPoint?.label ??
            originalPoint?.coin ??
            originalPoint?.symbol ??
            "";
          return {
            name,
            value: point,
            itemStyle: {
              color: CHART_COLORS[pointIndex % CHART_COLORS.length],
            },
          };
        });
      }

      return result;
    });
  }

  return option;
};

type Props = {
  option: Record<string, unknown>;
  height?: number;
  isLightMode: boolean;
};

const ChartResult = ({ option, height = 400, isLightMode }: Props) => {
  const themedOption = useMemo(
    () => applyTheme(option, isLightMode),
    [option, isLightMode],
  );

  return (
    <div
      style={{
        marginTop: 8,
        width: "100%",
        background: isLightMode ? "rgba(99, 102, 241, 0.05)" : "#13111c",
        borderRadius: 16,
        padding: "20px 16px 12px",
        border: `1px solid ${isLightMode ? "var(--color-border)" : "#251a2a"}`,
      }}
    >
      <ReactECharts
        option={themedOption}
        style={{ height: `${height}px`, width: "100%" }}
        notMerge
        lazyUpdate
      />
    </div>
  );
};

export default connect((state: RootState) => ({
  isLightMode: state?.Layout?.isLightMode ?? true,
}))(ChartResult);
