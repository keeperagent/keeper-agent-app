import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { TavilySearchAPIWrapper } from "@langchain/tavily";
import { getLlmSetting } from "@/electron/appAgent/utils";
import { logEveryWhere } from "@/electron/service/util";

const MAX_RESULTS = 5;
const MAX_OUTPUT_LENGTH = 10_000;

export const webSearchTavilyTool = () =>
  new DynamicStructuredTool<z.ZodObject<any>>({
    name: "web_search_tavily",
    description:
      "Search the web using Tavily for current information, news, facts, and general queries. " +
      "Returns structured results with titles, URLs, and content snippets. " +
      "Best for factual lookups, recent events, and general web search.",
    schema: z.object({
      query: z.string().describe("The search query to look up on the web"),
      maxResults: z
        .number()
        .positive()
        .default(MAX_RESULTS)
        .optional()
        .describe("Maximum number of results to return (default 5)"),
    }),
    func: async (input) => {
      const { query, maxResults = MAX_RESULTS } = input;
      try {
        const [llm, keyErr] = await getLlmSetting();
        const apiKey = llm?.tavilyApiKey || null;
        if (keyErr || !apiKey) {
          return "Error: Tavily API key is not configured. Please set it in Settings > Agent.";
        }

        const wrapper = new TavilySearchAPIWrapper({
          tavilyApiKey: apiKey,
        });

        const results = await wrapper.rawResults({
          query,
          maxResults,
          includeAnswer: true,
        });

        const output = JSON.stringify(results);
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
        return err?.message;
      }
    },
  });
