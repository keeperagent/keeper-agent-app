import { DynamicTool } from "@langchain/core/tools";
import { TOOL_KEYS } from "@/electron/constant";
import { type ToolContext } from "@/electron/appAgent/toolContext";
import { storePendingCode } from "./pendingCodeStore";

export const writeJavaScriptTool = (toolContext?: ToolContext) =>
  new DynamicTool({
    name: TOOL_KEYS.WRITE_JAVASCRIPT,
    description:
      "Draft JavaScript code for user review before execution. " +
      "Call this tool with the complete code — it will be shown to the user in the plan for approval. " +
      "After the user approves, the exact code will be executed by code_execution_agent. " +
      "\n\nJS coding rules:" +
      "\n- Use require() for imports — ES module import syntax is not supported." +
      "\n- Always await top-level async calls — write `await fetchData()`, not `fetchData()`. Missing await causes no output." +
      "\n- Use console.log() for output — only stdout is returned." +
      "\n- Always set a User-Agent header on HTTP requests to avoid being blocked." +
      "\n- Use relative paths for generated files (e.g. `output.pdf`, not `/output.pdf`)." +
      "\n- Write complete, correct code on the first attempt." +
      "\nInput: the complete JavaScript code string.",
    func: async (code: string) => {
      const agentId = String(toolContext?.agentProfileId || "main");
      storePendingCode(agentId, { language: "javascript", code });
      toolContext?.update({ pendingCode: { language: "javascript", code } });
      return JSON.stringify({ code, status: "ready_for_review" });
    },
  });
