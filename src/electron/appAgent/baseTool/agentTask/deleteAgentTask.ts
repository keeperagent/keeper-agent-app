import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { agentTaskDB } from "@/electron/database/agentTask";
import { sendToRenderer } from "@/electron/main";
import { MESSAGE } from "@/electron/constant";
import { safeStringify } from "@/electron/appAgent/utils";

const schema = z.object({
  id: z.number().describe("Task ID to delete"),
});

export const deleteAgentTaskTool = () =>
  new DynamicStructuredTool({
    name: "delete_agent_task",
    description:
      "Permanently delete an agent task by ID. Prefer setting status to cancelled over deleting unless the task should be fully removed.",
    schema: schema as any,
    func: async ({ id }: { id: number }) => {
      const [, err] = await agentTaskDB.deleteAgentTask([id]);
      if (err) {
        throw new Error(`Failed to delete agent task: ${err.message}`);
      }

      sendToRenderer(MESSAGE.AGENT_TASK_CHANGED);

      return safeStringify({ success: true, deletedId: id });
    },
  });
