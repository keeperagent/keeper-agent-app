import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { scheduleDB } from "@/electron/database/schedule";
import { agentTaskScheduler } from "@/electron/service/agentTaskScheduler";
import { safeStringify } from "@/electron/appAgent/utils";
import { ScheduleType, JobType, JobConditionType } from "@/electron/type";

const agentJobSchema = z.object({
  order: z
    .number()
    .describe("Execution order (1-based). Lower numbers run first."),
  prompt: z
    .string()
    .describe("The task prompt for the agent to execute on this schedule run."),
  notifyPlatform: z
    .enum(["telegram"])
    .optional()
    .describe("Platform to send the result to. Only 'telegram' is supported."),
  notifyOnlyIfAgentSays: z
    .boolean()
    .optional()
    .describe(
      "If true, the agent decides whether to send a notification. If false, always notify.",
    ),
  useOutputFromPrev: z
    .boolean()
    .optional()
    .describe(
      "If true, the output of the previous job is injected as context before this job's prompt.",
    ),
  conditionType: z
    .enum([
      JobConditionType.NONE,
      JobConditionType.SKIP_IF_PREV_FAILED,
      JobConditionType.LLM,
    ])
    .optional()
    .describe(
      "Condition that must be met for this job to run. 'skip_if_prev_failed' skips if the previous job failed. 'llm' uses conditionPrompt evaluated against the previous result. Use 'llm' only for notification decisions, not for execution gating.",
    ),
  conditionPrompt: z
    .string()
    .optional()
    .describe(
      "Required when conditionType is 'llm'. Describes when this job should run.",
    ),
  maxRetries: z
    .number()
    .optional()
    .describe("Max retry attempts on failure. Defaults to 0 (no retry)."),
  retryDelayMinutes: z
    .number()
    .optional()
    .describe("Minutes to wait between retries. Defaults to 5."),
});

const schema = z.object({
  name: z.string().describe("Human-readable name for this schedule."),
  cronExpr: z
    .string()
    .describe(
      "5-field cron expression derived from the user's natural language description (e.g. 'every morning at 6AM' → '0 6 * * *'). Never ask the user for a cron expression — convert it yourself.",
    ),
  note: z
    .string()
    .optional()
    .describe("Optional description or notes for this schedule."),
  jobs: z
    .array(agentJobSchema)
    .min(1)
    .describe("List of agent jobs to run in sequence."),
});

export const createAgentScheduleTool = () =>
  new DynamicStructuredTool({
    name: "create_agent_schedule",
    description:
      "Create a new agent schedule. " +
      "Understand the user's intent in natural language and convert it to a cron expression internally. " +
      "Never ask the user for a cron expression.",
    schema: schema as any,
    func: async ({ name, cronExpr, note, jobs }: z.infer<typeof schema>) => {
      const listJob = jobs.map((job) => ({
        type: JobType.AGENT,
        order: job.order,
        prompt: job.prompt,
        notifyPlatform: job.notifyPlatform,
        notifyOnlyIfAgentSays: Boolean(job.notifyOnlyIfAgentSays),
        useOutputFromPrev: Boolean(job.useOutputFromPrev),
        conditionType: job.conditionType || JobConditionType.NONE,
        conditionPrompt: job.conditionPrompt,
        maxRetries: job.maxRetries || 0,
        retryDelayMinutes: job.retryDelayMinutes || 5,
        isRunWithSchedule: true,
      }));

      const [schedule, err] = await scheduleDB.createSchedule({
        name,
        cronExpr,
        note,
        type: ScheduleType.AGENT,
        isActive: true,
        isPaused: false,
        isCompleted: false,
        alertTelegram: false,
        repeat: "NO_REPEAT",
        startTime: Date.now(),
        listJob,
      });

      if (err || !schedule) {
        return safeStringify({
          error: err?.message || "Failed to create schedule",
        });
      }

      agentTaskScheduler.register(schedule);

      return safeStringify({
        message: `Agent schedule "${name}" created successfully.`,
        scheduleId: schedule.id,
        cronExpr,
        jobCount: jobs.length,
      });
    },
  });
