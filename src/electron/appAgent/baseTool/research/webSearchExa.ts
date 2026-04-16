import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ExaSearchResults } from "@langchain/exa";
import { Exa } from "exa-js";
import { getLlmSetting } from "@/electron/appAgent/utils";
import { logEveryWhere } from "@/electron/service/util";
import { TOOL_KEYS } from "@/electron/constant";

const MAX_RESULTS = 7;
const MAX_OUTPUT_LENGTH = 10_000;

export const webSearchExaTool = () =>
  new DynamicStructuredTool<z.ZodObject<any>>({
    name: TOOL_KEYS.WEB_SEARCH_EXA,
    description:
      "Search the web using Exa for semantic/neural search. " +
      "Best for finding conceptually similar content, deep research, and discovering related projects or articles. " +
      "Unlike keyword search, Exa understands the meaning behind queries.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "The search query — can be a natural language question or concept",
        ),
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
        const apiKey = llm?.exaApiKey || null;
        if (keyErr || !apiKey) {
          return "Error: Exa API key is not configured. Do NOT retry — configure it in Settings > Agent.";
        }

        const exaClient = new Exa(apiKey);
        const exaTool = new ExaSearchResults({
          client: exaClient as any,
          searchArgs: {
            numResults: maxResults,
          },
        });

        const result = await exaTool.invoke(query);

        const output =
          typeof result === "string" ? result : JSON.stringify(result);
        const truncated =
          output.length > MAX_OUTPUT_LENGTH
            ? output.slice(0, MAX_OUTPUT_LENGTH) + "\n...(truncated)"
            : output;

        logEveryWhere({
          message: `[Agent] web_search_exa: success for "${query}"`,
        });
        return truncated;
      } catch (err: any) {
        logEveryWhere({
          message: `[Agent] web_search_exa() error: ${err?.message}`,
        });
        return `Error: ${err?.message}. Do NOT retry.`;
      }
    },
  });
