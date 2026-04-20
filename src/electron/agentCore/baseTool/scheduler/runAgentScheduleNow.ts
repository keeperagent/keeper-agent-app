import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { agentTaskScheduler } from "@/electron/service/agentJobScheduler";
import { safeStringify } from "@/electron/agentCore/utils";
import {
  lookupSchedule,
  scheduleNotFoundResponse,
  scheduleTargetSchema,
} from "./helpers";
import { TOOL_KEYS } from "@/electron/constant";

const schema = z.object({ ...scheduleTargetSchema });

export const runAgentScheduleNowTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.RUN_AGENT_SCHEDULE_NOW,
    description:
      "Trigger an agent schedule to run immediately, bypassing its cron timing. Identify the schedule by id or name.",
    schema: schema as any,
    func: async ({ scheduleId, name }: z.infer<typeof schema>) => {
      const [schedule, err] = await lookupSchedule(scheduleId, name);
      if (err || !schedule) {
        return scheduleNotFoundResponse(err!);
      }

      agentTaskScheduler.runNow(schedule.id!);
      return safeStringify({
        message: `Schedule "${schedule.name}" triggered. It is now running in the background.`,
      });
    },
  });
