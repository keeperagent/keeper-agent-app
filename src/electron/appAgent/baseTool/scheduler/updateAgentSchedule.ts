import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { scheduleDB } from "@/electron/database/schedule";
import { agentTaskScheduler } from "@/electron/service/agentTaskScheduler";
import { safeStringify } from "@/electron/appAgent/utils";
import {
  lookupSchedule,
  scheduleNotFoundResponse,
  scheduleTargetSchema,
} from "./helpers";

const schema = z.object({
  ...scheduleTargetSchema,
  newName: z.string().optional().describe("New name for the schedule."),
  cronExpr: z
    .string()
    .optional()
    .describe(
      "New cron expression derived from the user's natural language description. Never ask the user for a cron expression — convert it yourself.",
    ),
  note: z.string().optional().describe("New description/notes."),
  isActive: z.boolean().optional().describe("Enable or disable the schedule."),
});

export const updateAgentScheduleTool = () =>
  new DynamicStructuredTool({
    name: "update_agent_schedule",
    description:
      "Update the name, cron expression, notes, or active state of an agent schedule. Identify the schedule by id or name.",
    schema: schema as any,
    func: async ({
      scheduleId,
      name,
      newName,
      cronExpr,
      note,
      isActive,
    }: z.infer<typeof schema>) => {
      const [schedule, err] = await lookupSchedule(scheduleId, name);
      if (err || !schedule) {
        return scheduleNotFoundResponse(err!);
      }

      const { listJob, ...scheduleFields } = schedule;
      if (newName !== undefined) {
        scheduleFields.name = newName;
      }
      if (cronExpr !== undefined) {
        scheduleFields.cronExpr = cronExpr;
      }
      if (note !== undefined) {
        scheduleFields.note = note;
      }
      if (isActive !== undefined) {
        scheduleFields.isActive = isActive;
      }

      const [result, updateErr] =
        await scheduleDB.updateSchedule(scheduleFields);
      if (updateErr || !result) {
        return safeStringify({
          error: updateErr?.message,
        });
      }

      agentTaskScheduler.reschedule(result);
      return safeStringify({
        message: `Schedule "${result.name}" updated.`,
        scheduleId: result.id,
      });
    },
  });
