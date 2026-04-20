import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { jsonrepair } from "jsonrepair";
import { TOOL_KEYS } from "@/electron/constant";

export const renderChartTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.RENDER_CHART,
    description:
      "Render an interactive chart or data visualization in the UI using ECharts. " +
      "Generate an ECharts option object — it will be rendered directly in the app using the installed echarts library. " +
      "Supports line, bar, pie, scatter, candlestick, radar, heatmap, and all other ECharts chart types. " +
      "All data must be inline in the option object — do NOT use async or remote data sources.",
    schema: z.object({
      option: z
        .string()
        .describe(
          "REQUIRED. A JSON string of a complete ECharts option object. " +
            "Must include: title, tooltip, legend (if applicable), xAxis, yAxis, and series with inline data. " +
            'Example: \'{"title":{"text":"Sales"},"xAxis":{"data":["Jan","Feb"]},"yAxis":{},"series":[{"type":"bar","data":[100,200]}]}\'',
        ),
      height: z
        .number()
        .optional()
        .describe("Chart height in pixels (default 400)"),
    }),
    func: async ({ option, height = 400 }) => {
      let parsed: unknown;

      if (typeof option !== "string") {
        parsed = option;
      } else {
        try {
          parsed = JSON.parse(option);
        } catch {
          try {
            parsed = JSON.parse(jsonrepair(option));
          } catch {
            return "Error: option is not valid JSON and could not be repaired. Provide a valid JSON ECharts option object.";
          }
        }
      }

      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return "Error: option must be a JSON object, not a primitive or array.";
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

      return JSON.stringify({ __type: "chart", option: parsed, height });
    },
  });
