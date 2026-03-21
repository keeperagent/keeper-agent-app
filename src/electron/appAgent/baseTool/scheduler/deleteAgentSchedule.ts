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

const schema = z.object({ ...scheduleTargetSchema });

export const deleteAgentScheduleTool = () =>
  new DynamicStructuredTool({
    name: "delete_agent_schedule",
    description:
      "Permanently delete an agent schedule and all its jobs. Identify the schedule by id or name.",
    schema: schema as any,
    func: async ({ scheduleId, name }: z.infer<typeof schema>) => {
      const [schedule, err] = await lookupSchedule(scheduleId, name);
      if (err || !schedule) {
        return scheduleNotFoundResponse(err!);
      }

      agentTaskScheduler.unregister(schedule.id!);

      const deleteErr = await scheduleDB.deleteSchedule([schedule.id!]);
      if (deleteErr) {
        return safeStringify({ error: deleteErr.message });
      }

      return safeStringify({ message: `Schedule "${schedule.name}" deleted.` });
    },
  });
