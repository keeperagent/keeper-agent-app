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
            ? val.toLocaleString(undefined, {
                maximumFractionDigits: 4,
                minimumFractionDigits: Math.abs(val) < 1 ? 2 : 0,
              })
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

const CARTESIAN_SERIES_TYPES = new Set([
  "line",
  "bar",
  "scatter",
  "effectScatter",
  "candlestick",
  "k",
  "heatmap",
]);

const injectDefaultAxes = (option: any) => {
  if (!Array.isArray(option.series)) {
    return;
  }

  const hasCartesian = option.series.some((seriesItem: any) =>
    CARTESIAN_SERIES_TYPES.has(seriesItem?.type),
  );
  if (!hasCartesian) {
    return;
  }
  if (option.xAxis === undefined) {
    option.xAxis = {};
  }
  if (option.yAxis === undefined) {
    option.yAxis = {};
  }

  const xAxis = option.xAxis;
  if (!Array.isArray(xAxis) && !xAxis.type && !xAxis.data) {
    // Bar series: extract category names from {name, value} per-item format
    // and flatten data to plain number arrays across all bar series.
    const barSeries = option.series.find(
      (seriesItem: any) =>
        seriesItem?.type === "bar" && Array.isArray(seriesItem.data),
    );
    if (barSeries) {
      const names = barSeries.data
        .map((dataItem: any) =>
          dataItem &&
          typeof dataItem === "object" &&
          typeof dataItem.name === "string"
            ? dataItem.name
            : null,
        )
        .filter(Boolean);

      if (names.length === barSeries.data.length && names.length > 0) {
        option.xAxis = { ...xAxis, type: "category", data: names };
        // Flatten {name, value, itemStyle} per-item objects to plain numbers
        // across all bar series so ECharts doesn't ignore xAxis.data labels.
        option.series = option.series.map((seriesItem: any) => {
          if (seriesItem?.type !== "bar" || !Array.isArray(seriesItem.data)) {
            return seriesItem;
          }

          const hasObjectItems = seriesItem.data.some(
            (item: any) =>
              item !== null &&
              typeof item === "object" &&
              !Array.isArray(item) &&
              "value" in item,
          );
          if (!hasObjectItems) {
            return seriesItem;
          }

          return {
            ...seriesItem,
            data: seriesItem.data.map((item: any) => {
              if (
                item !== null &&
                typeof item === "object" &&
                !Array.isArray(item) &&
                "value" in item
              ) {
                return typeof item.value === "number" ? item.value : 0;
              }

              return item;
            }),
          };
        });

        return;
      }
    }

    // Plain-array line/bar series with no xAxis type: force category so ECharts doesn't
    // switch to value axis when scatter series are also present (which causes diagonal rendering).
    const plainLineSeries = option.series.find(
      (seriesItem: any) =>
        (seriesItem?.type === "line" || seriesItem?.type === "bar") &&
        Array.isArray(seriesItem.data) &&
        seriesItem.data.length > 0 &&
        !Array.isArray(seriesItem.data[0]),
    );
    if (plainLineSeries) {
      option.xAxis = { ...xAxis, type: "category" };
    }

    // Line/bar series with [[number, value], ...] pairs and no xAxis type: the LLM intended
    // the x numbers as category labels (years, months, quarters, etc.), not coordinates.
    // Without an explicit type ECharts uses a linear axis starting at 0, collapsing all
    // points to one side. Convert to category axis + plain value arrays.
    // Scatter is excluded — it uses [x, y] pairs as true numeric coordinates.
    const pairSeries = option.series.find(
      (seriesItem: any) =>
        (seriesItem?.type === "line" || seriesItem?.type === "bar") &&
        Array.isArray(seriesItem.data) &&
        seriesItem.data.length > 0 &&
        Array.isArray(seriesItem.data[0]) &&
        typeof seriesItem.data[0][0] === "number",
    );

    if (pairSeries) {
      const xValues = pairSeries.data.map((point: any) => String(point[0]));
      option.xAxis = { ...xAxis, type: "category", data: xValues };

      // Flatten all line/bar series that use the same [xNum, value] pair format
      option.series = option.series.map((seriesItem: any) => {
        if (seriesItem?.type !== "line" && seriesItem?.type !== "bar") {
          return seriesItem;
        }
        if (!Array.isArray(seriesItem.data)) {
          return seriesItem;
        }
        const allPairs = seriesItem.data.every(
          (point: any) => Array.isArray(point) && typeof point[0] === "number",
        );
        if (!allPairs) {
          return seriesItem;
        }
        const flatData = seriesItem.data.map((point: any) => {
          const matchedIndex = xValues.indexOf(String(point[0]));
          return matchedIndex !== -1 ? point[1] : null;
        });

        return { ...seriesItem, data: flatData };
      });
    }
  }
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
  const radarSeries = Array.isArray(option.series)
    ? option.series.filter((seriesItem: any) => seriesItem?.type === "radar")
    : [];
  if (radarSeries.length === 0) {
    return;
  }

  // Auto-inject radar config when the LLM omitted it — without indicator
  // the chart renders completely blank.
  if (!option.radar || typeof option.radar !== "object") {
    // Determine dimension count from the first data entry found
    let dimCount = 5;
    for (const seriesItem of radarSeries) {
      const firstEntry = Array.isArray(seriesItem.data)
        ? seriesItem.data[0]
        : null;
      const values = firstEntry?.value || firstEntry;
      if (Array.isArray(values) && values.length > 0) {
        dimCount = values.length;
        break;
      }
    }
    // Find max value across all data to set indicator max
    let maxVal = 10;
    for (const seriesItem of radarSeries) {
      if (!Array.isArray(seriesItem.data)) {
        continue;
      }
      for (const entry of seriesItem.data) {
        const values = entry?.value || entry;
        if (Array.isArray(values)) {
          const entryMax = Math.max(
            ...values.filter((value: any) => typeof value === "number"),
          );
          if (entryMax > maxVal) {
            maxVal = entryMax;
          }
        }
      }
    }
    option.radar = {
      indicator: Array.from({ length: dimCount }, (_, idx) => ({
        name: `Dim ${idx + 1}`,
        max: maxVal,
      })),
    };
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

const applyHeatmapTheme = (option: any, theme: ChartTheme) => {
  const heatmapSeries = Array.isArray(option.series)
    ? option.series.find((seriesItem: any) => seriesItem?.type === "heatmap")
    : null;
  if (!heatmapSeries) {
    return;
  }

  // Heatmap axes must be category type — numeric axes cause blank rendering
  if (option.xAxis && !Array.isArray(option.xAxis) && !option.xAxis.type) {
    option.xAxis = { ...option.xAxis, type: "category" };
  }
  if (option.yAxis && !Array.isArray(option.yAxis) && !option.yAxis.type) {
    option.yAxis = { ...option.yAxis, type: "category" };
  }

  // Always normalize visualMap position to bottom-center so it doesn't overlap the grid
  if (option.visualMap && !Array.isArray(option.visualMap)) {
    option.visualMap = {
      ...option.visualMap,
      orient: "horizontal",
      left: "center",
      bottom: 16,
    };
  }

  // Without visualMap, heatmap cells are invisible — auto-inject from data range
  if (!option.visualMap) {
    const dataValues = Array.isArray(heatmapSeries.data)
      ? (heatmapSeries.data as any[])
          .map((point: any) => {
            if (Array.isArray(point)) {
              return point[2];
            } else if (Array.isArray(point?.value)) {
              return point.value[2];
            } else if (typeof point?.value === "number") {
              return point.value;
            } else {
              return null;
            }
          })
          .filter((value: any) => typeof value === "number")
      : [];
    const minVal = dataValues.length > 0 ? Math.min(...dataValues) : 0;
    const maxVal = dataValues.length > 0 ? Math.max(...dataValues) : 10;

    option.visualMap = {
      min: minVal,
      max: maxVal,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      inRange: {
        color: ["#1e293b", "#4338ca", "#6366F1", "#F97316", "#fb923c"],
      },
      textStyle: { color: theme.subText, fontSize: 11 },
    };
  }
};

const applyGridTheme = (option: any, hasTitle: boolean) => {
  const yAxes = option.yAxis ? toArray(option.yAxis) : [];
  const xAxes = option.xAxis ? toArray(option.xAxis) : [];
  const hasLegend = Boolean(option.legend);
  const hasVisualMap = Boolean(option.visualMap);
  const hasYAxisName = yAxes.some((axis: any) => axis?.name);
  const hasXAxisName = xAxes.some((axis: any) => axis?.name);
  const hasRightAxis = yAxes.length >= 2;

  option.grid = {
    top: hasTitle ? 64 : 24,
    right: hasRightAxis ? 72 : hasXAxisName ? 40 : 20,
    bottom: hasLegend ? 72 : hasVisualMap ? 64 : hasXAxisName ? 40 : 20,
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
  hasLegend: boolean;
  totalRadarPolygons: number;
  isSingleLineSeries: boolean;
};

type SeriesStyler = (
  result: any,
  seriesItem: any,
  styles: SafeStyles,
  ctx: SeriesContext,
) => void;

const normalizeSeriesLabel = (
  result: any,
  seriesItem: any,
  theme: ChartTheme,
) => {
  if (!seriesItem.label) {
    return;
  }

  const {
    color: _c,
    textBorderColor: _tbc,
    textBorderWidth: _tbw,
    ...safeLabel
  } = seriesItem.label;
  result.label = {
    ...safeLabel,
    color: theme.subText,
    textBorderWidth: 0,
    fontSize: safeLabel.fontSize ?? 11,
  };
};

const applyLineSeriesStyle: SeriesStyler = (
  result,
  seriesItem,
  { safeItemStyle, safeLineStyle, safeAreaStyle },
  { seriesColor, theme, isSingleLineSeries },
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
  if (isSingleLineSeries) {
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
  } else {
    result.areaStyle = undefined;
  }
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
  result.label = { show: false };
};

const applyPieSeriesStyle: SeriesStyler = (
  result,
  seriesItem,
  { safeItemStyle },
  { seriesColor, theme, hasTitle, hasLegend },
) => {
  if (!seriesItem.radius) {
    if (hasTitle && hasLegend) {
      result.radius = ["35%", "60%"];
    } else if (hasTitle) {
      result.radius = ["48%", "72%"];
    } else if (hasLegend) {
      result.radius = ["45%", "68%"];
    } else {
      result.radius = ["55%", "80%"];
    }
  }
  if (!seriesItem.center) {
    if (hasTitle && hasLegend) {
      result.center = ["50%", "50%"];
    } else if (hasTitle) {
      result.center = ["50%", "58%"];
    } else if (hasLegend) {
      result.center = ["50%", "46%"];
    } else {
      result.center = ["50%", "50%"];
    }
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

const applyScatterSeriesStyle: SeriesStyler = (
  result,
  seriesItem,
  _styles,
  { seriesColor },
) => {
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
  if (hasBubbleSize) {
    // Always use our formula — ignore any symbolSize the LLM pre-calculated,
    // since those values bypass our proportional scaling and clipping.
    const sizes = normalized.map((point: any) =>
      Array.isArray(point) ? point[2] : 0,
    );
    const maxSize = Math.max(...sizes) || 1;
    result.symbolSize = (dataItem: any) => {
      const rawSize = Array.isArray(dataItem) ? dataItem[2] : 0;
      return 8 + (rawSize / maxSize) * 48;
    };
  } else {
    // 2D scatter — always use a fixed size regardless of what the LLM set
    result.symbolSize = 32;
  }

  // Labels on scatter overlap badly when bubbles cluster — tooltip shows the
  // name already, so disable inline labels entirely.
  result.label = { show: false };

  // Single-point series (one entity per series): use seriesColor so each series
  // gets a distinct palette color. Multi-point series: color by point index.
  const singlePoint = normalized.length <= 1;
  result.data = normalized.map((point: any, pointIndex: number) => {
    const originalPoint = rawData[pointIndex];
    const name =
      originalPoint?.name ||
      originalPoint?.label ||
      originalPoint?.coin ||
      originalPoint?.symbol ||
      "";
    const pointColor = singlePoint
      ? seriesColor
      : CHART_COLORS[pointIndex % CHART_COLORS.length];
    return {
      name,
      value: point,
      itemStyle: { color: pointColor },
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
  hasLegend: boolean,
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

  const lineSeriesCount = option.series.filter(
    (item: any) => item?.type === "line",
  ).length;
  const isSingleLineSeries = lineSeriesCount === 1;

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
      hasLegend,
      totalRadarPolygons,
      isSingleLineSeries,
    };
    seriesStylers[seriesItem?.type]?.(
      result,
      seriesItem,
      { safeItemStyle, safeLineStyle, safeAreaStyle },
      ctx,
    );

    if (seriesItem?.type !== "pie" && seriesItem?.type !== "heatmap") {
      normalizeSeriesLabel(result, seriesItem, theme);
    }

    return result;
  });
};

// Removes non-stacked bar series where ≥50% of values are zero when at least
// one other bar series exists. These are LLM color-hack ghost series (e.g. a
// duplicate series with zeros everywhere except one bar to override itemStyle).
const dropGhostBarSeries = (option: any) => {
  if (!Array.isArray(option.series)) {
    return;
  }

  const nonStackedBars = option.series.filter(
    (seriesItem: any) =>
      seriesItem?.type === "bar" &&
      !seriesItem.stack &&
      Array.isArray(seriesItem.data),
  );
  if (nonStackedBars.length <= 1) {
    return;
  }

  option.series = option.series.filter((seriesItem: any) => {
    if (
      seriesItem?.type !== "bar" ||
      seriesItem.stack ||
      !Array.isArray(seriesItem.data)
    ) {
      return true;
    }

    const total = seriesItem.data.length;
    if (total === 0) {
      return true;
    }
    const zeroCount = seriesItem.data.filter((value: any) => {
      const raw =
        typeof value === "object" && value !== null && "value" in value
          ? value.value
          : value;
      const num = typeof raw === "number" ? raw : 0;
      return num === 0;
    }).length;

    return zeroCount / total < 0.5;
  });
};

// When scatter x-values span more than 100× (e.g. TPS 7 → 120,000), a linear
// axis crushes everything to the left. Auto-switch to log scale so points spread
// evenly. Only applies when xAxis has no explicit type set by the LLM.
const autoLogScaleScatterX = (option: any) => {
  if (!Array.isArray(option.series)) {
    return;
  }

  const hasScatter = option.series.some(
    (seriesItem: any) =>
      seriesItem?.type === "scatter" || seriesItem?.type === "effectScatter",
  );
  if (!hasScatter) {
    return;
  }
  const xAxisObj = Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis;
  if (xAxisObj?.type && xAxisObj.type !== "value") {
    return;
  }

  const xValues: number[] = [];
  for (const seriesItem of option.series) {
    if (
      seriesItem?.type !== "scatter" &&
      seriesItem?.type !== "effectScatter"
    ) {
      continue;
    }
    if (!Array.isArray(seriesItem.data)) {
      continue;
    }

    for (const point of seriesItem.data) {
      const xVal = Array.isArray(point)
        ? point[0]
        : Array.isArray(point?.value)
          ? point.value[0]
          : null;
      if (typeof xVal === "number" && xVal > 0) {
        xValues.push(xVal);
      }
    }
  }

  if (xValues.length < 2) {
    return;
  }

  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  if (minX > 0 && maxX / minX > 100) {
    if (Array.isArray(option.xAxis)) {
      option.xAxis[0] = { ...option.xAxis[0], type: "log", logBase: 10 };
    } else {
      option.xAxis = { ...option.xAxis, type: "log", logBase: 10 };
    }
  }

  // Inject fallback axis names for scatter when the LLM omitted xAxis/yAxis.
  // These are captured by xAxisObj/yAxisObj after this function runs, so the
  // tooltip formatter also picks them up — keeping axis label and tooltip consistent.
  if (Array.isArray(option.xAxis)) {
    if (!option.xAxis[0]?.name) {
      option.xAxis[0] = { ...option.xAxis[0], name: "X" };
    }
  } else if (option.xAxis && !option.xAxis.name) {
    option.xAxis = { ...option.xAxis, name: "X" };
  }

  if (Array.isArray(option.yAxis)) {
    if (!option.yAxis[0]?.name) {
      option.yAxis[0] = { ...option.yAxis[0], name: "Y" };
    }
  } else if (option.yAxis && !option.yAxis.name) {
    option.yAxis = { ...option.yAxis, name: "Y" };
  }
};

const MAX_BUBBLE_SIZE = 72;

// If any scatter series has a manually-set symbolSize that exceeds MAX_BUBBLE_SIZE,
// scale all scatter symbolSizes proportionally so the largest fits within the cap.
const normalizeBubbleSizes = (option: any) => {
  if (!Array.isArray(option.series)) {
    return;
  }
  const scatterSeries = option.series.filter(
    (seriesItem: any) =>
      (seriesItem?.type === "scatter" ||
        seriesItem?.type === "effectScatter") &&
      typeof seriesItem.symbolSize === "number",
  );
  if (scatterSeries.length === 0) {
    return;
  }
  const maxSize = Math.max(...scatterSeries.map((s: any) => s.symbolSize));
  if (maxSize <= MAX_BUBBLE_SIZE) {
    return;
  }
  const scale = MAX_BUBBLE_SIZE / maxSize;
  option.series = option.series.map((seriesItem: any) => {
    if (
      (seriesItem?.type !== "scatter" &&
        seriesItem?.type !== "effectScatter") ||
      typeof seriesItem.symbolSize !== "number"
    ) {
      return seriesItem;
    }
    return {
      ...seriesItem,
      symbolSize: Math.max(8, Math.round(seriesItem.symbolSize * scale)),
    };
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
  const hasLegend = Boolean(option.legend);
  const isHorizontalBar =
    (rawOption.xAxis as any)?.type === "value" &&
    (rawOption.yAxis as any)?.type === "category";
  const isScatterChart =
    Array.isArray(rawOption.series) &&
    (rawOption.series as any[]).some(
      (item: any) => item?.type === "scatter" || item?.type === "effectScatter",
    );
  const isPieChart =
    Array.isArray(rawOption.series) &&
    (rawOption.series as any[]).some((item: any) => item?.type === "pie");

  if (!option.tooltip) {
    option.tooltip = {};
  }

  // Inject axes first so xAxisObj/yAxisObj include any auto-injected names
  injectDefaultAxes(option);
  dropGhostBarSeries(option);
  autoLogScaleScatterX(option);

  const xAxisObj = Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis;
  const yAxisObj = Array.isArray(option.yAxis) ? option.yAxis[0] : option.yAxis;

  applyTitleTheme(option, theme);
  applyLegendTheme(option, theme);
  applyTooltipTheme(
    option,
    theme,
    isScatterChart || isPieChart,
    isLightMode,
    xAxisObj,
    yAxisObj,
  );
  applyXAxisTheme(option, theme);
  applyYAxisTheme(option, theme);
  applyCandlestickTheme(option);
  applyHeatmapTheme(option, theme);
  applyRadarTheme(option, theme);
  applyGridTheme(option, hasTitle);
  applySeriesTheme(option, theme, isHorizontalBar, hasTitle, hasLegend);
  normalizeBubbleSizes(option);

  return option;
};
