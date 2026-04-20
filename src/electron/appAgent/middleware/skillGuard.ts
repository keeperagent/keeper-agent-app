import { createMiddleware } from "langchain";

// Prevent prompt-injection in agent skill user installed
export const createSkillReadGuardMiddleware = (enabledFolders: Set<string>) =>
  createMiddleware({
    name: "SkillReadGuard",
    wrapToolCall: async (request: any, handler: any) => {
      const toolName = request?.toolCall?.name;
      if (toolName !== "read_file") {
        return handler(request);
      }

      const args = request?.toolCall?.args || request?.toolCall?.kwargs || {};
      const filePath: string = args?.path || args?.file_path || "";
      if (!filePath.startsWith("/skills/")) {
        return handler(request);
      }

      const normalized = filePath.replace(/\/+/g, "/");
      const folder = normalized.replace(/^\/skills\//, "").split("/")[0];
      if (folder && enabledFolders.has(folder)) {
        return handler(request);
      }

      const available = [...enabledFolders].join(", ") || "none";
      throw new Error(
        `Skill '${folder}' does not exist, do not retry with other folder names. Available skills: [${available}]`,
      );
    },
  });

/**
 * Strips misleading skill name examples injected by deepagents' SKILLS_SYSTEM_PROMPT
 * (e.g. "research X → web-research skill") that cause the agent to guess skill paths
 * not present in the actual Available Skills list.
 */
export const createSkillsPromptCleanMiddleware = () =>
  createMiddleware({
    name: "SkillsPromptClean",
    wrapModelCall: async (request: any, handler: any) => {
      const systemMessages: any[] = Array.isArray(request?.systemMessage)
        ? request.systemMessage
        : request?.systemMessage
          ? [request.systemMessage]
          : [];

      const hasTarget = systemMessages.some((msg) => {
        const content = typeof msg === "string" ? msg : msg?.content || "";
        return (
          typeof content === "string" && content.includes("web-research skill")
        );
      });

      if (!hasTarget) {
        return handler(request);
      }

      const cleaned = systemMessages.map((msg) => {
        const isString = typeof msg === "string";
        const content: string = isString ? msg : msg?.content || "";
        if (
          typeof content !== "string" ||
          !content.includes("web-research skill")
        ) {
          return msg;
        }

        const newContent = content
          .replace(
            /\(e\.g\.,?\s*[""]?research X[""]?\s*→\s*web-research skill[""]?\)/gi,
            "",
          )
          .replace(
            /- When the user's request matches a skill's domain[^\n]*/g,
            "- Only use a skill if its exact name appears in the Available Skills list above.",
          );
        return isString ? newContent : { ...msg, content: newContent };
      });

      return handler({ ...request, systemMessage: cleaned });
    },
  });
