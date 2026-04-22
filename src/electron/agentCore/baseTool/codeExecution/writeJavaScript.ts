import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { TOOL_KEYS } from "@/electron/constant";
import { type ToolContext } from "@/electron/agentCore/toolContext";
import { storePendingCode } from "./pendingCodeStore";

export const writeJavaScriptTool = (toolContext?: ToolContext) =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.WRITE_JAVASCRIPT,
    description:
      "Draft JavaScript (Node.js ESM) for user review before execution. " +
      "Use top-level await, `import x from 'pkg'` (never `import x;`), and console.log() for output. " +
      "Never wrap in async IIFE. Use import.meta.dirname instead of __dirname.",
    schema: z.object({
      code: z
        .string()
        .refine((s) => s.trim().length > 0, {
          message: "code cannot be empty or only whitespace",
        })
        .describe("Complete, runnable JavaScript (Node.js ESM) code"),
    }),
    func: async ({ code }) => {
      const agentId = String(toolContext?.agentProfileId || "main");
      storePendingCode(agentId, { language: "javascript", code });
      toolContext?.update({ pendingCode: { language: "javascript", code } });
      return JSON.stringify({ code, status: "ready_for_review" });
    },
  });
