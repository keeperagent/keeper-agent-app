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

export const forceAxisTheme = (
  axisConfig: any,
  theme: ChartTheme,
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

export const applyTheme = (
  rawOption: Record<string, unknown>,
  isLightMode: boolean,
): Record<string, unknown> => {
  const theme = buildTheme(isLightMode);
  const option = { ...rawOption };

  option.backgroundColor = "transparent";
  option.color = CHART_COLORS;

  const fontFamily = '"JetBrains Mono", monospace';
  option.textStyle = {
    fontFamily,
    ...(option.textStyle || {}),
  };

  const hasTitle = Boolean(option.title);
  if (option.title) {
    const titles = Array.isArray(option.title) ? option.title : [option.title];
    option.title = titles.map((titleItem: any) => ({
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
  }

  if (option.legend) {
    const legends = Array.isArray(option.legend)
      ? option.legend
      : [option.legend];
    option.legend = legends.map((legendItem: any) => ({
      ...legendItem,
      padding: [4, 16],
      itemGap: 16,
      itemWidth: 14,
      itemHeight: 14,
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
      (item: any) => item?.type === "scatter" || item?.type === "effectScatter",
    );

  if (option.tooltip) {
    const tooltips = Array.isArray(option.tooltip)
      ? option.tooltip
      : [option.tooltip];
    option.tooltip = tooltips.map((tooltipItem: any) => {
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
        const xAxisObj = Array.isArray(rawOption.xAxis)
          ? rawOption.xAxis[0]
          : rawOption.xAxis;
        const yAxisObj = Array.isArray(rawOption.yAxis)
          ? rawOption.yAxis[0]
          : rawOption.yAxis;
        const xLabel = xAxisObj?.name || "X";
        const yLabel = yAxisObj?.name || "Y";
        base.formatter = (params: any) => {
          const escHtml = (str: string) =>
            str
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;");
          const name = params.name || params.seriesName || "";
          const value = Array.isArray(params.value) ? params.value : [];
          const fmt = (value: any) =>
            typeof value === "number"
              ? Math.abs(value) >= 1000
                ? value.toLocaleString()
                : value.toFixed(2)
              : escHtml(String(value || ""));
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
  }

  if (option.xAxis !== undefined) {
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
  }

  if (option.yAxis !== undefined) {
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
  }

  if (option.radar && typeof option.radar === "object") {
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
  }

  if (!option.grid) {
    const hasLegend = Boolean(option.legend);
    const yAxes = option.yAxis
      ? Array.isArray(option.yAxis)
        ? option.yAxis
        : [option.yAxis]
      : [];
    const xAxes = option.xAxis
      ? Array.isArray(option.xAxis)
        ? option.xAxis
        : [option.xAxis]
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

  const xAxisObj = Array.isArray(rawOption.xAxis)
    ? rawOption.xAxis[0]
    : rawOption.xAxis;
  const yAxisObj = Array.isArray(rawOption.yAxis)
    ? rawOption.yAxis[0]
    : rawOption.yAxis;
  const isHorizontalBar =
    xAxisObj?.type === "value" && yAxisObj?.type === "category";

  const totalRadarPolygons = Array.isArray(option.series)
    ? option.series
        .filter((item) => item?.type === "radar")
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

      const { color: _itemColor, ...safeItemStyle } =
        seriesItem.itemStyle || {};
      const { color: _lineColor, ...safeLineStyle } =
        seriesItem.lineStyle || {};
      const { color: _areaColor, ...safeAreaStyle } =
        seriesItem.areaStyle || {};

      const result = { ...seriesItem, itemStyle: safeItemStyle };

      if (seriesItem.type === "line") {
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
      }

      if (seriesItem.type === "bar") {
        const barRadius = isHorizontalBar
          ? [999, 999, 999, 999]
          : [10, 10, 0, 0];
        result.itemStyle = {
          ...safeItemStyle,
          borderRadius: barRadius,
          shadowBlur: 8,
          shadowColor: hexToRgba(seriesColor, 0.2),
          shadowOffsetY: 4,
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
      }

      if (seriesItem.type === "radar") {
        const rawData: any[] = Array.isArray(seriesItem.data)
          ? seriesItem.data
          : [];
        const entityCount = rawData.length;
        const singleEntry = entityCount <= 1;
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
          const { color: _eic, ...safeEntryItemStyle } =
            entryObj.itemStyle || {};
          const { color: _elc, ...safeEntryLineStyle } =
            entryObj.lineStyle || {};
          const { color: _eac, ...safeEntryAreaStyle } =
            entryObj.areaStyle || {};

          return {
            ...entryObj,
            lineStyle: {
              ...safeEntryLineStyle,
              width: 2.5,
              color: palette,
            },
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
      }

      if (
        seriesItem.type === "scatter" ||
        seriesItem.type === "effectScatter"
      ) {
        const rawData: any[] = Array.isArray(seriesItem.data)
          ? seriesItem.data
          : [];

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
          (point: any) =>
            Array.isArray(point) && point.length >= 3 && point[2] > 0,
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
