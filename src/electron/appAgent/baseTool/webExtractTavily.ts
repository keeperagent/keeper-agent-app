import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { TavilyExtractAPIWrapper } from "@langchain/tavily";
import { getTavilyKey } from "@/electron/appAgent/utils";
import { logEveryWhere } from "@/electron/service/util";

const MAX_OUTPUT_LENGTH = 10_000;

type WebExtractTavilyInput = {
  urls: string[];
};

export const webExtractTavilyTool = () =>
  new DynamicStructuredTool<z.ZodObject<any>>({
    name: "web_extract_tavily",
    description:
      "Extract and read the full content of one or more web pages by URL. " +
      "Use this after web search to read the full content of a result page. " +
      "Input: an array of URLs to extract content from.",
    schema: z.object({
      urls: z
        .array(z.string())
        .describe("List of URLs to extract content from"),
    }),
    func: async (input: WebExtractTavilyInput) => {
      const { urls } = input;
      try {
        const [apiKey, keyErr] = await getTavilyKey();
        if (keyErr || !apiKey) {
          return "Error: Tavily API key is not configured. Please set it in Settings > Agent.";
        }

        const wrapper = new TavilyExtractAPIWrapper({
          tavilyApiKey: apiKey,
        });

        const results = await wrapper.rawResults({ urls });

        const output = JSON.stringify(results);
        const truncated =
          output.length > MAX_OUTPUT_LENGTH
            ? output.slice(0, MAX_OUTPUT_LENGTH) + "\n...(truncated)"
            : output;

        logEveryWhere({
          message: `[Agent] web_extract_tavily: success for ${urls.length} URL(s)`,
        });
        return truncated;
      } catch (err: any) {
        logEveryWhere({
          message: `[Agent] web_extract_tavily() error: ${err?.message}`,
        });
        return err?.message;
      }
    },
  });
