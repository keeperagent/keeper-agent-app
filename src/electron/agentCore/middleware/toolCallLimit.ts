import { createMiddleware } from "langchain";
import { AIMessage, ToolMessage } from "@langchain/core/messages";

// Enforces a hard cap on tool calls per subagent run by counting ToolMessages already
// in state. Once the limit is reached every tool call in the current turn is blocked,
// forcing the LLM to stop and return what it already has.
export const createToolCallLimitMiddleware = (maxCalls: number) =>
  createMiddleware({
    name: "ToolCallLimit",
    afterModel: (state: any) => {
      const messages: any[] = state?.messages || [];
      if (!messages.length) {
        return;
      }

      const lastAiMsg = [...messages]
        .reverse()
        .find((msg: any) => AIMessage.isInstance(msg));
      if (!lastAiMsg?.tool_calls?.length) {
        return;
      }

      const completedCalls = messages.filter((msg: any) =>
        ToolMessage.isInstance(msg),
      ).length;

      const pendingCalls = lastAiMsg.tool_calls.length;

      if (completedCalls + pendingCalls <= maxCalls) {
        return;
      }

      return {
        messages: lastAiMsg.tool_calls.map(
          (toolCall: any) =>
            new ToolMessage({
              content: `Error: Tool call limit (${maxCalls}) reached. Stop searching — return your findings from what you already have.`,
              tool_call_id: toolCall.id,
              status: "error",
            }),
        ),
      };
    },
  });
