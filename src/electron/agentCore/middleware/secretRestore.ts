import { createMiddleware } from "langchain";
import { restore } from "@keeperagent/crypto-key-guard";
import { ToolContext } from "@/electron/agentCore/toolContext";

// restore secrets after redacted
export const createSecretRestoreMiddleware = (toolContext: ToolContext) =>
  createMiddleware({
    name: "SecretRestore",
    wrapToolCall: async (request: any = {}, handler: any) => {
      if (toolContext.secrets.size === 0) {
        return handler(request);
      }

      const argsKey = request?.toolCall?.args != null ? "args" : "kwargs";
      const args = request?.toolCall?.args || request?.toolCall?.kwargs || {};
      if (!args) {
        return handler(request);
      }

      // Never restore secrets into memory file writes
      const toolName = request?.toolCall?.name;
      if (
        toolName === "write_file" &&
        String(args?.path || "").includes("/memories/")
      ) {
        return handler(request);
      }

      const argsStr = JSON.stringify(args);
      const restored = restore(argsStr, toolContext.secrets);
      if (restored === argsStr) {
        return handler(request);
      }

      try {
        const restoredArgs = JSON.parse(restored);
        return handler({
          ...request,
          toolCall: { ...request?.toolCall, [argsKey]: restoredArgs },
        });
      } catch {
        return handler(request);
      }
    },
  });
