import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ExaFindSimilarResults } from "@langchain/exa";
import { Exa } from "exa-js";
import { getLlmSetting } from "@/electron/agentCore/utils";
import { logEveryWhere } from "@/electron/service/util";
import { TOOL_KEYS } from "@/electron/constant";

const MAX_RESULTS = 5;
const MAX_OUTPUT_LENGTH = 10_000;

export const findSimilarExaTool = () =>
  new DynamicStructuredTool<z.ZodObject<any>>({
    name: TOOL_KEYS.FIND_SIMILAR_EXA,
    description:
      "Find web pages that are similar to a given URL. " +
      "Use this to discover related projects, competitors, or similar content. " +
      "Input: a URL to find similar pages for.",
    schema: z.object({
      url: z.string().describe("The URL to find similar pages for"),
    }),
    func: async (input) => {
      const { url } = input;
      try {
        const [llm, keyErr] = await getLlmSetting();
        const apiKey = llm?.exaApiKey || null;
        if (keyErr || !apiKey) {
          return "Error: Exa API key is not configured. Do NOT retry — configure it in Settings > Agent.";
        }

        const exaClient = new Exa(apiKey);
        const exaTool = new ExaFindSimilarResults({
          client: exaClient as any,
          searchArgs: {
            numResults: MAX_RESULTS,
          },
        });

        const result = await exaTool.invoke(url);

        const output =
          typeof result === "string" ? result : JSON.stringify(result);
        const truncated =
          output.length > MAX_OUTPUT_LENGTH
            ? output.slice(0, MAX_OUTPUT_LENGTH) + "\n...(truncated)"
            : output;

        logEveryWhere({
          message: `[Agent] find_similar_exa: success for "${url}"`,
        });
        return truncated;
      } catch (err: any) {
        logEveryWhere({
          message: `[Agent] find_similar_exa() error: ${err?.message}`,
        });
        return `Error: ${err?.message}. Do NOT retry.`;
      }
    },
  });
