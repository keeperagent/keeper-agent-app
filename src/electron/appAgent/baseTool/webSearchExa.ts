import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ExaSearchResults } from "@langchain/exa";
import { Exa } from "exa-js";
import { getExaKey } from "@/electron/appAgent/utils";
import { logEveryWhere } from "@/electron/service/util";

const MAX_RESULTS = 5;
const MAX_OUTPUT_LENGTH = 10_000;

type WebSearchExaInput = {
  query: string;
  maxResults?: number;
};

export const webSearchExaTool = () =>
  new DynamicStructuredTool<z.ZodObject<any>>({
    name: "web_search_exa",
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
    func: async (input: WebSearchExaInput) => {
      const { query, maxResults = MAX_RESULTS } = input;
      try {
        const [apiKey, keyErr] = await getExaKey();
        if (keyErr || !apiKey) {
          return "Error: Exa API key is not configured. Please set it in Settings > Agent.";
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
        return err?.message;
      }
    },
  });
