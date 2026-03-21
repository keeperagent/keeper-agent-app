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

export const resumeAgentScheduleTool = () =>
  new DynamicStructuredTool({
    name: "resume_agent_schedule",
    description:
      "Resume a previously paused agent schedule. Identify the schedule by id or name.",
    schema: schema as any,
    func: async ({ scheduleId, name }: z.infer<typeof schema>) => {
      const [schedule, err] = await lookupSchedule(scheduleId, name);
      if (err || !schedule) {
        return scheduleNotFoundResponse(err!);
      }

      await agentTaskScheduler.resume(schedule.id!);
      return safeStringify({ message: `Schedule "${schedule.name}" resumed.` });
    },
  });
