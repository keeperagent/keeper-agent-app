import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { evaluate } from "mathjs";
import { TOOL_KEYS } from "@/electron/constant";

export const calculateTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.CALCULATE,
    description:
      "Evaluate a mathematical expression and return the exact numeric result. " +
      "Use for any arithmetic: USD→native conversion (usdAmount / nativePrice), " +
      "token value in USD (balance * tokenPrice), percentage amounts (balance * percent / 100), etc. " +
      "Always use this tool instead of doing arithmetic mentally.",
    schema: z.object({
      expression: z
        .string()
        .describe(
          "A math expression to evaluate. Examples: '0.1 / 86.24', '31551.858 * 0.00085', '31551.858 * 50 / 100'",
        ),
    }),
    func: async ({ expression }) => {
      try {
        const result = evaluate(expression);
        const numResult = Number(result);
        if (!isFinite(numResult)) {
          return `Error: Expression '${expression}' produced a non-finite result (${result}). Check for division by zero.`;
        }
        return String(numResult);
      } catch (error: any) {
        return `Error: Could not evaluate '${expression}': ${error?.message || String(error)}`;
      }
    },
  });
