import { createMiddleware } from "langchain";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { TOOL_KEYS } from "@/electron/constant";

// Blocks render_chart after a successful render — prevents the LLM from retrying in the same run
export const createRenderOnceMiddleware = () =>
  createMiddleware({
    name: "RenderOnce",
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

      const alreadyRendered = messages.some((msg: any) => {
        if (!ToolMessage.isInstance(msg)) {
          return false;
        }
        try {
          const parsed = JSON.parse(
            typeof msg.content === "string" ? msg.content : "",
          );
          return parsed?.__type === "chart";
        } catch {
          return false;
        }
      });

      if (!alreadyRendered) {
        return;
      }

      const renderCalls = lastAiMsg.tool_calls.filter(
        (toolCall: any) => toolCall.name === TOOL_KEYS.RENDER_CHART,
      );
      if (renderCalls.length === 0) {
        return;
      }

      return {
        messages: renderCalls.map(
          (toolCall: any) =>
            new ToolMessage({
              content:
                "Error: Chart already rendered successfully. Do not call render_chart again — give your final one-sentence response.",
              tool_call_id: toolCall.id,
              status: "error",
            }),
        ),
      };
    },
  });
