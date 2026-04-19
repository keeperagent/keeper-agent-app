import { createMiddleware } from "langchain";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { restore } from "@keeperagent/crypto-key-guard";
import { logEveryWhere } from "@/electron/service/util";
import { ToolContext, PlanState } from "./toolContext";
import { sanitizeMemoryContent } from "./memorySanitizer";

// Tools always available regardless of active step type
const ALWAYS_ALLOWED_TOOLS = new Set([
  "write_todos",
  "request_approval",
  "confirm_approval",
  "read_file",
  "write_file",
  "edit_file",
  "ls",
  "glob",
  "grep",
]);

// Extra tools unlocked per step type (on top of ALWAYS_ALLOWED_TOOLS)
const STEP_EXTRA_TOOLS: Record<string, string[]> = {
  research: ["task"],
  visualize: ["task"],
  code: ["task", "write_javascript", "execute", "execute_javascript"],
  transaction: ["task"],
  workflow: ["task"],
  communicate: [],
  manage: ["task"],
};

// When `task` is called, which subagent_type is expected for each step type
const STEP_ALLOWED_SUBAGENTS: Record<string, string[]> = {
  research: ["research_agent"],
  visualize: ["visualization_agent"],
  code: ["code_execution_agent"],
  transaction: ["query_agent", "trade_agent", "transfer_agent", "launch_agent"],
  workflow: ["workflow_agent"],
  manage: [
    "scheduler_agent",
    "data_management_agent",
    "task_management_agent",
    "team_mailbox_agent",
  ],
};

const getToolName = (tool: any): string =>
  tool?.name || tool?.function?.name || "";

/**
 * When the agent passes a skill name (or other invalid value) as task
 * subagent_type, rewrite it to "Code execution agent" so the task runs
 * instead of throwing
 */
export const createTaskSkillRedirectMiddleware = (
  allowedSubagentNames: string[],
) => {
  const allowedSet = new Set(
    allowedSubagentNames.map((n) => n.toLowerCase().trim()),
  );
  return createMiddleware({
    name: "TaskSkillRedirect",
    wrapToolCall: async (request, handler) => {
      const toolName = (request as any).toolCall?.name;
      if (toolName !== "task") {
        return handler(request);
      }

      const toolCall = (request as any).toolCall;
      const argsKey = toolCall?.args != null ? "args" : "kwargs";
      const args = toolCall?.args || toolCall?.kwargs;
      const requestedType = args?.subagent_type;
      if (typeof requestedType !== "string") {
        return handler(request);
      }

      const key = requestedType.trim().toLowerCase();
      if (allowedSet.has(key)) {
        return handler(request);
      }

      const codeExecutionAgent = allowedSubagentNames.find(
        (name) => name.toLowerCase() === "code_execution_agent",
      );
      if (!codeExecutionAgent) {
        return handler(request);
      }

      return handler({
        ...request,
        toolCall: {
          ...toolCall,
          [argsKey]: { ...args, subagent_type: codeExecutionAgent },
        },
      });
    },
  });
};

/**
 * Middleware that restores redacted crypto secret tokens (e.g. [EVM_KEY_1])
 * back to their real values inside tool call arguments, so tools receive
 * actual keys while the LLM only ever sees safe placeholders.
 */
export const createSecretRestoreMiddleware = (toolContext: ToolContext) =>
  createMiddleware({
    name: "SecretRestore",
    wrapToolCall: async (request: any = {}, handler: any) => {
      if (toolContext.secrets.size === 0) {
        return handler(request);
      }

      const argsKey = request?.toolCall?.args != null ? "args" : "kwargs";
      const args = request?.toolCall?.args || request?.toolCall?.kwargs || {};
      if (!args) {
        return handler(request);
      }

      // Never restore secrets into memory file writes
      const toolName = request?.toolCall?.name;
      if (
        toolName === "write_file" &&
        String(args?.path || "").includes("/memories/")
      ) {
        return handler(request);
      }

      const argsStr = JSON.stringify(args);
      const restored = restore(argsStr, toolContext.secrets);
      if (restored === argsStr) {
        return handler(request);
      }

      try {
        const restoredArgs = JSON.parse(restored);
        return handler({
          ...request,
          toolCall: { ...request?.toolCall, [argsKey]: restoredArgs },
        });
      } catch {
        return handler(request);
      }
    },
  });

/**
 * Intercepts read_file calls to /skills/<folder>/... paths where the folder is not
 * in the enabled set, returning a hard-stop error before the backend is reached.
 * Saves tokens and LangGraph round trips from speculative skill path guessing.
 */
export const createSkillReadGuardMiddleware = (enabledFolders: Set<string>) =>
  createMiddleware({
    name: "SkillReadGuard",
    wrapToolCall: async (request: any, handler: any) => {
      const toolName = request?.toolCall?.name;
      if (toolName !== "read_file") {
        return handler(request);
      }
      const args = request?.toolCall?.args || request?.toolCall?.kwargs || {};
      const filePath: string = args?.path || args?.file_path || "";
      if (!filePath.startsWith("/skills/")) {
        return handler(request);
      }
      const folder = filePath.replace(/^\/skills\//, "").split("/")[0];
      if (!folder || enabledFolders.has(folder)) {
        return handler(request);
      }
      const available = [...enabledFolders].join(", ") || "none";
      throw new Error(
        `Skill '${folder}' does not exist. Available skills: [${available}]. Stop — do not attempt any other skill paths.`,
      );
    },
  });

/**
 * Strips misleading skill name examples injected by deepagents' SKILLS_SYSTEM_PROMPT
 * (e.g. "research X → web-research skill") that cause the agent to guess skill paths
 * not present in the actual Available Skills list.
 */
export const createSkillsPromptCleanMiddleware = () =>
  createMiddleware({
    name: "SkillsPromptClean",
    wrapModelCall: async (request: any, handler: any) => {
      const systemMessages: any[] = Array.isArray(request?.systemMessage)
        ? request.systemMessage
        : request?.systemMessage
          ? [request.systemMessage]
          : [];

      const hasTarget = systemMessages.some((msg) => {
        const content = typeof msg === "string" ? msg : msg?.content || "";
        return (
          typeof content === "string" && content.includes("web-research skill")
        );
      });

      if (!hasTarget) {
        return handler(request);
      }

      const cleaned = systemMessages.map((msg) => {
        const isString = typeof msg === "string";
        const content: string = isString ? msg : msg?.content || "";
        if (
          typeof content !== "string" ||
          !content.includes("web-research skill")
        ) {
          return msg;
        }
        const newContent = content
          .replace(
            /\(e\.g\.,?\s*[""]?research X[""]?\s*→\s*web-research skill[""]?\)/gi,
            "",
          )
          .replace(
            /- When the user's request matches a skill's domain[^\n]*/g,
            "- Only use a skill if its exact name appears in the Available Skills list above.",
          );
        return isString ? newContent : { ...msg, content: newContent };
      });

      return handler({ ...request, systemMessage: cleaned });
    },
  });

/**
 * Enforces typed todo-driven execution:
 * 1. Intercepts write_todos to read the `type` field on in_progress items (before zod strips it)
 *    and stores it in toolContext.currentStepType.
 * 2. Filters the tool list in wrapModelCall so only tools relevant to the current step are visible.
 * 3. Prevents multiple subagent (task) calls in the same model turn via afterModel.
 */
export const createStepScopingMiddleware = (toolContext: ToolContext) => {
  let lastKnownTodos: any[] = [];
  let nextTodoId = 1;
  let taskCallCounts = new Map<string, number>(); // subagent_type → calls in current step
  let completedStepResults: { stepName: string; content: string }[] = [];

  toolContext.update({
    resetStepState: () => {
      lastKnownTodos = [];
      nextTodoId = 1;
      taskCallCounts.clear();
      completedStepResults = [];
    },
  });

  return createMiddleware({
    name: "StepScoping",

    wrapToolCall: async (request: any, handler: any) => {
      const toolName = request?.toolCall?.name;

      // Capture step type from write_todos args BEFORE zod strips the `type` field
      if (toolName === "write_todos") {
        let todos: any[] =
          request?.toolCall?.args?.todos ||
          request?.toolCall?.kwargs?.todos ||
          [];

        // Auto-assign stable IDs to items that arrive without one
        todos = todos.map((t: any) => {
          if (t.id) {
            return t;
          }
          const known = lastKnownTodos.find(
            (k: any) => k.id && k.content === t.content,
          );
          return { ...t, id: known ? known.id : nextTodoId++ };
        });

        // Detect step change to reset retry counts
        const prevActiveContent = lastKnownTodos.find(
          (t: any) => t.status === "in_progress",
        )?.content;

        // New plan detection: if none of the incoming IDs match any known ID, reset to avoid
        // cross-turn leakage (old completed steps from a previous conversation turn)
        const hasAnyKnownId = todos.some((t: any) =>
          lastKnownTodos.some((k: any) => k.id === t.id),
        );
        if (!hasAnyKnownId && lastKnownTodos.length > 0) {
          lastKnownTodos = [];
          nextTodoId = 1;
          taskCallCounts.clear();
        }

        // Prevent status regression (completed → non-completed) and re-add dropped completed items
        // Only re-add "completed" items — never re-add in_progress/pending from a previous plan
        const mergedTodos = todos.map((t: any) => {
          const known = lastKnownTodos.find((k: any) => k.id && k.id === t.id);
          if (known?.status === "completed" && t.status !== "completed") {
            return { ...t, status: "completed" };
          }
          return t;
        });
        const todoIds = new Set(mergedTodos.map((t: any) => t.id));
        const dropped = lastKnownTodos.filter(
          (t: any) => t.id && !todoIds.has(t.id) && t.status === "completed",
        );
        todos = [...mergedTodos, ...dropped];
        request.toolCall.args = { ...request.toolCall.args, todos };
        lastKnownTodos = todos;

        const newActiveContent = todos.find(
          (t: any) => t.status === "in_progress",
        )?.content;
        if (prevActiveContent !== newActiveContent) {
          taskCallCounts.clear();
        }

        const inProgressItems = todos.filter(
          (todo: any) => todo.status === "in_progress",
        );
        if (inProgressItems.length > 1) {
          const titles = inProgressItems
            .map((todo: any) => `"${todo.content || todo.title || "unknown"}"`)
            .join(", ");
          return new ToolMessage({
            content: `Error: Only one step can be in_progress at a time. Found ${inProgressItems.length} in_progress items: [${titles}]. Mark the current step done before starting the next.`,
            tool_call_id: request?.toolCall?.id || "",
            status: "error",
          });
        }

        const activeStep = inProgressItems[0] || null;
        if (activeStep && !activeStep.type) {
          return new ToolMessage({
            content:
              `Error: Todo item "${activeStep.content || "unknown"}" is missing the required "type" field. ` +
              `Every in_progress item must have a type: research, visualize, code, transaction, workflow, manage, or communicate.`,
            tool_call_id: request?.toolCall?.id || "",
            status: "error",
          });
        }

        toolContext.update({ currentStepType: activeStep?.type || null });

        const writeTodosResult = await handler(request);
        const writeTodosContent =
          typeof writeTodosResult?.content === "string"
            ? writeTodosResult.content
            : "OK";
        const idNote = `\n[Framework] IDs: {${todos.map((t: any) => `${t.id}:"${String(t.content).slice(0, 50)}"`).join(", ")}}. Preserve the id field in all future write_todos calls.`;
        return new ToolMessage({
          content: writeTodosContent + idNote,
          tool_call_id:
            writeTodosResult?.tool_call_id || request?.toolCall?.id || "",
        });
      }

      // Validate task subagent_type against current step, then auto-advance on success
      if (toolName === "task") {
        // Block task call if write_todos has never been called (no plan exists yet)
        if (lastKnownTodos.length === 0) {
          const earlyArgs =
            request?.toolCall?.args || request?.toolCall?.kwargs || {};
          const requestedSubagent = earlyArgs?.subagent_type || "unknown";
          logEveryWhere({
            message: `[StepScoping] Blocked task("${requestedSubagent}") — write_todos not called yet`,
          });
          return new ToolMessage({
            content: `Error: You must call write_todos to create your plan before calling task. Create your full todo plan first, mark the first step as in_progress, then call task.`,
            tool_call_id: request?.toolCall?.id || "",
            status: "error",
          });
        }

        const stepType = toolContext.currentStepType;
        const allowedSubagents = stepType
          ? STEP_ALLOWED_SUBAGENTS[stepType]
          : null;
        if (allowedSubagents) {
          const args =
            request?.toolCall?.args || request?.toolCall?.kwargs || {};
          const requestedType: string = args?.subagent_type || "";
          if (requestedType && !allowedSubagents.includes(requestedType)) {
            logEveryWhere({
              message: `[StepScoping] Blocked task call — stepType="${stepType}" requested="${requestedType}" description="${args?.description || ""}"`,
            });
            return new ToolMessage({
              content:
                `Error: Step type "${stepType}" only allows [${allowedSubagents.join(", ")}] as subagent_type. Got "${requestedType}". ` +
                `Do NOT add new todo items. Call write_todos to mark the next planned step in_progress and proceed according to your existing todo plan.`,
              tool_call_id: request?.toolCall?.id || "",
              status: "error",
            });
          }
        }

        // Block code_execution_agent if no code has been approved yet
        const taskArgs =
          request?.toolCall?.args || request?.toolCall?.kwargs || {};
        if (
          taskArgs?.subagent_type === "code_execution_agent" &&
          !toolContext.pendingCode
        ) {
          logEveryWhere({
            message: `[StepScoping] Blocked code_execution_agent — no pending code`,
          });
          return new ToolMessage({
            content:
              "Error: No approved code found. You must call `write_javascript` with the complete code first, then call `confirm_approval` so the user can review it. Only after approval is granted should you delegate to code_execution_agent.",
            tool_call_id: request?.toolCall?.id || "",
            status: "error",
          });
        }

        // Enforce retry limit: max 1 call per subagent_type per step (no retries)
        const subagentType = taskArgs?.subagent_type || "unknown";
        const callCount = taskCallCounts.get(subagentType) || 0;
        if (callCount >= 1) {
          logEveryWhere({
            message: `[StepScoping] Retry limit hit — ${subagentType} already called once in current step`,
          });
          return new ToolMessage({
            content: `Error: ${subagentType} already failed for this step. Do not retry — report the failure to the user instead.`,
            tool_call_id: request?.toolCall?.id || "",
            status: "error",
          });
        }

        // Block task call if no step is currently in_progress (retry after auto-advance)
        const hasPlan = lastKnownTodos.length > 0;
        const hasActiveStep = lastKnownTodos.some(
          (t: any) => t.status === "in_progress",
        );
        if (hasPlan && !hasActiveStep) {
          logEveryWhere({
            message: `[StepScoping] Blocked "${subagentType}" — no step in_progress, retrying a completed step`,
          });
          return new ToolMessage({
            content: `Error: No step is currently in_progress. You cannot retry a completed step. Call write_todos to mark the next step as in_progress and proceed with your plan.`,
            tool_call_id: request?.toolCall?.id || "",
            status: "error",
          });
        }

        // Enforce approval gate — block execution subagents until planState is APPROVED.
        // trade/transfer/launch always require approval (they only perform on-chain execution).
        // workflow_agent requires approval only for "workflow" step type (run_workflow) —
        // not for search/list/check operations which use a "manage" or "transaction" step type.
        const ALWAYS_APPROVAL_REQUIRED = new Set([
          "trade_agent",
          "transfer_agent",
          "launch_agent",
        ]);
        const needsApproval =
          ALWAYS_APPROVAL_REQUIRED.has(subagentType) ||
          (subagentType === "workflow_agent" &&
            toolContext.currentStepType === "workflow");
        if (needsApproval && toolContext.planState !== PlanState.APPROVED) {
          logEveryWhere({
            message: `[StepScoping] Blocked task("${subagentType}") — planState="${toolContext.planState}" stepType="${toolContext.currentStepType}" (APPROVED required)`,
          });
          return new ToolMessage({
            content:
              `Error: Cannot delegate to ${subagentType} without user approval. ` +
              `You MUST follow the approval gate in order: ` +
              `(1) call request_approval now, ` +
              `(2) call confirm_approval with a markdown summary table, ` +
              `(3) only AFTER approval is granted, call task("${subagentType}").`,
            tool_call_id: request?.toolCall?.id || "",
            status: "error",
          });
        }

        // Count this as an execution attempt only after all soft blocks pass
        taskCallCounts.set(subagentType, callCount + 1);

        // Execute the task, then auto-advance the in_progress step to completed on success
        const taskResult = await handler(request);
        logEveryWhere({
          message: `[StepScoping] task raw result — type="${typeof taskResult}" hasContent=${Boolean(taskResult?.content)} status="${taskResult?.status || ""}" updateMsgCount=${taskResult?.update?.messages?.length || 0}`,
        });
        if (
          Array.isArray(taskResult?.update?.messages) &&
          taskResult.update.messages.length > 0
        ) {
          const msgs = taskResult.update.messages;
          const tail = msgs
            .slice(-3)
            .map((m: any, idx: number) => {
              const t =
                m?.constructor?.name ||
                m?.lc_id?.slice?.(-1)?.[0] ||
                m?._getType?.() ||
                "?";
              const c = m?.content;
              const cStr =
                typeof c === "string"
                  ? c.slice(0, 80)
                  : Array.isArray(c)
                    ? `[array:${c.length}]`
                    : String(c || "").slice(0, 30);
              return `[${msgs.length - 3 + idx}]t=${t},tc=${m?.tool_calls?.length || 0},c="${cStr}"`;
            })
            .join(" | ");
          logEveryWhere({ message: `[StepScoping] messages tail: ${tail}` });
        }

        // taskResult is a LangGraph Command — content lives in update.messages
        const extractResultContent = (result: any): string => {
          const unwrap = (raw: string): string => {
            try {
              const parsed = JSON.parse(raw);
              if (typeof parsed?.result === "string") {
                return parsed.result;
              }
            } catch {}
            return raw;
          };

          const contentToString = (content: any): string => {
            if (typeof content === "string") {
              return content;
            }
            if (Array.isArray(content)) {
              return content
                .map((block: any) => {
                  if (typeof block === "string") {
                    return block;
                  }
                  if (typeof block?.text === "string") {
                    return block.text;
                  }
                  return "";
                })
                .join("")
                .trim();
            }
            return "";
          };

          if (result?.content) {
            const direct = contentToString(result.content);
            if (direct) {
              return unwrap(direct);
            }
          }

          const messages: any[] = Array.isArray(result?.update?.messages)
            ? result.update.messages
            : [];
          // Walk in reverse — deepagents with responseFormat stores the structured output
          // as a ToolMessage (not an AIMessage) so we check all message types.
          for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const rawContent = msg?.content ?? msg?.kwargs?.content;
            const content = contentToString(rawContent);
            if (content.trim()) {
              return unwrap(content);
            }
            // Fallback: structured output may live in additional_kwargs
            const additionalKwargs =
              msg?.additional_kwargs || msg?.kwargs?.additional_kwargs || {};
            const funcArgs =
              additionalKwargs?.function_call?.arguments ||
              additionalKwargs?.tool_calls?.[0]?.function?.arguments;
            if (typeof funcArgs === "string" && funcArgs.trim()) {
              return unwrap(funcArgs);
            }
          }
          return "";
        };

        const resultContent = extractResultContent(taskResult);
        const taskFailed =
          taskResult?.status === "error" ||
          resultContent.startsWith("Error:") ||
          resultContent.startsWith("error:") ||
          resultContent.includes("blocked_planning_mode");
        logEveryWhere({
          message: `[StepScoping] task("${subagentType}") done — taskFailed=${taskFailed} resultContent="${resultContent.slice(0, 300)}"`,
        });

        if (!taskFailed) {
          const inProgressIndex = lastKnownTodos.findIndex(
            (t: any) => t.status === "in_progress",
          );
          if (inProgressIndex !== -1) {
            const completedStep = lastKnownTodos[inProgressIndex];
            lastKnownTodos = lastKnownTodos.map((t: any, index: number) =>
              index === inProgressIndex ? { ...t, status: "completed" } : t,
            );
            toolContext.update({ currentStepType: null });
            taskCallCounts.clear();
            if (resultContent) {
              const truncated =
                resultContent.length > 1200
                  ? resultContent.slice(0, 1200) + "..."
                  : resultContent;
              completedStepResults.push({
                stepName: completedStep.content,
                content: truncated,
              });
              logEveryWhere({
                message: `[StepScoping] Stored completedStepResult for "${completedStep.content}": ${truncated}`,
              });
            }
            logEveryWhere({
              message: `[StepScoping] Auto-advanced "${completedStep.content}" → completed`,
            });
            toolContext.onStepAdvanced?.(completedStep.content, lastKnownTodos);
            const allDone = lastKnownTodos.every(
              (t: any) => t.status === "completed",
            );
            const note = allDone
              ? `\n\n[Framework] Step "${completedStep.content}" has been automatically marked as completed. All steps are complete — give your final response.`
              : `\n\n[Framework] Step "${completedStep.content}" has been automatically marked as completed. Call write_todos to mark the next step as in_progress.`;
            return new ToolMessage({
              content: resultContent + note,
              tool_call_id:
                taskResult?.tool_call_id || request?.toolCall?.id || "",
            });
          }
        }

        return taskResult;
      }

      // Enforce: if write_todos was called at least once but no item is in_progress, block execution tools
      const PLANNING_EXEMPT_TOOLS = new Set([
        "write_todos",
        "request_approval",
        "confirm_approval",
        "read_file",
      ]);
      const hasTodoPlan = lastKnownTodos.length > 0;
      const hasInProgress = lastKnownTodos.some(
        (todo: any) => todo.status === "in_progress",
      );
      if (
        hasTodoPlan &&
        !hasInProgress &&
        !ALWAYS_ALLOWED_TOOLS.has(toolName) &&
        !PLANNING_EXEMPT_TOOLS.has(toolName)
      ) {
        logEveryWhere({
          message: `[StepScoping] Blocked "${toolName}" — todo plan exists but no step is in_progress`,
        });
        return new ToolMessage({
          content:
            `Error: You have a todo plan but no step is currently in_progress. ` +
            `Call write_todos to mark the next step as in_progress before calling "${toolName}".`,
          tool_call_id: request?.toolCall?.id || "",
          status: "error",
        });
      }

      return handler(request);
    },

    wrapModelCall: async (request: any, handler: any) => {
      let updatedRequest = request;

      // Inject reminder if any todos are still in_progress
      const inProgressTodos = lastKnownTodos.filter(
        (t: any) => t.status === "in_progress",
      );
      if (inProgressTodos.length > 0) {
        const names = inProgressTodos
          .map((t: any) => `"${t.content || t.title || "unknown"}"`)
          .join(", ");
        const isCommunicate = inProgressTodos.every(
          (t: any) => t.type === "communicate",
        );
        const isTransaction = inProgressTodos.some(
          (t: any) => t.type === "transaction",
        );
        const currentPlanState = toolContext.planState;
        const transactionNextStep = (() => {
          if (!currentPlanState || currentPlanState === "idle") {
            return "Your next action MUST be: call request_approval now.";
          }
          if (currentPlanState === "drafted") {
            return "request_approval already called. Your next action MUST be: call confirm_approval with a summary table now. Do NOT call task yet.";
          }
          if (currentPlanState === "approved") {
            return "Approval granted. Your next action MUST be: call task with the appropriate subagent now.";
          }
          return "Follow the approval gate: request_approval → confirm_approval → task.";
        })();
        if (isTransaction) {
          logEveryWhere({
            message: `[StepScoping] In-progress reminder — isTransaction=true planState="${currentPlanState}" transactionNextStep="${transactionNextStep}"`,
          });
        }
        const reminder = isCommunicate
          ? `\n\nREMINDER: The following todo ${inProgressTodos.length === 1 ? "item is" : "items are"} still in_progress: [${names}]. ` +
            `Give your response — the framework will mark ${inProgressTodos.length === 1 ? "it" : "them"} completed automatically.`
          : isTransaction
            ? `\n\nREMINDER: The following todo ${inProgressTodos.length === 1 ? "item is" : "items are"} still in_progress: [${names}]. ` +
              `This is a transaction step. ${transactionNextStep}`
            : `\n\nREMINDER: The following todo ${inProgressTodos.length === 1 ? "item is" : "items are"} still in_progress: [${names}]. ` +
              `Call task with the appropriate subagent to execute ${inProgressTodos.length === 1 ? "it" : "them"} — the framework will mark ${inProgressTodos.length === 1 ? "it" : "them"} completed automatically when the task succeeds.`;
        const currentSystem = updatedRequest?.systemMessage;
        if (typeof currentSystem === "string") {
          updatedRequest = {
            ...updatedRequest,
            systemMessage: currentSystem + reminder,
          };
        } else if (Array.isArray(currentSystem) && currentSystem.length > 0) {
          const last = currentSystem[currentSystem.length - 1];
          const updatedLast =
            typeof last === "string"
              ? last + reminder
              : { ...last, content: (last?.content || "") + reminder };
          updatedRequest = {
            ...updatedRequest,
            systemMessage: [...currentSystem.slice(0, -1), updatedLast],
          };
        }
      }

      // Inject reminder when plan has pending todos but nothing is in_progress
      // (happens right after auto-advance — prevents the LLM from retrying task before calling write_todos)
      const hasPendingTodos = lastKnownTodos.some(
        (t: any) => t.status !== "completed",
      );
      if (
        lastKnownTodos.length > 0 &&
        inProgressTodos.length === 0 &&
        hasPendingTodos
      ) {
        const nextTodo = lastKnownTodos.find(
          (t: any) => t.status !== "completed",
        );
        const nextName = nextTodo?.content || "the next step";
        logEveryWhere({
          message: `[StepScoping] Pending reminder — nextStep="${nextName}" completedStepResults=${completedStepResults.length}`,
        });
        let pendingReminder =
          `\n\nREMINDER: Your todo plan has pending steps but none is currently in_progress. ` +
          `You MUST call write_todos to mark "${nextName}" as in_progress — do NOT call task before doing so.`;
        if (completedStepResults.length > 0) {
          const resultsContext = completedStepResults
            .map((r) => `\n- "${r.stepName}": ${r.content}`)
            .join("");
          pendingReminder += `\n\nData from completed steps (use this — do NOT re-fetch):${resultsContext}`;
          pendingReminder += `\n\nCRITICAL: The data above is already fetched. For the next step, use it directly — do NOT call query_agent again. If the next step is a swap or sell: (1) call write_todos to mark it in_progress, (2) call request_approval, (3) call confirm_approval with a summary table, (4) only after approval is granted, delegate to trade_agent with the amounts calculated from the data above.`;
        }
        const currentSystem = updatedRequest?.systemMessage;
        if (typeof currentSystem === "string") {
          updatedRequest = {
            ...updatedRequest,
            systemMessage: currentSystem + pendingReminder,
          };
        } else if (Array.isArray(currentSystem) && currentSystem.length > 0) {
          const last = currentSystem[currentSystem.length - 1];
          const updatedLast =
            typeof last === "string"
              ? last + pendingReminder
              : { ...last, content: (last?.content || "") + pendingReminder };
          updatedRequest = {
            ...updatedRequest,
            systemMessage: [...currentSystem.slice(0, -1), updatedLast],
          };
        }
      }

      // Filter tools to only those relevant to the current step type
      const stepType = toolContext.currentStepType;
      if (
        !stepType ||
        !Array.isArray(updatedRequest?.tools) ||
        updatedRequest.tools.length === 0
      ) {
        return handler(updatedRequest);
      }

      const scopeForType = STEP_EXTRA_TOOLS[stepType];
      if (!scopeForType) {
        return handler(updatedRequest);
      }

      const allowed = new Set([...ALWAYS_ALLOWED_TOOLS, ...scopeForType]);
      const filteredTools = updatedRequest.tools.filter((tool: any) =>
        allowed.has(getToolName(tool)),
      );

      return handler({ ...updatedRequest, tools: filteredTools });
    },

    afterModel: (state: any) => {
      const messages: any[] = state?.messages;
      if (!messages?.length) return;

      const lastAiMsg = [...messages]
        .reverse()
        .find((msg: any) => AIMessage.isInstance(msg));
      if (!lastAiMsg) return;

      // Strip preamble text when tool calls are present — it's reasoning noise that
      // wastes input tokens on every subsequent turn without adding value
      if (lastAiMsg?.tool_calls?.length && lastAiMsg.content) {
        lastAiMsg.content = "";
      }

      // Auto-advance communicate steps when LLM gives a text response (no tool calls)
      if (!lastAiMsg?.tool_calls?.length) {
        const communicateIndex = lastKnownTodos.findIndex(
          (t: any) => t.status === "in_progress" && t.type === "communicate",
        );
        if (communicateIndex !== -1) {
          const completedStep = lastKnownTodos[communicateIndex];
          lastKnownTodos = lastKnownTodos.map((t: any, index: number) =>
            index === communicateIndex ? { ...t, status: "completed" } : t,
          );
          toolContext.update({ currentStepType: null });
          taskCallCounts.clear();
          logEveryWhere({
            message: `[StepScoping] Auto-advanced communicate "${completedStep.content}" → completed`,
          });
          toolContext.onStepAdvanced?.(completedStep.content, lastKnownTodos);
        }
        return;
      }

      const taskCalls = lastAiMsg.tool_calls.filter(
        (tc: any) => tc.name === "task",
      );
      if (taskCalls.length <= 1) return;

      // Block multiple task (subagent) calls in the same turn
      return {
        messages: taskCalls.slice(1).map(
          (tc: any) =>
            new ToolMessage({
              content:
                "Error: Only one subagent delegation per turn. Wait for the current task to complete, mark it done in write_todos, then start the next.",
              tool_call_id: tc.id,
              status: "error",
            }),
        ),
      };
    },
  });
};

/**
 * Blocks confirm_approval if request_approval hasn't been called first (planState not DRAFTED).
 */
export const createConfirmApprovalGuardMiddleware = (
  toolContext: ToolContext,
) =>
  createMiddleware({
    name: "ConfirmApprovalGuard",
    wrapToolCall: async (request: any, handler: any) => {
      if (request?.toolCall?.name !== "confirm_approval") {
        return handler(request);
      }
      if (toolContext.planState !== PlanState.DRAFTED) {
        logEveryWhere({
          message: `[ConfirmApprovalGuard] Blocked confirm_approval — planState="${toolContext.planState}"`,
        });
        return new ToolMessage({
          content:
            "Error: You must call `request_approval` before `confirm_approval`. Call `request_approval` now to enter approval mode, then call `confirm_approval`.",
          tool_call_id: request?.toolCall?.id || "",
          status: "error",
        });
      }
      return handler(request);
    },
  });

/**
 * Blocks the deepagents built-in `execute` shell tool unless planning mode has
 * been approved — mirrors the same gate used by execute_javascript.
 */
export const createExecuteGuardMiddleware = (toolContext: ToolContext) =>
  createMiddleware({
    name: "ExecuteGuard",
    wrapToolCall: async (request: any, handler: any) => {
      if (request?.toolCall?.name !== "execute") {
        return handler(request);
      }
      if (toolContext.planState !== PlanState.APPROVED) {
        throw new Error(
          "Shell execution requires planning mode approval. Call request_approval first, then confirm_approval for user approval.",
        );
      }
      return handler(request);
    },
  });

/**
 * Intercepts write_file calls targeting memory files (/memories/) and strips
 * lines that contain tool names or injection phrases before they are written to disk.
 * This prevents prompt-injected instructions from being persisted across sessions.
 */
export const createMemoryWriteGuardMiddleware = () =>
  createMiddleware({
    name: "MemoryWriteGuard",
    wrapToolCall: async (request: any = {}, handler: any) => {
      const toolName = (request as any).toolCall?.name;
      if (toolName !== "write_file") {
        return handler(request);
      }

      const argsKey = request?.toolCall?.args != null ? "args" : "kwargs";
      const args = request?.toolCall?.args || request?.toolCall?.kwargs || {};
      const filePath: string = args?.path || "";

      if (!filePath.includes("/memories/")) {
        return handler(request);
      }

      const originalContent: string = args?.content || "";
      const sanitizedContent = sanitizeMemoryContent(originalContent);

      if (sanitizedContent !== originalContent) {
        logEveryWhere({
          message: `[MemoryWriteGuard] Stripped injected content from memory write to ${filePath}`,
        });
      }

      return handler({
        ...request,
        toolCall: {
          ...request.toolCall,
          [argsKey]: { ...args, content: sanitizedContent },
        },
      });
    },
  });
