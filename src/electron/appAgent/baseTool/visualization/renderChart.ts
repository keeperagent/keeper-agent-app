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
      try {
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
              parsed = new Function(`return (${option})`)();
            }
          }
        }

        return JSON.stringify({ __type: "chart", option: parsed, height });
      } catch {
        return "Error: option must be a valid ECharts option object.";
      }
    },
  });
