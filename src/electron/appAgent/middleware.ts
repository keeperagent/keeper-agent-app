import { createMiddleware } from "langchain";
import { restore } from "@keeperagent/crypto-key-guard";
import { logEveryWhere } from "@/electron/service/util";
import { ToolContext } from "./toolContext";
import { sanitizeMemoryContent } from "./memorySanitizer";

/**
 * When the agent passes a skill name (or other invalid value) as task
 * subagent_type, rewrite it to "Code execution agent" so the task runs
 * instead of throwing
 */
export const createTaskSkillRedirectMiddleware = (
  allowedSubagentNames: string[],
) => {
  const allowedSet = new Set(
    allowedSubagentNames.map((n) => n.toLowerCase().trim()),
  );
  return createMiddleware({
    name: "TaskSkillRedirect",
    wrapToolCall: async (request, handler) => {
      const toolName = (request as any).toolCall?.name;
      if (toolName !== "task") {
        return handler(request);
      }

      const args =
        (request as any).toolCall?.args || (request as any).toolCall?.kwargs;
      const requestedType = args?.subagent_type;
      if (typeof requestedType !== "string") {
        return handler(request);
      }

      const key = requestedType.trim().toLowerCase();
      if (allowedSet.has(key)) {
        return handler(request);
      }

      const codeExecutionAgent = allowedSubagentNames.find(
        (name) => name.toLowerCase() === "code_execution_agent",
      );
      if (!codeExecutionAgent) {
        return handler(request);
      }

      return handler({
        ...request,
        toolCall: {
          ...(request as any).toolCall,
          args: { ...args, subagent_type: codeExecutionAgent },
        },
      });
    },
  });
};

/**
 * Middleware that restores redacted crypto secret tokens (e.g. [EVM_KEY_1])
 * back to their real values inside tool call arguments, so tools receive
 * actual keys while the LLM only ever sees safe placeholders.
 */
export const createSecretRestoreMiddleware = (toolContext: ToolContext) =>
  createMiddleware({
    name: "SecretRestore",
    wrapToolCall: async (request: any = {}, handler: any) => {
      if (toolContext.secrets.size === 0) {
        return handler(request);
      }

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
          toolCall: { ...request?.toolCall, args: restoredArgs },
        });
      } catch {
        return handler(request);
      }
    },
  });

/**
 * Intercepts write_file calls targeting memory files (/memories/) and strips
 * lines that contain tool names or injection phrases before they are written to disk.
 * This prevents prompt-injected instructions from being persisted across sessions.
 */
export const createMemoryWriteGuardMiddleware = () =>
  createMiddleware({
    name: "MemoryWriteGuard",
    wrapToolCall: async (request: any = {}, handler: any) => {
      const toolName = (request as any).toolCall?.name;
      if (toolName !== "write_file") {
        return handler(request);
      }

      const args = request?.toolCall?.args || request?.toolCall?.kwargs || {};
      const filePath: string = args?.path || "";

      if (!filePath.includes("/memories/")) {
        return handler(request);
      }

      const originalContent: string = args?.content || "";
      const sanitizedContent = sanitizeMemoryContent(originalContent);

      if (sanitizedContent !== originalContent) {
        logEveryWhere({
          message: `[MemoryWriteGuard] Stripped injected content from memory write to ${filePath}`,
        });
      }

      return handler({
        ...request,
        toolCall: {
          ...request.toolCall,
          args: { ...args, content: sanitizedContent },
        },
      });
    },
  });
