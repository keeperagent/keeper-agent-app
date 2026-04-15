import { DynamicTool } from "@langchain/core/tools";
import { TOOL_KEYS } from "@/electron/constant";
import { type ToolContext } from "@/electron/appAgent/toolContext";
import { storePendingCode } from "./pendingCodeStore";

export const writePythonTool = (toolContext?: ToolContext) =>
  new DynamicTool({
    name: TOOL_KEYS.WRITE_PYTHON,
    description:
      "Draft Python code for user review before execution. " +
      "Call this tool with the complete code — it will be shown to the user in the plan for approval. " +
      "After the user approves, the exact code will be executed by code_execution_agent. " +
      "\n\nPython coding rules:" +
      "\n- Prefer urllib.request (built-in) over requests to avoid unnecessary installs." +
      "\n- For async code, wrap in asyncio.run(main()) and await inside the async function." +
      "\n- Use print() for output — only stdout is returned." +
      "\n- Always set a User-Agent header on HTTP requests to avoid being blocked." +
      "\n- Use relative paths for generated files (e.g. `output.pdf`, not `/output.pdf`)." +
      "\n- Write complete, correct code on the first attempt." +
      "\nInput: the complete Python code string.",
    func: async (code: string) => {
      const agentId = String(toolContext?.agentProfileId || "main");
      storePendingCode(agentId, { language: "python", code });
      toolContext?.update({ pendingCode: { language: "python", code } });
      return JSON.stringify({ code, status: "ready_for_review" });
    },
  });
