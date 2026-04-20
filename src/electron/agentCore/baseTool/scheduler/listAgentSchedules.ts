import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { scheduleDB } from "@/electron/database/schedule";
import { safeStringify } from "@/electron/agentCore/utils";
import { ScheduleType } from "@/electron/type";
import { TOOL_KEYS } from "@/electron/constant";

const schema = z.object({
  searchText: z
    .string()
    .optional()
    .describe("Optional keyword to filter schedules by name or note."),
});

export const listAgentSchedulesTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.LIST_AGENT_SCHEDULES,
    description:
      "List agent schedules with their current status, cron expression, and job count.",
    schema: schema as any,
    func: async ({ searchText }: z.infer<typeof schema>) => {
      const [res] = await scheduleDB.getListSchedule(
        1,
        15,
        searchText,
        undefined,
        undefined,
        ScheduleType.AGENT,
      );

      if (!res) {
        return safeStringify({ schedules: [] });
      }

      const schedules = res.data.map((schedule) => ({
        id: schedule.id,
        name: schedule.name,
        cronExpr: schedule.cronExpr,
        isActive: schedule.isActive,
        isPaused: schedule.isPaused,
        note: schedule.note,
        jobCount: schedule.listJob?.length || 0,
      }));

      return safeStringify({ schedules, total: schedules.length });
    },
  });
