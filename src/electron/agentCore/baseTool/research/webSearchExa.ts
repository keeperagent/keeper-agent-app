import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ExaSearchResults } from "@langchain/exa";
import { Exa } from "exa-js";
import { getLlmSetting } from "@/electron/agentCore/utils";
import { logEveryWhere } from "@/electron/service/util";
import { TOOL_KEYS } from "@/electron/constant";

const MAX_RESULTS = 5;
const MAX_OUTPUT_LENGTH = 10_000;

export const webSearchExaTool = () =>
  new DynamicStructuredTool<z.ZodObject<any>>({
    name: TOOL_KEYS.WEB_SEARCH_EXA,
    description:
      "Semantic/neural web search — understands concepts and meaning, not just keywords. " +
      "Best for finding conceptually related content, research papers, and similar projects. " +
      "Use only when keyword search would miss the intent; not for simple factual or real-time lookups.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "The search query — can be a natural language question or concept",
        ),
    }),
    func: async (input) => {
      const { query } = input;
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
            numResults: MAX_RESULTS,
          },
        });

        const result = await exaTool.invoke(query);

        const raw =
          typeof result === "string" ? result : JSON.stringify(result);

        // Trim per-result text/highlights before truncating so the JSON stays valid
        // and URL/title fields remain parseable for the UI result display.
        let truncated = raw;
        try {
          const parsed = JSON.parse(raw);
          const items = Array.isArray(parsed) ? parsed : parsed?.results;
          if (Array.isArray(items)) {
            const trimmed = items.map((item: any) => ({
              ...item,
              text: item.text ? item.text.slice(0, 800) : undefined,
              highlights: undefined,
              highlightScores: undefined,
            }));
            const compact = Array.isArray(parsed)
              ? JSON.stringify(trimmed)
              : JSON.stringify({ ...parsed, results: trimmed });
            truncated =
              compact.length > MAX_OUTPUT_LENGTH
                ? compact.slice(0, MAX_OUTPUT_LENGTH) + "\n...(truncated)"
                : compact;
          }
        } catch {
          truncated =
            raw.length > MAX_OUTPUT_LENGTH
              ? raw.slice(0, MAX_OUTPUT_LENGTH) + "\n...(truncated)"
              : raw;
        }

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
