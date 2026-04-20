import { createMiddleware } from "langchain";

// When the model picks an unknown subagent_type, falls back to code_execution_agent as a best-effort attempt rather than hard-failing
export const createTaskSkillRedirectMiddleware = (
  allowedSubagentNames: string[],
) => {
  const allowedSet = new Set(
    allowedSubagentNames.map((name) => name.toLowerCase().trim()),
  );

  return createMiddleware({
    name: "TaskSkillRedirect",
    wrapToolCall: async (request, handler) => {
      const toolName = request?.toolCall?.name;
      if (toolName !== "task") {
        return handler(request);
      }

      const toolCall = (request as any).toolCall;
      const argsKey = toolCall?.args != null ? "args" : "kwargs";
      const args = toolCall?.args || toolCall?.kwargs;
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
          ...toolCall,
          [argsKey]: { ...args, subagent_type: codeExecutionAgent },
        },
      });
    },
  });
};
