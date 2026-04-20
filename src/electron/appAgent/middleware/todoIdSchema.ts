import { createMiddleware } from "langchain";
import { z } from "zod";

/**
 * Extends the write_todos tool schema to include optional `id` and `type` fields per item.
 * Models that strictly follow JSON Schema (e.g. GPT-4o-mini) omit unknown fields,
 * so without this they send items without IDs/types and the plan lock can never match them.
 */
export const createTodoIdSchemaMiddleware = () => {
  const extendedSchema = z.object({
    todos: z
      .array(
        z.object({
          id: z
            .number()
            .optional()
            .describe(
              "Stable ID assigned by the framework — always preserve exactly as shown in the pending reminder",
            ),
          content: z.string().describe("Content of the todo item"),
          status: z
            .enum(["pending", "in_progress", "completed"])
            .describe("Status of the todo"),
          type: z
            .enum([
              "research",
              "visualize",
              "code",
              "transaction",
              "workflow",
              "communicate",
              "manage",
            ])
            .optional()
            .describe(
              "Step type — determines which tools and subagents are available for this step",
            ),
        }),
      )
      .describe("List of todo items to update"),
  });

  return createMiddleware({
    name: "TodoIdSchema",
    wrapModelCall: async (request: any, handler: any) => {
      const writeTodosTool = request.tools?.find(
        (tool: any) => tool?.name === "write_todos",
      );

      if (writeTodosTool && !writeTodosTool._idSchemaExtended) {
        writeTodosTool.schema = extendedSchema;
        writeTodosTool._idSchemaExtended = true;
      }
      return handler(request);
    },
  });
};
