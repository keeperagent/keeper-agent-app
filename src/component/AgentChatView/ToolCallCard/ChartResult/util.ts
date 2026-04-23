const CHART_COLORS = [
  "#6366F1",
  "#F97316",
  "#8B5CF6",
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#EC4899",
  "#14B8A6",
  "#A78BFA",
  "#34D399",
];

const NON_COLOR_SERIES_TYPES = new Set(["candlestick", "k"]);

const toArray = <T>(value: T | T[]): T[] =>
  Array.isArray(value) ? value : [value];

export const buildTheme = (isLightMode: boolean) => ({
  text: isLightMode ? "#1e293b" : "#e2e8f0",
  subText: isLightMode ? "#64748b" : "#94a3b8",
  grid: isLightMode ? "rgba(99,102,241,0.04)" : "rgba(255,255,255,0.06)",
  radarWeb: isLightMode ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.15)",
  tooltipBg: isLightMode ? "#ffffff" : "#0f172a",
  tooltipBorder: isLightMode ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)",
  pieBorder: isLightMode ? "#ffffff" : "#111827",
});

export type ChartTheme = ReturnType<typeof buildTheme>;

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const compactNumber = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return (
      (value / 1_000_000_000)
        .toFixed(abs >= 10_000_000_000 ? 0 : 1)
        .replace(/\.0$/, "") + "B"
    );
  }
  if (abs >= 1_000_000) {
    return (
      (value / 1_000_000)
        .toFixed(abs >= 10_000_000 ? 0 : 1)
        .replace(/\.0$/, "") + "M"
    );
  }
  if (abs >= 1_000) {
    return (
      (value / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.0$/, "") + "k"
    );
  }
  return String(value);
};

export const forceAxisTheme = (
  axisConfig: any,
  theme: ChartTheme,
  isYAxis = false,
) => {
  if (!axisConfig || typeof axisConfig !== "object") {
    return axisConfig;
  }

  const rawFormatter = axisConfig.axisLabel?.formatter;
  const agentFormatter =
    typeof rawFormatter === "function" ? rawFormatter : null;

  let yAxisFormatter: ((value: number) => string) | undefined;
  if (isYAxis) {
    if (typeof rawFormatter === "string" && rawFormatter.includes("{value}")) {
      const parts = rawFormatter.split("{value}");
      const prefix = parts[0];
      const suffix = parts[1] || "";
      yAxisFormatter = (value: number) =>
        prefix + compactNumber(value) + suffix;
    } else {
      const sample = agentFormatter ? agentFormatter(1000) : null;
      const detectedPrefix =
        typeof sample === "string" && /^[^0-9-]/.test(sample)
          ? sample.charAt(0)
          : "";
      yAxisFormatter = (value: number) => detectedPrefix + compactNumber(value);
    }
  }

  return {
    ...axisConfig,
    axisLabel: {
      fontSize: 11,
      ...axisConfig.axisLabel,
      color: theme.subText,
      ...(isYAxis && { formatter: yAxisFormatter }),
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

const applyTitleTheme = (option: any, theme: ChartTheme) => {
  if (!option.title) {
    return;
  }

  option.title = toArray(option.title).map((titleItem: any) => ({
    ...titleItem,
    top: 8,
    left: "center",
    textStyle: {
      ...titleItem.textStyle,
      fontSize: 14,
      fontWeight: 600,
      color: theme.text,
    },
    subtextStyle: {
      ...titleItem.subtextStyle,
      fontSize: 12,
      color: theme.subText,
    },
  }));
};

const applyLegendTheme = (option: any, theme: ChartTheme) => {
  if (!option.legend) {
    return;
  }

  option.legend = toArray(option.legend).map((legendItem: any) => ({
    ...legendItem,
    padding: [4, 16],
    itemGap: 16,
    itemWidth: 14,
    itemHeight: 14,
    top: "auto",
    bottom: 16,
    textStyle: {
      fontSize: 12,
      ...legendItem.textStyle,
      color: theme.subText,
    },
  }));
};

const escHtml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const applyTooltipTheme = (
  option: any,
  theme: ChartTheme,
  isScatterChart: boolean,
  isLightMode: boolean,
  xAxisObj: any,
  yAxisObj: any,
) => {
  if (!option.tooltip) {
    return;
  }

  option.tooltip = toArray(option.tooltip).map((tooltipItem: any) => {
    const base: any = {
      ...tooltipItem,
      trigger: isScatterChart ? "item" : "axis",
      axisPointer: {
        type: "cross",
        crossStyle: { color: theme.grid, width: 1 },
      },
      backgroundColor: theme.tooltipBg,
      borderColor: theme.tooltipBorder,
      borderRadius: 8,
      padding: [8, 12],
      textStyle: {
        ...tooltipItem.textStyle,
        fontSize: 12,
        color: theme.text,
      },
      extraCssText: `box-shadow: 0 8px 32px rgba(0,0,0,${isLightMode ? 0.12 : 0.4}); backdrop-filter: blur(8px);`,
    };

    if (isScatterChart && !tooltipItem.formatter) {
      const xLabel = xAxisObj?.name || "X";
      const yLabel = yAxisObj?.name || "Y";
      base.formatter = (params: any) => {
        const name = params.name || params.seriesName || "";
        const value = Array.isArray(params.value) ? params.value : [];
        const fmt = (val: any) =>
          typeof val === "number"
            ? Math.abs(val) >= 1000
              ? val.toLocaleString()
              : val.toFixed(2)
            : escHtml(String(val || ""));
        const lines: string[] = [];
        if (name) {
          lines.push(`<b>${escHtml(name)}</b>`);
        }
        lines.push(`${escHtml(xLabel)}: ${fmt(value[0])}`);
        lines.push(`${escHtml(yLabel)}: ${fmt(value[1])}`);
        if (value[2] != null) {
          lines.push(`Size: ${fmt(value[2])}`);
        }
        return lines.join("<br/>");
      };
    }

    return base;
  });
};

const applyXAxisTheme = (option: any, theme: ChartTheme) => {
  if (option.xAxis === undefined) {
    return;
  }
  if (Array.isArray(option.xAxis)) {
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
};

const applyYAxisTheme = (option: any, theme: ChartTheme) => {
  if (option.yAxis === undefined) {
    return;
  }
  if (Array.isArray(option.yAxis)) {
    const capped = option.yAxis.slice(0, 2);
    option.yAxis = capped.map((axis: any, idx: number) =>
      forceAxisTheme(
        { position: idx === 0 ? "left" : "right", ...axis },
        theme,
        true,
      ),
    );
    if (Array.isArray(option.series)) {
      option.series = option.series.map((seriesItem: any) =>
        (seriesItem?.yAxisIndex || 0) >= 2
          ? { ...seriesItem, yAxisIndex: 1 }
          : seriesItem,
      );
    }
  } else {
    option.yAxis = forceAxisTheme(option.yAxis, theme, true);
  }
};

const applyRadarTheme = (option: any, theme: ChartTheme) => {
  if (!option.radar || typeof option.radar !== "object") {
    return;
  }
  const radar = option.radar as any;
  option.radar = {
    radius: "60%",
    center: ["50%", "52%"],
    ...radar,
    axisName: {
      ...radar.axisName,
      color: theme.subText,
      fontSize: 11,
      formatter: (name: string) =>
        name && name.length > 14 ? name.slice(0, 13) + "…" : name,
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
};

const CANDLESTICK_BULLISH = "#7FC8A9";
const CANDLESTICK_BEARISH = "#FF6767";

const applyCandlestickTheme = (option: any): void => {
  if (!Array.isArray(option.series)) {
    return;
  }

  const candlestickSeries = option.series.filter(
    (item: any) => item?.type === "candlestick" || item?.type === "k",
  );

  if (candlestickSeries.length === 0) {
    return;
  }

  option.series = option.series.map((seriesItem: any) => {
    if (seriesItem?.type !== "candlestick" && seriesItem?.type !== "k") {
      return seriesItem;
    }
    return {
      ...seriesItem,
      itemStyle: {
        ...seriesItem.itemStyle,
        color: CANDLESTICK_BULLISH,
        color0: CANDLESTICK_BEARISH,
        borderColor: CANDLESTICK_BULLISH,
        borderColor0: CANDLESTICK_BEARISH,
      },
    };
  });

  const allLows: number[] = [];
  const allHighs: number[] = [];
  candlestickSeries.forEach((seriesItem: any) => {
    if (!Array.isArray(seriesItem.data)) {
      return;
    }
    seriesItem.data.forEach((point: any) => {
      const values = Array.isArray(point)
        ? point
        : point && Array.isArray(point.value)
          ? point.value
          : null;
      if (!values) {
        return;
      }
      if (typeof values[2] === "number") {
        allLows.push(values[2]);
      }
      if (typeof values[3] === "number") {
        allHighs.push(values[3]);
      }
    });
  });

  if (allLows.length > 0 && option.yAxis) {
    const dataMin = Math.min(...allLows);
    const dataMax = Math.max(...(allHighs.length > 0 ? allHighs : allLows));
    const padding = (dataMax - dataMin) * 0.3;
    const paddedMin = Math.max(0, dataMin - padding);

    if (Array.isArray(option.yAxis)) {
      option.yAxis = option.yAxis.map((axis: any, index: number) =>
        index === 0 ? { ...axis, min: paddedMin } : axis,
      );
    } else {
      option.yAxis = { ...option.yAxis, min: paddedMin };
    }
  }
};

const applyGridTheme = (option: any, hasTitle: boolean) => {
  const yAxes = option.yAxis ? toArray(option.yAxis) : [];
  const xAxes = option.xAxis ? toArray(option.xAxis) : [];
  const hasLegend = Boolean(option.legend);
  const hasYAxisName = yAxes.some((axis: any) => axis?.name);
  const hasXAxisName = xAxes.some((axis: any) => axis?.name);
  const hasRightAxis = yAxes.length >= 2;

  option.grid = {
    top: hasTitle ? 64 : 24,
    right: hasRightAxis ? 72 : hasXAxisName ? 40 : 20,
    bottom: hasLegend ? 72 : hasXAxisName ? 40 : 20,
    left: hasYAxisName ? 44 : 16,
    containLabel: true,
  };
};

type SafeStyles = {
  safeItemStyle: Record<string, unknown>;
  safeLineStyle: Record<string, unknown>;
  safeAreaStyle: Record<string, unknown>;
};

type SeriesContext = {
  seriesColor: string;
  theme: ChartTheme;
  isHorizontalBar: boolean;
  hasTitle: boolean;
  totalRadarPolygons: number;
};

type SeriesStyler = (
  result: any,
  seriesItem: any,
  styles: SafeStyles,
  ctx: SeriesContext,
) => void;

const applyLineSeriesStyle: SeriesStyler = (
  result,
  seriesItem,
  { safeItemStyle, safeLineStyle, safeAreaStyle },
  { seriesColor, theme },
) => {
  result.smooth = seriesItem.smooth ?? true;
  result.symbol = seriesItem.symbol || "circle";
  result.symbolSize = seriesItem.symbolSize || 6;
  result.lineStyle = {
    ...safeLineStyle,
    width: 3,
    shadowBlur: 12,
    shadowColor: hexToRgba(seriesColor, 0.3),
    shadowOffsetY: 6,
  };
  result.itemStyle = {
    ...safeItemStyle,
    borderWidth: 2,
    borderColor: theme.pieBorder,
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
};

const applyBarSeriesStyle: SeriesStyler = (
  result,
  seriesItem,
  { safeItemStyle },
  { seriesColor, isHorizontalBar },
) => {
  const barRadius = isHorizontalBar ? [999, 999, 999, 999] : [10, 10, 0, 0];
  result.itemStyle = {
    ...safeItemStyle,
    borderRadius: barRadius,
    shadowBlur: 8,
    shadowColor: hexToRgba(seriesColor, 0.2),
    shadowOffsetY: 4,
  };
  result.barMaxWidth = seriesItem.barMaxWidth ?? 36;
};

const applyPieSeriesStyle: SeriesStyler = (
  result,
  seriesItem,
  { safeItemStyle },
  { seriesColor, theme, hasTitle },
) => {
  if (!seriesItem.radius) {
    result.radius = hasTitle ? ["48%", "72%"] : ["55%", "80%"];
  }
  if (!seriesItem.center) {
    result.center = hasTitle ? ["50%", "58%"] : ["50%", "50%"];
  }
  if (seriesItem.avoidLabelOverlap === undefined) {
    result.avoidLabelOverlap = true;
  }
  result.minAngle = seriesItem.minAngle || 2;
  result.labelLine = {
    ...(seriesItem.labelLine || {}),
    length: 10,
    length2: 12,
    smooth: true,
  };
  result.itemStyle = {
    ...safeItemStyle,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: theme.pieBorder,
    shadowBlur: 12,
    shadowColor: hexToRgba(seriesColor, 0.15),
  };
  const rawLabel = (seriesItem.label || {}) as any;
  const {
    color: _lblColor,
    textBorderColor: _lblTbColor,
    textBorderWidth: _lblTbWidth,
    ...safeLabel
  } = rawLabel;
  result.label = {
    ...safeLabel,
    show: true,
    position: "outside",
    formatter: "{b}\n{d}%",
    fontSize: 12,
    lineHeight: 16,
    color: theme.text,
    textBorderWidth: 0,
  };
};

const applyRadarSeriesStyle: SeriesStyler = (
  result,
  seriesItem,
  _styles,
  { seriesColor, theme, totalRadarPolygons },
) => {
  const rawData: any[] = Array.isArray(seriesItem.data) ? seriesItem.data : [];
  const singleEntry = rawData.length <= 1;
  const fillAlpha = totalRadarPolygons <= 1 ? 0.25 : 0.13;
  result.symbol = seriesItem.symbol || "circle";
  result.symbolSize = seriesItem.symbolSize || 5;
  result.data = rawData.map((entry: any, entryIndex: number) => {
    const palette = singleEntry
      ? seriesColor
      : CHART_COLORS[entryIndex % CHART_COLORS.length];
    const entryObj =
      typeof entry === "object" && entry !== null && !Array.isArray(entry)
        ? entry
        : { value: entry };
    const { color: _eic, ...safeEntryItemStyle } = entryObj.itemStyle || {};
    const { color: _elc, ...safeEntryLineStyle } = entryObj.lineStyle || {};
    const { color: _eac, ...safeEntryAreaStyle } = entryObj.areaStyle || {};

    return {
      ...entryObj,
      lineStyle: { ...safeEntryLineStyle, width: 2.5, color: palette },
      itemStyle: {
        ...safeEntryItemStyle,
        borderWidth: 2,
        borderColor: theme.pieBorder,
        color: palette,
      },
      areaStyle: {
        ...safeEntryAreaStyle,
        color: hexToRgba(palette, fillAlpha),
      },
    };
  });
};

const applyScatterSeriesStyle: SeriesStyler = (result, seriesItem) => {
  const rawData: any[] = Array.isArray(seriesItem.data) ? seriesItem.data : [];
  const normalized = rawData.map((point: any) => {
    if (Array.isArray(point)) {
      return point;
    }

    if (typeof point === "object" && point !== null) {
      const x = point.x || point.value?.[0] || 0;
      const y = point.y || point.value?.[1] || 0;
      const size =
        point.size ||
        point.symbolSize ||
        point.value?.[2] ||
        point.marketCap ||
        point.cap ||
        0;
      return [x, y, size];
    }

    return point;
  });

  const hasBubbleSize = normalized.some(
    (point: any) => Array.isArray(point) && point.length >= 3 && point[2] > 0,
  );
  if (hasBubbleSize && typeof seriesItem.symbolSize !== "number") {
    const sizes = normalized.map((point: any) =>
      Array.isArray(point) ? point[2] : 0,
    );
    const maxSize = Math.max(...sizes) || 1;
    result.symbolSize = (dataItem: any) => {
      const rawSize = Array.isArray(dataItem) ? dataItem[2] : 0;
      return 26 + (rawSize / maxSize) * 82;
    };
  } else if (seriesItem.symbolSize === undefined) {
    result.symbolSize = 32;
  }

  result.data = normalized.map((point: any, pointIndex: number) => {
    const originalPoint = rawData[pointIndex];
    const name =
      originalPoint?.name ||
      originalPoint?.label ||
      originalPoint?.coin ||
      originalPoint?.symbol ||
      "";
    return {
      name,
      value: point,
      itemStyle: { color: CHART_COLORS[pointIndex % CHART_COLORS.length] },
    };
  });
};

const seriesStylers: Partial<Record<string, SeriesStyler>> = {
  line: applyLineSeriesStyle,
  bar: applyBarSeriesStyle,
  pie: applyPieSeriesStyle,
  radar: applyRadarSeriesStyle,
  scatter: applyScatterSeriesStyle,
  effectScatter: applyScatterSeriesStyle,
};

const applySeriesTheme = (
  option: any,
  theme: ChartTheme,
  isHorizontalBar: boolean,
  hasTitle: boolean,
) => {
  if (!Array.isArray(option.series)) {
    return;
  }

  const totalRadarPolygons = option.series
    .filter((item: any) => item?.type === "radar")
    .reduce(
      (sum: number, radarSeries: any) =>
        sum + (Array.isArray(radarSeries.data) ? radarSeries.data.length : 0),
      0,
    );

  let colorIndex = 0;
  option.series = option.series.map((seriesItem: any) => {
    if (NON_COLOR_SERIES_TYPES.has(seriesItem?.type)) {
      return seriesItem;
    }

    const seriesColor = CHART_COLORS[colorIndex % CHART_COLORS.length];
    colorIndex += 1;

    const { color: _ic, ...safeItemStyle } = seriesItem.itemStyle || {};
    const { color: _lc, ...safeLineStyle } = seriesItem.lineStyle || {};
    const { color: _ac, ...safeAreaStyle } = seriesItem.areaStyle || {};

    const result = { ...seriesItem, itemStyle: safeItemStyle };
    const ctx: SeriesContext = {
      seriesColor,
      theme,
      isHorizontalBar,
      hasTitle,
      totalRadarPolygons,
    };
    seriesStylers[seriesItem?.type]?.(
      result,
      seriesItem,
      { safeItemStyle, safeLineStyle, safeAreaStyle },
      ctx,
    );

    return result;
  });
};

export const applyTheme = (
  rawOption: Record<string, unknown>,
  isLightMode: boolean,
): Record<string, unknown> => {
  const theme = buildTheme(isLightMode);
  const option = { ...rawOption };

  option.backgroundColor = "transparent";
  option.color = CHART_COLORS;
  option.textStyle = {
    fontFamily: '"JetBrains Mono", monospace',
    ...(option.textStyle || {}),
  };

  const hasTitle = Boolean(option.title);
  const xAxisObj = Array.isArray(rawOption.xAxis)
    ? rawOption.xAxis[0]
    : rawOption.xAxis;
  const yAxisObj = Array.isArray(rawOption.yAxis)
    ? rawOption.yAxis[0]
    : rawOption.yAxis;
  const isHorizontalBar =
    (xAxisObj as any)?.type === "value" &&
    (yAxisObj as any)?.type === "category";
  const isScatterChart =
    Array.isArray(rawOption.series) &&
    (rawOption.series as any[]).some(
      (item: any) => item?.type === "scatter" || item?.type === "effectScatter",
    );

  applyTitleTheme(option, theme);
  applyLegendTheme(option, theme);
  applyTooltipTheme(
    option,
    theme,
    isScatterChart,
    isLightMode,
    xAxisObj,
    yAxisObj,
  );
  applyXAxisTheme(option, theme);
  applyYAxisTheme(option, theme);
  applyCandlestickTheme(option);
  applyRadarTheme(option, theme);
  applyGridTheme(option, hasTitle);
  applySeriesTheme(option, theme, isHorizontalBar, hasTitle);

  return option;
};
