import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { TOOL_KEYS } from "@/electron/constant";

export const renderChartTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.RENDER_CHART,
    description:
      "Render an interactive chart or data visualization in the UI using ECharts. " +
      "Generate an ECharts option object — it will be rendered directly in the app using the installed echarts library. " +
      "Supports line, bar, pie, scatter, candlestick, radar, heatmap, and all other ECharts chart types. " +
      "All data must be inline in the option object — do NOT use async or remote data sources. " +
      "After the chart renders successfully, respond with ONE short sentence summary only — do not repeat the data in text, tables, or bullet points.",
    schema: z.object({
      series: z
        .union([z.string(), z.array(z.unknown())])
        .describe(
          "ECharts series array — each item defines one chart series with type and data",
        ),
      xAxisLabels: z
        .array(z.string())
        .nullish()
        .describe(
          "Category labels for the x-axis in order (e.g. ['A','B','C']). Required for vertical and stacked bar charts — injected into xAxis.data automatically.",
        ),
      xAxis: z
        .union([z.record(z.unknown()), z.string()])
        .nullish()
        .describe(
          "X-axis config. For scatter/bubble REQUIRED: {type:'value', name:'<label with unit>'}. For bar REQUIRED: {type:'category', data:[...]}. name is the axis title shown on the chart — always set it.",
        ),
      yAxis: z
        .union([z.record(z.unknown()), z.string()])
        .nullish()
        .describe(
          "Y-axis config. REQUIRED for all cartesian charts: {type:'value', name:'<label with unit>'}. name is the axis title shown on the chart — always set it.",
        ),
      title: z
        .union([z.record(z.unknown()), z.string()])
        .nullish()
        .describe("ECharts title config object, e.g. {text: 'My Chart'}"),
      legend: z
        .union([z.record(z.unknown()), z.string()])
        .nullish()
        .describe("ECharts legend config object"),
      tooltip: z
        .union([z.record(z.unknown()), z.string()])
        .nullish()
        .describe("ECharts tooltip config object"),
      grid: z
        .union([z.record(z.unknown()), z.string()])
        .nullish()
        .describe("ECharts grid config object"),
      color: z
        .array(z.string())
        .nullish()
        .describe("Chart color palette array, e.g. ['#5470c6','#91cc75']"),
      visualMap: z
        .union([z.record(z.unknown()), z.string()])
        .nullish()
        .describe("ECharts visualMap config object"),
      dataZoom: z
        .union([z.record(z.unknown()), z.string()])
        .nullish()
        .describe("ECharts dataZoom config object"),
      radar: z
        .union([z.record(z.unknown()), z.string()])
        .nullish()
        .describe("ECharts radar config object"),
      polar: z
        .union([z.record(z.unknown()), z.string()])
        .nullish()
        .describe("ECharts polar config object"),
      dataset: z
        .union([z.record(z.unknown()), z.string()])
        .nullish()
        .describe("ECharts dataset config object"),
      backgroundColor: z.string().nullish().describe("Chart background color"),
    }),
    func: async (input) => {
      const height = 400;

      // Parse series
      let series: unknown;
      try {
        series =
          typeof input.series === "string"
            ? JSON.parse(input.series)
            : input.series;
      } catch (parseError) {
        const detail =
          parseError instanceof Error ? parseError.message : String(parseError);
        return `Error: series could not be parsed as JSON array. ${detail}. Ensure the value is valid JSON — invalid escape sequences like \\$ are not allowed; use $ directly.`;
      }

      // Extract xAxisLabels before ECharts key validation — it is not an ECharts field.
      const xAxisLabels = input.xAxisLabels as string[] | undefined;

      const option: Record<string, unknown> = { series };

      // Parse JSON string fields
      for (const key of [
        "xAxis",
        "yAxis",
        "title",
        "legend",
        "tooltip",
        "grid",
        "visualMap",
        "dataZoom",
        "radar",
        "polar",
        "dataset",
      ] as const) {
        if (input[key] !== undefined && input[key] !== null) {
          option[key] = parseJsonField(input[key]);
        }
      }
      if (input.color !== undefined && input.color !== null) {
        option.color = input.color;
      }
      if (
        input.backgroundColor !== undefined &&
        input.backgroundColor !== null
      ) {
        option.backgroundColor = input.backgroundColor;
      }

      // Inject xAxisLabels into xAxis.data when xAxis.data is absent.
      if (xAxisLabels && xAxisLabels.length > 0) {
        if (!option.xAxis) {
          option.xAxis = { type: "category", data: xAxisLabels };
        } else if (
          !Array.isArray(option.xAxis) &&
          !(option.xAxis as any).data
        ) {
          (option.xAxis as any).data = xAxisLabels;
          if (!(option.xAxis as any).type) {
            (option.xAxis as any).type = "category";
          }
        }
      }

      const VALID_ECHART_KEYS = new Set([
        "title",
        "legend",
        "grid",
        "xAxis",
        "yAxis",
        "polar",
        "radiusAxis",
        "angleAxis",
        "radar",
        "dataZoom",
        "visualMap",
        "tooltip",
        "axisPointer",
        "toolbox",
        "brush",
        "geo",
        "parallel",
        "parallelAxis",
        "singleAxis",
        "timeline",
        "graphic",
        "calendar",
        "dataset",
        "aria",
        "series",
        "color",
        "backgroundColor",
        "textStyle",
        "animation",
        "animationDuration",
        "animationEasing",
        "animationDelay",
      ]);

      const unknownKeys = Object.keys(option).filter(
        (k) => !VALID_ECHART_KEYS.has(k),
      );
      if (unknownKeys.length > 0) {
        return `Error: option contains unrecognized ECharts keys: ${unknownKeys.join(", ")}. Ensure the object is a valid ECharts option.`;
      }
      if (!option.series) {
        return `Error: option is missing required ECharts keys: series.`;
      }

      return JSON.stringify({
        __type: "chart",
        option,
        height,
        result:
          "Chart rendered and displayed to the user. Do not call render_chart again. Do not summarize, describe, or analyze the chart — respond with empty string only.",
      });
    },
  });

const parseJsonField = (value: unknown): unknown => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {}
  }
  return value;
};
