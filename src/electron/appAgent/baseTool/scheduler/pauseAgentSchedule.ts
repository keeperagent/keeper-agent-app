import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { agentTaskScheduler } from "@/electron/service/agentTaskScheduler";
import { safeStringify } from "@/electron/appAgent/utils";
import {
  lookupSchedule,
  scheduleNotFoundResponse,
  scheduleTargetSchema,
} from "./helpers";

const schema = z.object({ ...scheduleTargetSchema });

export const pauseAgentScheduleTool = () =>
  new DynamicStructuredTool({
    name: "pause_agent_schedule",
    description:
      "Temporarily pause an agent schedule. The cron registration is kept but skips execution until resumed. Identify the schedule by id or name.",
    schema: schema as any,
    func: async ({ scheduleId, name }: z.infer<typeof schema>) => {
      const [schedule, err] = await lookupSchedule(scheduleId, name);
      if (err || !schedule) {
        return scheduleNotFoundResponse(err!);
      }

      await agentTaskScheduler.pause(schedule.id!);
      return safeStringify({ message: `Schedule "${schedule.name}" paused.` });
    },
  });
