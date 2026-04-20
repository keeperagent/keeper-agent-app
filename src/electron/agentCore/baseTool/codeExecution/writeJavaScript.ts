import { DynamicTool } from "@langchain/core/tools";
import { TOOL_KEYS } from "@/electron/constant";
import { type ToolContext } from "@/electron/agentCore/toolContext";
import { storePendingCode } from "./pendingCodeStore";

export const writeJavaScriptTool = (toolContext?: ToolContext) =>
  new DynamicTool({
    name: TOOL_KEYS.WRITE_JAVASCRIPT,
    description:
      "Draft JavaScript code for user review before execution. " +
      "The code will be shown to the user for approval, then executed by code_execution_agent.\n\n" +
      "CRITICAL: Write ONLY JavaScript (Node.js) — never Python, never Python-style syntax.\n\n" +
      "Runtime: Node.js ESM (.mjs). Follow this exact template:\n" +
      "  import pkg from 'package-name';        // always `from 'name'` — never `import pkg;`\n" +
      "  const result = await someAsyncFn();     // top-level await — never wrap in async IIFE\n" +
      "  console.log(result);\n\n" +
      "Rules:\n" +
      "- Imports at top, always `import x from 'pkg'` — `import x;` is a SyntaxError\n" +
      "- Top-level await only — never `(async () => { ... })()`\n" +
      "- Every async call must be awaited — missing await produces no output\n" +
      "- `let` for variables that will be reassigned; `const` for fixed values\n" +
      "- console.log() for all output — only stdout is captured\n" +
      "- Relative paths for files (e.g. `report.pdf`, not `/report.pdf`)\n" +
      "- `import.meta.dirname` instead of `__dirname`",
    func: async (code: string) => {
      const agentId = String(toolContext?.agentProfileId || "main");
      storePendingCode(agentId, { language: "javascript", code });
      toolContext?.update({ pendingCode: { language: "javascript", code } });
      return JSON.stringify({ code, status: "ready_for_review" });
    },
  });
