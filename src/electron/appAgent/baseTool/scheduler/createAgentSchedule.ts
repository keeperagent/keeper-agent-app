import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { scheduleDB } from "@/electron/database/schedule";
import { campaignDB } from "@/electron/database/campaign";
import { agentTaskScheduler } from "@/electron/service/agentTaskScheduler";
import { safeStringify } from "@/electron/appAgent/utils";
import { ToolContext } from "@/electron/appAgent/toolContext";
import {
  ScheduleType,
  JobType,
  JobConditionType,
  ICampaign,
  IWorkflow,
} from "@/electron/type";

const agentJobSchema = z.object({
  type: z
    .enum(["agent", "workflow"])
    .default("agent")
    .describe(
      "Job type: 'agent' runs an AI prompt, 'workflow' executes an existing workflow from a campaign.",
    ),
  order: z
    .number()
    .describe("Execution order (1-based). Lower numbers run first."),
  // agent-specific
  prompt: z
    .string()
    .optional()
    .describe("The task prompt for the agent (required when type is 'agent')."),
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
      "Condition that must be met for this job to run. 'skip_if_prev_failed' skips if the previous job failed. 'llm' uses conditionPrompt evaluated against the previous result.",
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
  // workflow-specific
  campaignName: z
    .string()
    .optional()
    .describe(
      "Exact campaign name containing the workflow (required when type is 'workflow').",
    ),
  workflowName: z
    .string()
    .optional()
    .describe("Exact workflow name to run (required when type is 'workflow')."),
  workflowVariables: z
    .array(z.object({ variable: z.string(), value: z.string() }))
    .optional()
    .describe(
      "Variable overrides to pass into the workflow (e.g. [{variable: 'TOKEN_ADDRESS', value: '0xabc...'}]).",
    ),
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
    .describe(
      "List of jobs to run in sequence. Mix 'agent' and 'workflow' types as needed.",
    ),
});

export const createAgentScheduleTool = (toolContext: ToolContext) =>
  new DynamicStructuredTool({
    name: "create_agent_schedule",
    description:
      "Create a new agent schedule with one or more jobs. Jobs can be AI prompt jobs ('agent' type) or workflow execution jobs ('workflow' type). " +
      "Understand the user's intent in natural language and convert it to a cron expression internally. " +
      "Never ask the user for a cron expression.",
    schema: schema as any,
    func: async ({ name, cronExpr, note, jobs }: z.infer<typeof schema>) => {
      const listJob: any[] = [];

      for (const job of jobs) {
        if (job.type === "workflow") {
          if (!job.campaignName || !job.workflowName) {
            return safeStringify({
              error: `Workflow job at order ${job.order} is missing campaignName or workflowName.`,
            });
          }

          const [listCampaignRes] = await campaignDB.getListCampaign(
            1,
            15,
            job.campaignName,
          );
          const campaigns: ICampaign[] = listCampaignRes?.data || [];

          let campaign: ICampaign | undefined;
          if (campaigns.length === 1) {
            campaign = campaigns[0];
          } else if (campaigns.length > 1) {
            return safeStringify({
              message: `Multiple campaigns found matching '${job.campaignName}'. Which one did you mean?`,
              campaigns: campaigns.map(
                (candidateCampaign: ICampaign) => candidateCampaign.name,
              ),
            });
          }

          if (!campaign) {
            return safeStringify({
              error: `Campaign '${job.campaignName}' not found.`,
            });
          }

          const allWorkflows = campaign.listWorkflow || [];
          let workflow: IWorkflow | undefined;
          const exactWorkflowMatch = allWorkflows.find(
            (candidateWorkflow: IWorkflow) =>
              candidateWorkflow?.name?.toLowerCase() ===
              job.workflowName!.toLowerCase(),
          );
          if (exactWorkflowMatch) {
            workflow = exactWorkflowMatch;
          } else {
            const partialWorkflowMatches = allWorkflows.filter(
              (candidateWorkflow: IWorkflow) =>
                candidateWorkflow?.name
                  ?.toLowerCase()
                  ?.includes(job.workflowName!.toLowerCase()),
            );
            if (partialWorkflowMatches.length === 1) {
              workflow = partialWorkflowMatches[0];
            } else if (partialWorkflowMatches.length > 1) {
              return safeStringify({
                message: `Multiple workflows found matching '${job.workflowName}' in campaign '${campaign.name}'. Which one did you mean?`,
                workflows: partialWorkflowMatches.map(
                  (candidateWorkflow: IWorkflow) => candidateWorkflow.name,
                ),
              });
            } else {
              return safeStringify({
                error: `Workflow '${job.workflowName}' not found in campaign '${campaign.name}'.`,
                availableWorkflows: allWorkflows.map(
                  (candidateWorkflow: IWorkflow) => candidateWorkflow.name,
                ),
              });
            }
          }

          listJob.push({
            type: JobType.WORKFLOW,
            order: job.order,
            campaignId: campaign.id,
            workflowId: workflow.id,
            isRunWithSchedule: true,
            toolContextJson: job.workflowVariables?.length
              ? JSON.stringify({ workflowVariables: job.workflowVariables })
              : undefined,
          });
        } else {
          listJob.push({
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
            llmProvider: toolContext.llmProvider,
          });
        }
      }

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
