import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { TavilySearchAPIWrapper } from "@langchain/tavily";
import { getLlmSetting } from "@/electron/appAgent/utils";
import { logEveryWhere } from "@/electron/service/util";
import { TOOL_KEYS } from "@/electron/constant";

const MAX_RESULTS = 5;
const MAX_CONTENT_LENGTH = 400;
const MIN_SCORE = 0.3;
const MAX_OUTPUT_LENGTH = 10_000;

export const webSearchTavilyTool = () =>
  new DynamicStructuredTool<z.ZodObject<any>>({
    name: TOOL_KEYS.WEB_SEARCH_TAVILY,
    description:
      "Search the web for real-time or recent information — news, current prices, live events, recently published content. " +
      "Use only when data is genuinely live or too recent to be in training knowledge. " +
      "Returns a synthesized answer plus source links.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "Concise search-engine keywords — not a full sentence or question",
        ),
      maxResults: z
        .number()
        .positive()
        .default(MAX_RESULTS)
        .optional()
        .describe("Maximum number of results to return (default 5)"),
      searchDepth: z
        .enum(["basic", "advanced"])
        .default("basic")
        .optional()
        .describe(
          "'basic' for simple factual queries (faster); 'advanced' for deep research",
        ),
    }),
    func: async (input) => {
      const { query, maxResults = MAX_RESULTS, searchDepth = "basic" } = input;
      try {
        const [llm, keyErr] = await getLlmSetting();
        const apiKey = llm?.tavilyApiKey || null;
        if (keyErr || !apiKey) {
          return "Error: Tavily API key is not configured. Do NOT retry — configure it in Settings > Agent.";
        }

        const wrapper = new TavilySearchAPIWrapper({
          tavilyApiKey: apiKey,
        });

        const rawData = await wrapper.rawResults({
          query,
          maxResults,
          includeAnswer: true,
          searchDepth,
        } as any);

        // Answer field first — LLM should read this before scanning individual results
        const answer = rawData?.answer || null;
        const rawItems: any[] = Array.isArray(rawData?.results)
          ? rawData.results
          : [];

        // Filter low-relevance results, trim content per item
        const items = rawItems
          .filter((item: any) => (item?.score ?? 1) >= MIN_SCORE)
          .map((item: any) => ({
            title: item.title,
            url: item.url,
            content:
              typeof item.content === "string"
                ? item.content.slice(0, MAX_CONTENT_LENGTH)
                : undefined,
            score: item.score,
          }));

        const structured: Record<string, any> = {};
        if (answer) {
          structured.answer = answer;
        }
        structured.results = items;

        const output = JSON.stringify(structured);
        const truncated =
          output.length > MAX_OUTPUT_LENGTH
            ? output.slice(0, MAX_OUTPUT_LENGTH) + "\n...(truncated)"
            : output;

        logEveryWhere({
          message: `[Agent] web_search_tavily: success for "${query}"`,
        });
        return truncated;
      } catch (err: any) {
        logEveryWhere({
          message: `[Agent] web_search_tavily() error: ${err?.message}`,
        });
        return `Error: ${err?.message}. Do NOT retry.`;
      }
    },
  });
