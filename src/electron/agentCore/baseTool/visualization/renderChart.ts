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
    schema: z
      .object({
        series: z
          .union([z.string(), z.array(z.unknown())])
          .describe(
            "ECharts series array — each item defines one chart series with type and data",
          ),
      })
      .passthrough(),
    func: async (input) => {
      const height = 400;

      if (typeof input.series === "string") {
        try {
          input.series = JSON.parse(input.series);
        } catch (parseError) {
          const detail =
            parseError instanceof Error
              ? parseError.message
              : String(parseError);
          return `Error: series could not be parsed as JSON array. ${detail}. Ensure the value is valid JSON — invalid escape sequences like \\$ are not allowed; use $ directly.`;
        }
      }

      const parsed: unknown = input;

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
      const REQUIRED_ECHART_KEYS = new Set(["series"]);

      const keys = Object.keys(parsed as object);
      const unknownKeys = keys.filter((k) => !VALID_ECHART_KEYS.has(k));
      if (unknownKeys.length > 0) {
        return `Error: option contains unrecognized ECharts keys: ${unknownKeys.join(", ")}. Ensure the object is a valid ECharts option.`;
      }
      const missingKeys = [...REQUIRED_ECHART_KEYS].filter(
        (k) => !keys.includes(k),
      );
      if (missingKeys.length > 0) {
        return `Error: option is missing required ECharts keys: ${missingKeys.join(", ")}.`;
      }

      return JSON.stringify({
        __type: "chart",
        option: parsed,
        height,
        result:
          "Chart rendered and displayed to the user. Do not call render_chart again.",
      });
    },
  });
