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

export const resumeAgentScheduleTool = () =>
  new DynamicStructuredTool({
    name: TOOL_KEYS.RESUME_AGENT_SCHEDULE,
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
