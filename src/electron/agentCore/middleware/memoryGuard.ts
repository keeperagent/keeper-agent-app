import { createMiddleware } from "langchain";
import { logEveryWhere } from "@/electron/service/util";
import { sanitizeMemoryContent } from "@/electron/agentCore/memorySanitizer";

// Intercepts write_file calls targeting memory files (/memories/), This prevents prompt-injected instructions target agent memory, which will affect all future conversations.
export const createMemoryWriteGuardMiddleware = () =>
  createMiddleware({
    name: "MemoryWriteGuard",
    wrapToolCall: async (request: any = {}, handler: any) => {
      const toolName = (request as any).toolCall?.name;
      if (toolName !== "write_file") {
        return handler(request);
      }

      const argsKey = request?.toolCall?.args != null ? "args" : "kwargs";
      const args = request?.toolCall?.args || request?.toolCall?.kwargs || {};
      const filePath: string = args?.path || "";

      if (!filePath.includes("/memories/")) {
        return handler(request);
      }

      const originalContent: string = args?.content || "";
      const sanitizedContent = sanitizeMemoryContent(originalContent);

      if (sanitizedContent !== originalContent) {
        logEveryWhere({
          message: `[MemoryWriteGuard] Stripped injected content from memory write to ${filePath}, originalContent: ${originalContent?.slice(0, 500)}...`,
        });
      }

      return handler({
        ...request,
        toolCall: {
          ...request.toolCall,
          [argsKey]: { ...args, content: sanitizedContent },
        },
      });
    },
  });
