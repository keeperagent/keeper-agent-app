import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { agentTaskDB } from "@/electron/database/agentTask";
import { safeStringify } from "@/electron/agentCore/utils";
import { TOOL_KEYS } from "@/electron/constant";

const schema = z.object({
  id: z.number().describe("Task ID"),
});

export const getAgentTaskTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.GET_AGENT_TASK,
    description: "Get full details of a specific agent task by ID.",
    schema: schema as any,
    func: async ({ id }: { id: number }) => {
      const [task, err] = await agentTaskDB.getOneAgentTask(id);
      if (err) {
        throw new Error(`Failed to fetch agent task: ${err.message}`);
      }
      if (!task) {
        throw new Error(`Agent task with id ${id} not found`);
      }
      return safeStringify(task);
    },
  });
